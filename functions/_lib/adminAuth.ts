// 管理API共通のx-admin-token認証チェック。functions/api/admin/配下の各エンドポイントから共通で使う。
export interface AdminEnv {
  ADMIN_API_TOKEN?: string;
}

export function checkAdminAuth(context: { request: Request; env: AdminEnv }): Response | null {
  const adminToken = context.env.ADMIN_API_TOKEN;
  if (!adminToken) {
    return Response.json({ error: "管理APIが設定されていません" }, { status: 503 });
  }
  if (context.request.headers.get("x-admin-token") !== adminToken) {
    return Response.json({ error: "認証に失敗しました" }, { status: 401 });
  }
  return null;
}
