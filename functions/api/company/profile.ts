import { getAuthenticatedSubjectId } from "../../_lib/session";
import { isFreeEmailDomain } from "../../_lib/freeEmailDomains";
import { APPEAL_TAGS, SHORT_MESSAGE_MAX_LENGTH } from "../../../src/data/formOptions";

interface Env {
  DB: D1Database;
}

type CompanyProfileRow = {
  company_name: string;
  contact_name: string;
  email: string;
  short_message: string | null;
  appeal_tags: string | null;
};

function parseAppealTags(raw: string | null): string[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((v): v is string => typeof v === "string") : [];
  } catch {
    return [];
  }
}

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const companyId = await getAuthenticatedSubjectId(context.env.DB, context.request, "company");
  if (!companyId) {
    return Response.json({ error: "ログインが必要です" }, { status: 401 });
  }

  const company = await context.env.DB.prepare(
    "SELECT company_name, contact_name, email, short_message, appeal_tags FROM company_profiles WHERE id = ?"
  )
    .bind(companyId)
    .first<CompanyProfileRow>();

  if (!company) {
    return Response.json({ error: "企業アカウントが見つかりません" }, { status: 404 });
  }

  return Response.json({
    companyName: company.company_name,
    contactName: company.contact_name,
    email: company.email,
    shortMessage: company.short_message ?? "",
    appealTags: parseAppealTags(company.appeal_tags),
  });
};

type UpdateBody = {
  contactName?: unknown;
  email?: unknown;
  shortMessage?: unknown;
  appealTags?: unknown;
};

export const onRequestPut: PagesFunction<Env> = async (context) => {
  const companyId = await getAuthenticatedSubjectId(context.env.DB, context.request, "company");
  if (!companyId) {
    return Response.json({ error: "ログインが必要です" }, { status: 401 });
  }

  let body: UpdateBody;
  try {
    body = await context.request.json();
  } catch {
    return Response.json({ error: "不正なリクエストです" }, { status: 400 });
  }

  const { contactName, email, shortMessage, appealTags } = body;

  if (
    typeof contactName !== "string" ||
    !contactName.trim() ||
    typeof email !== "string" ||
    !email.trim() ||
    typeof shortMessage !== "string" ||
    !shortMessage.trim()
  ) {
    return Response.json({ error: "入力内容を確認してください" }, { status: 400 });
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
    return Response.json({ error: "メールアドレスの形式が正しくありません" }, { status: 400 });
  }
  if (isFreeEmailDomain(email.trim())) {
    return Response.json(
      { error: "会社用のメールアドレス（独自ドメイン）を入力してください" },
      { status: 400 }
    );
  }
  if (shortMessage.trim().length > SHORT_MESSAGE_MAX_LENGTH) {
    return Response.json(
      { error: `企業メッセージは${SHORT_MESSAGE_MAX_LENGTH}文字以内で入力してください` },
      { status: 400 }
    );
  }

  if (
    !Array.isArray(appealTags) ||
    !appealTags.every((v) => typeof v === "string" && (APPEAL_TAGS as readonly string[]).includes(v))
  ) {
    return Response.json({ error: "アピールタグの内容を確認してください" }, { status: 400 });
  }
  const uniqueAppealTags = Array.from(new Set(appealTags as string[]));

  const existing = await context.env.DB.prepare(
    "SELECT id FROM company_profiles WHERE email = ? AND id != ?"
  )
    .bind(email.trim(), companyId)
    .first();
  if (existing) {
    return Response.json({ error: "このメールアドレスは既に使用されています" }, { status: 409 });
  }

  await context.env.DB.prepare(
    `UPDATE company_profiles
     SET contact_name = ?, email = ?, short_message = ?, appeal_tags = ?
     WHERE id = ?`
  )
    .bind(
      contactName.trim(),
      email.trim(),
      shortMessage.trim(),
      JSON.stringify(uniqueAppealTags),
      companyId
    )
    .run();

  return Response.json({
    ok: true,
    contactName: contactName.trim(),
    email: email.trim(),
  });
};
