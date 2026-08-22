interface Env {
  AI: Ai;
}

const SYSTEM_PROMPT = `あなたは「Webテストナビ」という、就活生向けWebテスト対策サービスの公式AIアシスタントです。
以下のサービス情報だけを根拠に、丁寧で簡潔な日本語（2〜4文程度）でユーザーの質問に回答してください。
サービスに関係のない質問や、下記の情報だけでは答えられない質問には、Webテストナビに関する質問にのみ
対応できる旨を伝えるだけにとどめ、他のサービスやサイトを紹介しないでください。より詳しい相談が必要な
場合は、ページ下部の「お問い合わせ」フォーム（/contact）の利用を案内してください。
事実に無い内容を作り話さないでください。

【サービス情報】
- サービス名: Webテストナビ
- 概要: 参考書を買わずにWebテスト対策を完結できる、就活生向けの模試・学習支援・スカウトサービス。
- 対応Webテスト: SPI3、玉手箱、TG-WEB、GAB/C-GAB、CAB、SCOA（順次対応、一部は準備中）
- 料金: 学生は模試・練習問題・復習機能・スカウトの受信を含む全機能が完全無料。スカウトを受け取る場合も含め、学生が支払いを求められることは一切ない。運営費用は企業側からの掲載料・スカウト送信料でまかなっている（学生の費用負担ではない）
- 復習機能: 間違えた言語・英語系の問題を、エビングハウスの忘却曲線に基づき1日→3日→7日→14日の間隔で自動的に復習キューに追加し、「復習」ページで復習できる
- スカウト機能: 模試を受験すると、成績や志望条件に合った企業から匿名スカウトが届くことがある。2段階開示方式を採用しており、学生本人が個別に承諾したスカウトに限り氏名・メールアドレスが企業に開示される。同意設定はマイページからいつでも変更・撤回できる
- 登録方法: 大学・学部・志望業界などの入力のみで約3分、クレジットカードの登録は不要
- お問い合わせ: このアシスタントで解決しない場合は「/contact」のお問い合わせフォームを案内する`;

const MAX_MESSAGE_LENGTH = 500;
const MAX_HISTORY_TURNS = 6;

type ChatTurn = { role: "user" | "bot"; text: string };

type ChatBody = {
  message?: unknown;
  history?: unknown;
};

function isHistory(value: unknown): value is ChatTurn[] {
  if (!Array.isArray(value)) return false;
  return value.every(
    (v) =>
      typeof v === "object" &&
      v !== null &&
      (v as { role?: unknown }).role !== undefined &&
      ((v as { role?: unknown }).role === "user" || (v as { role?: unknown }).role === "bot") &&
      typeof (v as { text?: unknown }).text === "string"
  );
}

// フロントエンドの自由入力チャットからの質問にCloudflare Workers AIで応答する。
// システムプロンプトにサービス情報を埋め込み、それ以外の話題には答えないよう指示している。
export const onRequestPost: PagesFunction<Env> = async (context) => {
  let body: ChatBody;
  try {
    body = await context.request.json();
  } catch {
    return Response.json({ error: "不正なリクエストです" }, { status: 400 });
  }

  const { message, history } = body;
  if (typeof message !== "string" || !message.trim() || message.length > MAX_MESSAGE_LENGTH) {
    return Response.json({ error: "入力内容を確認してください" }, { status: 400 });
  }
  if (history !== undefined && !isHistory(history)) {
    return Response.json({ error: "入力内容を確認してください" }, { status: 400 });
  }

  const recentHistory = (history ?? []).slice(-MAX_HISTORY_TURNS);
  const messages = [
    { role: "system", content: SYSTEM_PROMPT },
    ...recentHistory.map((h) => ({
      role: h.role === "user" ? "user" : "assistant",
      content: h.text,
    })),
    { role: "user", content: message.trim() },
  ];

  try {
    const result = await context.env.AI.run("@cf/meta/llama-3.1-8b-instruct-fp8", { messages });
    const reply =
      typeof result === "object" && result !== null && "response" in result
        ? String((result as { response: unknown }).response)
        : "";

    if (!reply.trim()) {
      return Response.json(
        { error: "回答の生成に失敗しました。時間をおいて再度お試しください。" },
        { status: 502 }
      );
    }

    return Response.json({ reply: reply.trim() });
  } catch {
    return Response.json(
      { error: "回答の生成に失敗しました。時間をおいて再度お試しください。" },
      { status: 502 }
    );
  }
};
