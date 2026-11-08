import { checkAdminAuth } from "../../_lib/adminAuth";

interface Env {
  DB: D1Database;
  ADMIN_API_TOKEN?: string;
}

type UserRow = {
  id: number;
  last_name: string;
  first_name: string;
  email: string;
  university: string;
  university_category: string | null;
  faculty_type: string;
  scout_consent: number;
  created_at: string;
  exam_count: number;
  mbti: string | null;
  industry_first: string;
  industry_second: string;
  industry_third: string;
  desired_occupations: string;
};

// 登録済み学生の一覧取得（最大500件、新しい順）。検索・フィルターはクライアント側で行う想定の簡易実装。
export const onRequestGet: PagesFunction<Env> = async (context) => {
  const authError = await checkAdminAuth(context);
  if (authError) return authError;

  const rows = await context.env.DB.prepare(
    `SELECT
        u.id, u.last_name, u.first_name, u.email, u.university, u.university_category, u.faculty_type,
        u.scout_consent, u.created_at, u.mbti, u.industry_first, u.industry_second, u.industry_third,
        u.desired_occupations,
        (SELECT COUNT(*) FROM exam_results er WHERE er.user_id = u.id) AS exam_count
     FROM users u
     ORDER BY u.created_at DESC
     LIMIT 500`
  ).all<UserRow>();

  return Response.json({
    students: (rows.results ?? []).map((r) => {
      let desiredOccupations: string[] = [];
      try {
        const parsed = JSON.parse(r.desired_occupations);
        if (Array.isArray(parsed)) desiredOccupations = parsed;
      } catch {
        desiredOccupations = [];
      }
      return {
        id: r.id,
        name: `${r.last_name} ${r.first_name}`,
        email: r.email,
        university: r.university,
        universityCategory: r.university_category,
        facultyType: r.faculty_type,
        scoutConsent: r.scout_consent === 1,
        createdAt: r.created_at,
        examCount: r.exam_count,
        mbti: r.mbti,
        industries: [r.industry_first, r.industry_second, r.industry_third].filter(Boolean),
        desiredOccupations,
      };
    }),
  });
};
