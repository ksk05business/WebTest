interface Env {
  DB: D1Database;
}

type CompanyRow = { id: number; status: string };

async function getApprovedCompany(
  db: D1Database,
  companyEmail: string
): Promise<CompanyRow | null> {
  const company = await db
    .prepare("SELECT id, status FROM company_profiles WHERE email = ?")
    .bind(companyEmail)
    .first<CompanyRow>();
  return company;
}

type CandidateRow = {
  student_id: number;
  university_category: string | null;
  faculty_type: string;
  industry_first: string;
  industry_second: string;
  industry_third: string;
  desired_occupations: string;
  latest_deviation_score: number | null;
};

// 複数値をIN句用のプレースホルダ文字列に変換する（例: 3件なら "?,?,?"）
function placeholders(values: string[]): string {
  return values.map(() => "?").join(",");
}

// 候補者の匿名検索。scout_consent = 1 の学生のみを対象とし、
// 大学区分・文理・志望業界・直近偏差値のみを返す（氏名・メールアドレス等は一切含めない）。
// クエリパラメータ（いずれも同名パラメータを複数指定すると複数選択=OR条件になる）:
//   universityCategory, facultyType, industry（第一〜第三志望のいずれかに一致）, minDeviation
export const onRequestGet: PagesFunction<Env> = async (context) => {
  const params = new URL(context.request.url).searchParams;
  const companyEmail = params.get("companyEmail");
  if (!companyEmail) {
    return Response.json({ error: "companyEmailが指定されていません" }, { status: 400 });
  }

  const company = await getApprovedCompany(context.env.DB, companyEmail);
  if (!company) {
    return Response.json({ error: "企業アカウントが見つかりません" }, { status: 404 });
  }
  if (company.status !== "active") {
    return Response.json(
      { error: "このアカウントはまだ運営の承認待ちのため候補者を閲覧できません" },
      { status: 403 }
    );
  }

  const universityCategories = params.getAll("universityCategory").filter(Boolean);
  const facultyTypes = params.getAll("facultyType").filter(Boolean);
  const industries = params.getAll("industry").filter(Boolean);
  const desiredOccupations = params.getAll("desiredOccupation").filter(Boolean);
  const minDeviationRaw = params.get("minDeviation");
  const minDeviation = minDeviationRaw !== null ? Number(minDeviationRaw) : null;

  const conditions = ["u.scout_consent = 1"];
  const binds: (string | number)[] = [];

  if (universityCategories.length > 0) {
    conditions.push(`u.university_category IN (${placeholders(universityCategories)})`);
    binds.push(...universityCategories);
  }
  if (facultyTypes.length > 0) {
    conditions.push(`u.faculty_type IN (${placeholders(facultyTypes)})`);
    binds.push(...facultyTypes);
  }
  if (industries.length > 0) {
    const ph = placeholders(industries);
    conditions.push(
      `(u.industry_first IN (${ph}) OR u.industry_second IN (${ph}) OR u.industry_third IN (${ph}))`
    );
    binds.push(...industries, ...industries, ...industries);
  }
  if (desiredOccupations.length > 0) {
    conditions.push(
      `(${desiredOccupations.map(() => "u.desired_occupations LIKE ?").join(" OR ")})`
    );
    binds.push(...desiredOccupations.map((o) => `%"${o}"%`));
  }
  if (minDeviation !== null && !Number.isNaN(minDeviation)) {
    conditions.push(
      `(SELECT e.deviation_score FROM exam_results e WHERE e.user_id = u.id ORDER BY e.taken_at DESC LIMIT 1) >= ?`
    );
    binds.push(minDeviation);
  }

  const rows = await context.env.DB.prepare(
    `SELECT
        u.id AS student_id,
        u.university_category,
        u.faculty_type,
        u.industry_first,
        u.industry_second,
        u.industry_third,
        u.desired_occupations,
        (SELECT e.deviation_score FROM exam_results e
          WHERE e.user_id = u.id ORDER BY e.taken_at DESC LIMIT 1) AS latest_deviation_score
     FROM users u
     WHERE ${conditions.join(" AND ")}
     ORDER BY u.id DESC`
  )
    .bind(...binds)
    .all<CandidateRow>();

  return Response.json({
    candidates: (rows.results ?? []).map((r) => ({
      studentId: r.student_id,
      universityCategory: r.university_category,
      facultyType: r.faculty_type,
      industryFirst: r.industry_first,
      industrySecond: r.industry_second,
      industryThird: r.industry_third,
      desiredOccupations: (() => {
        try {
          return JSON.parse(r.desired_occupations) as string[];
        } catch {
          return [];
        }
      })(),
      latestDeviationScore: r.latest_deviation_score,
    })),
  });
};

type SendScoutBody = {
  companyEmail?: unknown;
  studentId?: unknown;
  title?: unknown;
  message?: unknown;
};

export const onRequestPost: PagesFunction<Env> = async (context) => {
  let body: SendScoutBody;
  try {
    body = await context.request.json();
  } catch {
    return Response.json({ error: "不正なリクエストです" }, { status: 400 });
  }

  const { companyEmail, studentId, title, message } = body;
  if (
    typeof companyEmail !== "string" ||
    !companyEmail.trim() ||
    typeof studentId !== "number" ||
    typeof title !== "string" ||
    !title.trim() ||
    typeof message !== "string" ||
    !message.trim()
  ) {
    return Response.json({ error: "件名と本文メッセージを入力してください" }, { status: 400 });
  }

  const company = await getApprovedCompany(context.env.DB, companyEmail);
  if (!company) {
    return Response.json({ error: "企業アカウントが見つかりません" }, { status: 404 });
  }
  if (company.status !== "active") {
    return Response.json(
      { error: "このアカウントはまだ運営の承認待ちのためスカウトを送信できません" },
      { status: 403 }
    );
  }

  const student = await context.env.DB.prepare(
    "SELECT id FROM users WHERE id = ? AND scout_consent = 1"
  )
    .bind(studentId)
    .first<{ id: number }>();
  if (!student) {
    return Response.json(
      { error: "対象の学生が見つからないか、スカウトを受け付けていません" },
      { status: 404 }
    );
  }

  const existing = await context.env.DB.prepare(
    "SELECT id FROM scouts WHERE company_id = ? AND student_id = ? AND status = 'sent'"
  )
    .bind(company.id, studentId)
    .first();
  if (existing) {
    return Response.json({ error: "この候補者には既にスカウトを送信済みです" }, { status: 409 });
  }

  // is_anonymous = 1 で作成。学生が承諾するまで、企業はこの学生の氏名・連絡先を一切取得できない。
  await context.env.DB.prepare(
    `INSERT INTO scouts (company_id, student_id, is_anonymous, status, title, message)
     VALUES (?, ?, 1, 'sent', ?, ?)`
  )
    .bind(company.id, studentId, title, message)
    .run();

  return Response.json({ ok: true });
};
