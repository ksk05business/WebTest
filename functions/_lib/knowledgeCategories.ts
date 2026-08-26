// エビングハウスの忘却曲線に基づく反復復習（user_question_reviews、/review・ダッシュボードの
// 「今日復習すべき問題」）の対象を、語彙・語句の意味・文法など「暗記主体の知識系単元」に限定するための
// 大分類（questions.category）一覧。
// 除外対象（非言語=non_verbal・構造的把握=structuralなどの計算・思考系分野）は、単元ごとの
// 「×＋△のみを復習する」機能（app/practice経由、UnitStatusSummaryModal、user_question_statusesベース）
// で復習する設計とした（そちらは全カテゴリ対象で、こちらの限定とは独立して動作する）。
export const KNOWLEDGE_REVIEW_CATEGORIES = [
  "verbal",
  "english",
  "tamatebako_verbal",
  "tamatebako_english",
] as const;
