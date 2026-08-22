interface Env {
  DB: D1Database;
  ADMIN_API_TOKEN?: string;
}

const VALID_STATUS = ["draft", "published", "archived"] as const;

type QuestionInput = {
  category?: unknown;
  subCategory?: unknown;
  title?: unknown;
  questionText?: unknown;
  tables?: unknown;
  options?: unknown;
  correctAnswer?: unknown;
  explanation?: unknown;
  difficulty?: unknown;
  status?: unknown;
  originalityNote?: unknown;
  passageGroupId?: unknown;
  imageDataUri?: unknown;
};

type ValidatedQuestion = {
  category: string;
  subCategory: string;
  title: string | null;
  questionText: string;
  tablesJson: string | null;
  optionsJson: string;
  correctAnswer: number;
  explanationJson: string;
  difficulty: number;
  status: string;
  originalityNote: string | null;
  passageGroupId: number | null;
  imageDataUri: string | null;
};

// 1件分の入力を検証し、DB保存用に正規化する。不正な場合はエラーメッセージを返す。
function validateQuestion(input: QuestionInput, index: number): ValidatedQuestion | { error: string } {
  const label = `questions[${index}]`;

  if (typeof input.category !== "string" || !input.category.trim()) {
    return { error: `${label}: categoryは必須です` };
  }
  if (typeof input.subCategory !== "string" || !input.subCategory.trim()) {
    return { error: `${label}: subCategoryは必須です` };
  }
  if (typeof input.questionText !== "string" || !input.questionText.trim()) {
    return { error: `${label}: questionTextは必須です` };
  }
  if (
    !Array.isArray(input.options) ||
    input.options.length < 2 ||
    input.options.length > 5 ||
    !input.options.every((o) => typeof o === "string" && o.trim())
  ) {
    return { error: `${label}: optionsは2〜5件の空でない文字列配列で指定してください` };
  }
  if (
    typeof input.correctAnswer !== "number" ||
    !Number.isInteger(input.correctAnswer) ||
    input.correctAnswer < 0 ||
    input.correctAnswer >= input.options.length
  ) {
    return { error: `${label}: correctAnswerはoptionsの範囲内のインデックスで指定してください` };
  }
  if (
    !Array.isArray(input.explanation) ||
    input.explanation.length === 0 ||
    !input.explanation.every((e) => typeof e === "string" && e.trim())
  ) {
    return { error: `${label}: explanationは1件以上の空でない文字列配列で指定してください` };
  }

  let difficulty = 3;
  if (input.difficulty !== undefined) {
    if (typeof input.difficulty !== "number" || !Number.isInteger(input.difficulty) || input.difficulty < 1 || input.difficulty > 5) {
      return { error: `${label}: difficultyは1〜5の整数で指定してください` };
    }
    difficulty = input.difficulty;
  }

  let status = "published";
  if (input.status !== undefined) {
    if (typeof input.status !== "string" || !(VALID_STATUS as readonly string[]).includes(input.status)) {
      return { error: `${label}: statusは draft/published/archived のいずれかで指定してください` };
    }
    status = input.status;
  }

  if (input.title !== undefined && input.title !== null && typeof input.title !== "string") {
    return { error: `${label}: titleは文字列で指定してください` };
  }
  if (input.originalityNote !== undefined && input.originalityNote !== null && typeof input.originalityNote !== "string") {
    return { error: `${label}: originalityNoteは文字列で指定してください` };
  }
  if (input.tables !== undefined && input.tables !== null && typeof input.tables !== "object") {
    return { error: `${label}: tablesはオブジェクト配列で指定してください` };
  }
  if (
    input.passageGroupId !== undefined &&
    input.passageGroupId !== null &&
    (typeof input.passageGroupId !== "number" || !Number.isInteger(input.passageGroupId))
  ) {
    return { error: `${label}: passageGroupIdは整数で指定してください` };
  }
  if (
    input.imageDataUri !== undefined &&
    input.imageDataUri !== null &&
    (typeof input.imageDataUri !== "string" || !input.imageDataUri.startsWith("data:image/"))
  ) {
    return { error: `${label}: imageDataUriはdata:image/で始まる文字列で指定してください` };
  }

  return {
    category: input.category.trim(),
    subCategory: input.subCategory.trim(),
    title: typeof input.title === "string" ? input.title : null,
    questionText: input.questionText,
    tablesJson: input.tables ? JSON.stringify(input.tables) : null,
    optionsJson: JSON.stringify(input.options),
    correctAnswer: input.correctAnswer,
    explanationJson: JSON.stringify(input.explanation),
    difficulty,
    status,
    originalityNote: typeof input.originalityNote === "string" ? input.originalityNote : null,
    passageGroupId: typeof input.passageGroupId === "number" ? input.passageGroupId : null,
    imageDataUri: typeof input.imageDataUri === "string" ? input.imageDataUri : null,
  };
}

// 開発者・管理者用の問題追加API。単発（1オブジェクト）または一括（{questions:[...]}）どちらの
// リクエストボディにも対応する。x-admin-token ヘッダーが ADMIN_API_TOKEN と一致しない限り拒否する
// （このアプリには管理者ログイン機構が無いため、共有シークレットによる簡易ゲートとした）。
export const onRequestPost: PagesFunction<Env> = async (context) => {
  const adminToken = context.env.ADMIN_API_TOKEN;
  if (!adminToken) {
    return Response.json({ error: "管理APIが設定されていません" }, { status: 503 });
  }
  if (context.request.headers.get("x-admin-token") !== adminToken) {
    return Response.json({ error: "認証に失敗しました" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await context.request.json();
  } catch {
    return Response.json({ error: "不正なリクエストです" }, { status: 400 });
  }

  const inputs: QuestionInput[] = Array.isArray((body as { questions?: unknown })?.questions)
    ? ((body as { questions: QuestionInput[] }).questions)
    : [body as QuestionInput];

  if (inputs.length === 0) {
    return Response.json({ error: "questionsが空です" }, { status: 400 });
  }

  const validated: ValidatedQuestion[] = [];
  for (let i = 0; i < inputs.length; i++) {
    const result = validateQuestion(inputs[i] ?? {}, i);
    if ("error" in result) {
      return Response.json({ error: result.error }, { status: 400 });
    }
    validated.push(result);
  }

  const insertedIds: number[] = [];
  for (const q of validated) {
    const row = await context.env.DB.prepare(
      `INSERT INTO questions
        (category, sub_category, title, question_text, tables_json, options, correct_answer, explanation, difficulty, status, originality_note, passage_group_id, image_data_uri)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       RETURNING id`
    )
      .bind(
        q.category,
        q.subCategory,
        q.title,
        q.questionText,
        q.tablesJson,
        q.optionsJson,
        q.correctAnswer,
        q.explanationJson,
        q.difficulty,
        q.status,
        q.originalityNote,
        q.passageGroupId,
        q.imageDataUri
      )
      .first<{ id: number }>();
    if (row) insertedIds.push(row.id);
  }

  return Response.json({ ok: true, insertedIds, count: insertedIds.length });
};
