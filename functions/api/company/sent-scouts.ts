interface Env {
  DB: D1Database;
}

type CompanyRow = { id: number; approved: number };

type SentScoutRow = {
  id: number;
  status: string;
  is_anonymous: number;
  title: string;
  message: string | null;
  created_at: string;
  responded_at: string | null;
  university_category: string | null;
  faculty_type: string;
  industry_first: string;
  industry_second: string;
  industry_third: string;
  desired_occupations: string;
  last_name: string | null;
  first_name: string | null;
  email: string | null;
};

// 送信済みスカウト一覧。is_anonymous = 0（学生が承諾済み）の場合のみ氏名・メールアドレスを開示する。
export const onRequestGet: PagesFunction<Env> = async (context) => {
  const companyEmail = new URL(context.request.url).searchParams.get("companyEmail");
  if (!companyEmail) {
    return Response.json({ error: "companyEmailが指定されていません" }, { status: 400 });
  }

  const company = await context.env.DB.prepare(
    "SELECT id, approved FROM company_profiles WHERE email = ?"
  )
    .bind(companyEmail)
    .first<CompanyRow>();
  if (!company) {
    return Response.json({ error: "企業アカウントが見つかりません" }, { status: 404 });
  }
  if (!company.approved) {
    return Response.json(
      { error: "このアカウントはまだ運営の承認待ちのためスカウト履歴を閲覧できません" },
      { status: 403 }
    );
  }

  const rows = await context.env.DB.prepare(
    `SELECT
        s.id, s.status, s.is_anonymous, s.title, s.message, s.created_at, s.responded_at,
        u.university_category, u.faculty_type, u.industry_first, u.industry_second, u.industry_third, u.desired_occupations,
        CASE WHEN s.is_anonymous = 0 THEN u.last_name ELSE NULL END AS last_name,
        CASE WHEN s.is_anonymous = 0 THEN u.first_name ELSE NULL END AS first_name,
        CASE WHEN s.is_anonymous = 0 THEN u.email ELSE NULL END AS email
     FROM scouts s
     JOIN users u ON u.id = s.student_id
     WHERE s.company_id = ?
     ORDER BY s.created_at DESC`
  )
    .bind(company.id)
    .all<SentScoutRow>();

  return Response.json({
    scouts: (rows.results ?? []).map((r) => ({
      id: r.id,
      status: r.status,
      isAnonymous: Boolean(r.is_anonymous),
      title: r.title,
      message: r.message,
      createdAt: r.created_at,
      respondedAt: r.responded_at,
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
      lastName: r.last_name,
      firstName: r.first_name,
      email: r.email,
    })),
  });
};
