// LINEログイン開始ボタン。GoogleLoginButtonと同じ設計（output: "export"の静的サイトのため、
// クリック時はfetchではなく通常のページ遷移<a href>でfunctions/api/auth/line.tsへ渡す）。
// LINEの公式ブランドガイドラインに沿い、背景色はLINEグリーン（#06C755）固定・白文字・
// 吹き出し型のLINEアイコンを使う。
export function LineLoginButton({ label = "LINEでログイン" }: { label?: string }) {
  return (
    <a
      href="/api/auth/line"
      className="flex w-full items-center justify-center gap-3 rounded-xl py-3 font-semibold text-white shadow-sm transition-colors"
      style={{ backgroundColor: "#06C755" }}
      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#05b34c")}
      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#06C755")}
    >
      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="white" aria-hidden="true">
        <path d="M12 2C6.477 2 2 5.61 2 10.062c0 3.99 3.548 7.33 8.345 7.962.325.07.767.215.879.494.101.253.066.65.033.906l-.142.858c-.043.253-.2.99.868.54 1.067-.45 5.76-3.393 7.858-5.81C21.29 13.37 22 11.79 22 10.062 22 5.61 17.523 2 12 2Zm-3.5 9.8H7.1a.31.31 0 0 1-.31-.31V7.633a.31.31 0 0 1 .31-.31h1.4a.31.31 0 0 1 .31.31v3.857a.31.31 0 0 1-.31.31Zm3.72 0h-.001a.31.31 0 0 1-.31-.31V7.633a.31.31 0 0 1 .31-.31h.001a.31.31 0 0 1 .31.31v3.857a.31.31 0 0 1-.31.31ZM14.9 11.8a.31.31 0 0 1-.31.31h-.001a.307.307 0 0 1-.248-.125l-1.767-2.386v2.2a.31.31 0 0 1-.31.31h-.001a.31.31 0 0 1-.31-.31V7.633a.31.31 0 0 1 .31-.31h.001c.098 0 .19.048.248.125l1.767 2.386v-2.2a.31.31 0 0 1 .31-.31h.001a.31.31 0 0 1 .31.31Zm3.09-3.166h-1.63v.71h1.63a.31.31 0 1 1 0 .62h-1.63v.71h1.63a.31.31 0 1 1 0 .619h-1.94a.31.31 0 0 1-.31-.31V7.633a.31.31 0 0 1 .31-.31h1.94a.31.31 0 1 1 0 .619Z" />
      </svg>
      {label}
    </a>
  );
}
