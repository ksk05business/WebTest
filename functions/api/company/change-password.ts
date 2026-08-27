import { getAuthenticatedSubjectId } from "../../_lib/session";
import { hashPassword, verifyPassword } from "../../_lib/password";

interface Env {
  DB: D1Database;
}

type ChangePasswordBody = {
  currentPassword?: unknown;
  newPassword?: unknown;
};

type PasswordRow = {
  password_hash: string;
  password_salt: string;
};

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const companyId = await getAuthenticatedSubjectId(context.env.DB, context.request, "company");
  if (!companyId) {
    return Response.json({ error: "ログインが必要です" }, { status: 401 });
  }

  let body: ChangePasswordBody;
  try {
    body = await context.request.json();
  } catch {
    return Response.json({ error: "不正なリクエストです" }, { status: 400 });
  }

  const { currentPassword, newPassword } = body;
  if (
    typeof currentPassword !== "string" ||
    !currentPassword ||
    typeof newPassword !== "string" ||
    newPassword.length < 8
  ) {
    return Response.json(
      { error: "入力内容を確認してください（新しいパスワードは8文字以上）" },
      { status: 400 }
    );
  }

  const company = await context.env.DB.prepare(
    "SELECT password_hash, password_salt FROM company_profiles WHERE id = ?"
  )
    .bind(companyId)
    .first<PasswordRow>();
  if (!company) {
    return Response.json({ error: "企業アカウントが見つかりません" }, { status: 404 });
  }

  const valid = await verifyPassword(currentPassword, company.password_hash, company.password_salt);
  if (!valid) {
    return Response.json({ error: "現在のパスワードが正しくありません" }, { status: 401 });
  }

  const { hash, salt } = await hashPassword(newPassword);
  await context.env.DB.prepare(
    "UPDATE company_profiles SET password_hash = ?, password_salt = ? WHERE id = ?"
  )
    .bind(hash, salt, companyId)
    .run();

  return Response.json({ ok: true });
};
