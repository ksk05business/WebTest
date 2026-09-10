import { checkAdminAuth } from "../../../_lib/adminAuth";
import { type CompanyBorderInput, validateCompanyBorder } from "../../../_lib/companyBorderValidation";

interface Env {
  DB: D1Database;
  ADMIN_API_TOKEN?: string;
}

function parseId(raw: string | undefined): number | null {
  if (!raw) return null;
  const id = Number(raw);
  return Number.isInteger(id) && id > 0 ? id : null;
}

// 企業ボーダー情報1件分の更新API。編集モーダルから全フィールドを毎回送ってもらう想定
// （questions/[id].tsと同様、部分更新は行わない）。
export const onRequestPut: PagesFunction<Env> = async (context) => {
  const authError = checkAdminAuth(context);
  if (authError) return authError;

  const id = parseId(context.params.id as string | undefined);
  if (!id) {
    return Response.json({ error: "不正なIDです" }, { status: 400 });
  }

  let body: CompanyBorderInput;
  try {
    body = await context.request.json();
  } catch {
    return Response.json({ error: "不正なリクエストです" }, { status: 400 });
  }

  const result = validateCompanyBorder(body, "body");
  if ("error" in result) {
    return Response.json({ error: result.error }, { status: 400 });
  }

  const updateResult = await context.env.DB.prepare(
    `UPDATE company_borders SET
      company_name = ?, company_name_kana = ?, industry = ?, test_type = ?, border_level = ?,
      selection_timing = ?, description = ?, has_english = ?, has_structural = ?
     WHERE id = ?`
  )
    .bind(
      result.companyName,
      result.companyNameKana,
      result.industry,
      result.testType,
      result.borderLevel,
      result.selectionTiming,
      result.description,
      result.hasEnglish,
      result.hasStructural,
      id
    )
    .run();

  if (updateResult.meta.changes === 0) {
    return Response.json({ error: "企業が見つかりません" }, { status: 404 });
  }

  return Response.json({ ok: true, id });
};

// 企業ボーダー情報1件分の削除API。
export const onRequestDelete: PagesFunction<Env> = async (context) => {
  const authError = checkAdminAuth(context);
  if (authError) return authError;

  const id = parseId(context.params.id as string | undefined);
  if (!id) {
    return Response.json({ error: "不正なIDです" }, { status: 400 });
  }

  const deleteResult = await context.env.DB.prepare("DELETE FROM company_borders WHERE id = ?").bind(id).run();
  if (deleteResult.meta.changes === 0) {
    return Response.json({ error: "企業が見つかりません" }, { status: 404 });
  }

  return Response.json({ ok: true, id });
};
