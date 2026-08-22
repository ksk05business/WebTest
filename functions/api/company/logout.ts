import { clearSessionCookieHeader, destroySession } from "../../_lib/session";

interface Env {
  DB: D1Database;
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  await destroySession(context.env.DB, context.request, "company");
  return new Response(JSON.stringify({ ok: true }), {
    headers: {
      "Content-Type": "application/json",
      "Set-Cookie": clearSessionCookieHeader("company"),
    },
  });
};
