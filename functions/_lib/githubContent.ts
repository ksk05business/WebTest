// GitHub Contents APIを介して content/blog/ 配下の.mdxファイルを操作する共通クライアント。
// このアプリは`output: "export"`の完全静的サイトのため、Cloudflare Pages Functions（Workers
// ランタイム）からリポジトリのソースファイルを直接読み書きすることはできない。そのため管理画面
// からのブログ記事作成・編集・削除は、GitHub API経由で実ファイルをコミットし、Cloudflare Pagesの
// Git連携（push検知→自動ビルド・デプロイ）に反映を委ねる方式を取る（保存直後ではなく数分後に
// 本番へ反映される）。
const OWNER = "ksk05business";
const REPO = "WebTest";
const BRANCH = "main";
const API_BASE = `https://api.github.com/repos/${OWNER}/${REPO}`;

// btoa/atobはLatin1（1バイト文字）前提のため、日本語を含むUTF-8文字列をそのまま渡すと文字化けする。
// TextEncoder/TextDecoderでバイト列に変換してからbtoa/atobに通す。
function utf8ToBase64(str: string): string {
  const bytes = new TextEncoder().encode(str);
  let binary = "";
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary);
}

function base64ToUtf8(b64: string): string {
  const binary = atob(b64.replace(/\n/g, ""));
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return new TextDecoder().decode(bytes);
}

function githubHeaders(token: string): Record<string, string> {
  return {
    Authorization: `Bearer ${token}`,
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
    "User-Agent": "webtest-navi-admin",
  };
}

export type GithubDirEntry = { name: string; path: string; sha: string; type: string };

export async function githubListDir(token: string, dirPath: string): Promise<GithubDirEntry[] | null> {
  const res = await fetch(`${API_BASE}/contents/${dirPath}?ref=${BRANCH}`, { headers: githubHeaders(token) });
  if (!res.ok) return null;
  const data = await res.json();
  return Array.isArray(data) ? (data as GithubDirEntry[]) : null;
}

export async function githubGetFile(
  token: string,
  filePath: string
): Promise<{ content: string; sha: string } | null> {
  const res = await fetch(`${API_BASE}/contents/${filePath}?ref=${BRANCH}`, { headers: githubHeaders(token) });
  if (!res.ok) return null;
  const data = (await res.json()) as { content?: string; sha: string; type: string };
  if (data.type !== "file" || typeof data.content !== "string") return null;
  return { content: base64ToUtf8(data.content), sha: data.sha };
}

// 新規作成時はshaを省略する。更新時は直前に取得したshaを渡し、その間に他の変更が入っていた場合
// （楽観的ロック）はGitHubが409/422を返すため"conflict"として区別する。
export async function githubPutFile(
  token: string,
  filePath: string,
  content: string,
  message: string,
  sha?: string
): Promise<string | null | "conflict"> {
  const res = await fetch(`${API_BASE}/contents/${filePath}`, {
    method: "PUT",
    headers: { ...githubHeaders(token), "Content-Type": "application/json" },
    body: JSON.stringify({
      message,
      content: utf8ToBase64(content),
      branch: BRANCH,
      ...(sha ? { sha } : {}),
    }),
  });
  if (res.status === 409 || res.status === 422) return "conflict";
  if (!res.ok) return null;
  const data = (await res.json()) as { content: { sha: string } };
  return data.content.sha;
}

export async function githubDeleteFile(
  token: string,
  filePath: string,
  message: string,
  sha: string
): Promise<boolean> {
  const res = await fetch(`${API_BASE}/contents/${filePath}`, {
    method: "DELETE",
    headers: { ...githubHeaders(token), "Content-Type": "application/json" },
    body: JSON.stringify({ message, sha, branch: BRANCH }),
  });
  return res.ok;
}
