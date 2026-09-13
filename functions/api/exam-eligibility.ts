import { getAuthenticatedSubjectId } from "../_lib/session";
import { checkExamEligibility, MOCK_EXAM_TEST_TYPES } from "../_lib/mockExamCycle";
import { isProfileIncomplete } from "../_lib/profileGate";

interface Env {
  DB: D1Database;
}

// テスト種別ごとの本番模試（本番モード）受験可否を返す。?testType= 省略時は"spi"。
// 2ヶ月に1回・奇数月1日の一斉リセット周期に基づき、今期すでに受験済みならeligible=falseを返す。
// app/test/page.tsx（TestPageInner）は本番模試を開始する唯一の入口としてこのAPIの結果を
// 必ず一度確認するため、プロフィール未入力チェック（profileCompleted）もここに含めることで、
// BasicExamFlow/SectionedExamFlowのどちらに進む場合も同じ1回のチェックで防げる。
export const onRequestGet: PagesFunction<Env> = async (context) => {
  const userId = await getAuthenticatedSubjectId(context.env.DB, context.request, "user");
  if (!userId) {
    return Response.json({ error: "ログインが必要です" }, { status: 401 });
  }

  const params = new URL(context.request.url).searchParams;
  const testType = params.get("testType") ?? "spi";
  if (!(MOCK_EXAM_TEST_TYPES as readonly string[]).includes(testType)) {
    return Response.json({ error: "不正なテスト種別です" }, { status: 400 });
  }

  const profileCompleted = !(await isProfileIncomplete(context.env.DB, userId));
  const eligibility = await checkExamEligibility(context.env.DB, userId, testType);
  return Response.json({ ...eligibility, profileCompleted });
};
