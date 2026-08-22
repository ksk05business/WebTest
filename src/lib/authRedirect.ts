// セッションが無効/期限切れの場合（APIが「ログインが必要です」を返した場合）に、
// ローカルのユーザー情報を破棄してログイン画面へ戻すための共通ヘルパー。
type Router = { replace: (path: string) => void };

export function redirectToLogin(router: Router) {
  localStorage.removeItem("spiUser");
  router.replace("/login");
}

export function redirectToCompanyLogin(router: Router) {
  localStorage.removeItem("spiCompanyUser");
  router.replace("/company/login");
}
