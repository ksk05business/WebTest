// 汎用のON/OFFトグルスイッチ。ブログ記事管理タブの公開/非公開切り替え用に作成したが、
// チェックボックスの代替として他の管理画面機能でも再利用できる想定の単体コンポーネント。
export function Switch({
  checked,
  onChange,
  disabled,
  label,
}: {
  checked: boolean;
  onChange: () => void;
  disabled?: boolean;
  label: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={onChange}
      className={`relative inline-flex h-6 w-11 flex-shrink-0 items-center rounded-full transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 disabled:cursor-not-allowed disabled:opacity-50 ${
        checked ? "bg-green-600" : "bg-gray-300"
      }`}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
          checked ? "translate-x-6" : "translate-x-1"
        }`}
      />
    </button>
  );
}
