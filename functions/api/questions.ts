import { toClientQuestion, type QuestionRow } from "../_lib/questionFormat";
import { getAuthenticatedSubjectId } from "../_lib/session";

interface Env {
  DB: D1Database;
}

const DEFAULT_LIMIT = 10;
// 基礎能力試験（35分タイムボックス制、app/test/page.tsxのBasicExamFlow）が言語・非言語それぞれ
// 150問のプールを事前取得するため、通常上限もそれを許容できる値にしている。
const MAX_LIMIT = 200;
// statusFilter（未回答のみ/×＋△のみ復習）指定時は、該当する問題を全件出題する意図のため、
// 通常のランダム抽出より大幅に高い上限を設ける。
const STATUS_FILTER_MAX_LIMIT = 300;

type Row = QuestionRow & { passage_group_id: number | null };

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// 出題対象の問題を取得する。?category= / ?subCategory= はそれぞれ複数指定するとOR条件、
// ?difficulty= は完全一致、?limit= は取得件数（デフォルト10、最大50）。status='published' の問題のみを対象とする。
// 同じ長文から出題される設問（GAB形式の論理的読解等、passage_group_idが同一の問題）は、
// シャッフル後も常にグループ内の順序（id昇順）を保ったまま連続して出題されるようにする。
// ?statusFilter= は練習問題の自己評価ステータス（user_question_statuses）による絞り込み。
// 'wrong_uncertain'（×不正解＋△自信なしのみ）または 'unanswered'（未回答のみ）を指定するとログイン必須になる
// （ユーザー自身のステータスに基づく絞り込みのため）。未指定時は従来通り誰でも取得できる。
// ?mockOnly=1 を指定すると is_mock_only=1（本番模試専用に切り分けた問題）のみを対象にする。
// 未指定時（デフォルト）は is_mock_only=0 のみを対象とし、練習問題モードの一覧・出題には
// 模試専用問題が一切混ざらないようにする（SCOAのみ現状この分離運用、他テストは全問is_mock_only=0のまま）。
export const onRequestGet: PagesFunction<Env> = async (context) => {
  const params = new URL(context.request.url).searchParams;
  const categories = params.getAll("category").filter(Boolean);
  const subCategories = params.getAll("subCategory").filter(Boolean);
  const difficultyRaw = params.get("difficulty");
  const difficulty = difficultyRaw !== null ? Number(difficultyRaw) : null;
  const statusFilter = params.get("statusFilter");
  const mockOnly = params.get("mockOnly") === "1";
  const effectiveMaxLimit =
    statusFilter === "wrong_uncertain" || statusFilter === "unanswered" ? STATUS_FILTER_MAX_LIMIT : MAX_LIMIT;
  const limitRaw = params.get("limit");
  const limit = Math.min(
    Math.max(limitRaw !== null && !Number.isNaN(Number(limitRaw)) ? Number(limitRaw) : DEFAULT_LIMIT, 1),
    effectiveMaxLimit
  );

  let userId: number | null = null;
  if (statusFilter === "wrong_uncertain" || statusFilter === "unanswered") {
    userId = await getAuthenticatedSubjectId(context.env.DB, context.request, "user");
    if (!userId) {
      return Response.json({ error: "ログインが必要です" }, { status: 401 });
    }
  }

  const conditions = ["status = 'published'", "is_mock_only = ?"];
  const binds: (string | number)[] = [mockOnly ? 1 : 0];

  if (categories.length > 0) {
    conditions.push(`category IN (${categories.map(() => "?").join(",")})`);
    binds.push(...categories);
  }
  if (subCategories.length > 0) {
    conditions.push(`sub_category IN (${subCategories.map(() => "?").join(",")})`);
    binds.push(...subCategories);
  }
  if (difficulty !== null && !Number.isNaN(difficulty)) {
    conditions.push("difficulty = ?");
    binds.push(difficulty);
  }
  if (userId !== null && statusFilter === "wrong_uncertain") {
    conditions.push(
      `EXISTS (SELECT 1 FROM user_question_statuses s WHERE s.question_id = q.id AND s.user_id = ? AND s.status IN ('wrong', 'uncertain'))`
    );
    binds.push(userId);
  } else if (userId !== null && statusFilter === "unanswered") {
    conditions.push(
      `NOT EXISTS (SELECT 1 FROM user_question_statuses s WHERE s.question_id = q.id AND s.user_id = ?)`
    );
    binds.push(userId);
  }

  const rows = await context.env.DB.prepare(
    `WITH ranked AS (
       SELECT id, ROW_NUMBER() OVER (PARTITION BY category ORDER BY id) AS seq FROM questions
     )
     SELECT q.id, q.category, q.sub_category, q.title, q.question_text, q.tables_json, q.options, q.correct_answer, q.explanation, q.difficulty, q.passage_group_id, q.image_data_uri, r.seq
     FROM questions q
     JOIN ranked r ON r.id = q.id
     WHERE ${conditions.join(" AND ")}`
  )
    .bind(...binds)
    .all<Row>();

  const groups = new Map<string, Row[]>();
  for (const row of rows.results ?? []) {
    const key = row.passage_group_id !== null ? `g${row.passage_group_id}` : `q${row.id}`;
    const list = groups.get(key);
    if (list) list.push(row);
    else groups.set(key, [row]);
  }
  for (const [key, list] of groups) {
    // GAB英語（長文読解、1長文につき設問3問）は、常にid昇順（＝作成順）で出題した場合に
    // 3問の正解パターンが固定順になってしまい、順番だけで正解が予測できてしまう問題があった。
    // そのため他カテゴリの長文グループ（id昇順で文脈順を保つ）とは別に、グループ内の出題順を
    // 毎回ランダム化する（練習・模試とも同じこのエンドポイントを使うため両方に自動的に適用される）。
    if (list[0]?.category === "gab_english" && list.length > 1) {
      groups.set(key, shuffle(list));
    } else {
      list.sort((a, b) => a.id - b.id);
    }
  }

  const shuffledGroups = shuffle([...groups.values()]);
  const selected: Row[] = [];
  for (const group of shuffledGroups) {
    if (selected.length >= limit) break;
    if (selected.length + group.length <= limit || selected.length === 0) {
      selected.push(...group.slice(0, limit - selected.length));
    }
  }

  return Response.json({
    questions: selected.map((r) => toClientQuestion(r, { shuffle: true })),
  });
};
