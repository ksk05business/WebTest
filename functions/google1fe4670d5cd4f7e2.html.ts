// Google Search Console のHTML所有権確認ファイル。
// Cloudflare Pagesは静的アセットの *.html を拡張子なしURLへ自動308リダイレクトする仕様があり
// （例: /foo.html → /foo）、public/直下に置くだけではGoogleの確認チェックが失敗する恐れがある。
// Pages Functionsは静的アセット配信より優先されるため、この関数で直接レスポンスを返すことで
// リダイレクトを回避し、/google1fe4670d5cd4f7e2.html をそのまま200で返す。
export const onRequestGet: PagesFunction = async () => {
  return new Response("google-site-verification: google1fe4670d5cd4f7e2.html", {
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
};
