import { Document, Page, Text, View, StyleSheet, Font } from "@react-pdf/renderer";
import { QUOTATION_PLANS, calculateQuotation } from "@/src/data/quotationPlans";

// 日本語（漢字・ひらがな・カタカナ）を含むPDFを生成するため、@react-pdf/renderer標準の
// Helvetica等（欧文フォントのみ）ではなく、Noto Sans JPを外部URLから読み込んで登録する。
// react-pdfのフォント処理（fontkit）はwoff2非対応のため、Google Fonts CSS2 APIが
// （ブラウザ判定用のUser-Agentヘッダーを付けない場合に）返す静的ttfの直リンクを使用する
// （fonts.googleapis.com/css2?family=Noto+Sans+JP のレスポンスから取得・実際に200を確認済み）。
// 注意: このURLはGoogle側のフォント更新に伴いバージョン（v56等）が変わり失効する可能性がある。
// 失効した場合は同じ手順（css2 APIをUser-Agent無しで取得）で最新のttf URLを再取得すること。
Font.register({
  family: "Noto Sans JP",
  fonts: [
    {
      src: "https://fonts.gstatic.com/s/notosansjp/v56/-F6jfjtqLzI2JPCgQBnw7HFyzSD-AsregP8VFBEj75s.ttf",
      fontWeight: 400,
    },
    {
      src: "https://fonts.gstatic.com/s/notosansjp/v56/-F6jfjtqLzI2JPCgQBnw7HFyzSD-AsregP8VFPYk75s.ttf",
      fontWeight: 700,
    },
  ],
});

const styles = StyleSheet.create({
  page: {
    fontFamily: "Noto Sans JP",
    fontSize: 10,
    color: "#1a202c",
    padding: 40,
  },
  title: {
    fontSize: 22,
    fontWeight: 700,
    textAlign: "center",
    letterSpacing: 6,
    marginBottom: 28,
  },
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 24,
  },
  addressee: {
    fontSize: 15,
    fontWeight: 700,
    borderBottomWidth: 1.5,
    borderBottomColor: "#1a202c",
    paddingBottom: 5,
    minWidth: 230,
  },
  metaBlock: {
    alignItems: "flex-end",
  },
  metaText: {
    fontSize: 9,
    color: "#4a5568",
    marginBottom: 2,
  },
  issuerText: {
    fontSize: 9,
    color: "#2d3748",
    marginTop: 8,
  },
  issuerTextBold: {
    fontSize: 10,
    fontWeight: 700,
    color: "#1a202c",
    marginTop: 10,
  },
  totalBox: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#eff6ff",
    borderWidth: 1,
    borderColor: "#2563eb",
    borderRadius: 4,
    paddingVertical: 10,
    paddingHorizontal: 16,
    marginBottom: 26,
  },
  totalLabel: {
    fontSize: 12,
    fontWeight: 700,
    color: "#1e3a8a",
  },
  totalValue: {
    fontSize: 20,
    fontWeight: 700,
    color: "#1e3a8a",
  },
  sectionLabel: {
    fontSize: 10,
    fontWeight: 700,
    color: "#1e3a8a",
    marginBottom: 6,
  },
  table: {
    borderWidth: 1,
    borderColor: "#cbd5e1",
    marginBottom: 4,
  },
  tableHeaderRow: {
    flexDirection: "row",
    backgroundColor: "#2563eb",
  },
  tableRow: {
    flexDirection: "row",
    borderTopWidth: 1,
    borderTopColor: "#e2e8f0",
  },
  th: {
    color: "#ffffff",
    fontSize: 9.5,
    fontWeight: 700,
    padding: 7,
  },
  td: {
    fontSize: 9.5,
    padding: 7,
    color: "#1a202c",
  },
  colItem: { width: "40%" },
  colQty: { width: "15%", textAlign: "right" },
  colUnit: { width: "20%", textAlign: "right" },
  colAmount: { width: "25%", textAlign: "right" },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    paddingVertical: 3,
    paddingHorizontal: 4,
  },
  summaryLabel: {
    width: 110,
    fontSize: 9.5,
    textAlign: "right",
    marginRight: 14,
    color: "#4a5568",
  },
  summaryValue: {
    width: 100,
    fontSize: 9.5,
    textAlign: "right",
  },
  grandTotalRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    paddingVertical: 7,
    paddingHorizontal: 4,
    marginTop: 4,
    borderTopWidth: 1.5,
    borderTopColor: "#1a202c",
  },
  grandTotalLabel: {
    width: 110,
    fontSize: 11,
    fontWeight: 700,
    textAlign: "right",
    marginRight: 14,
    color: "#1a202c",
  },
  grandTotalValue: {
    width: 100,
    fontSize: 11,
    fontWeight: 700,
    textAlign: "right",
    color: "#1a202c",
  },
  notes: {
    marginTop: 34,
    fontSize: 8,
    lineHeight: 1.7,
    color: "#64748b",
  },
});

function formatCurrency(amount: number): string {
  return `¥${Math.round(amount).toLocaleString("ja-JP")}`;
}

function formatDate(date: Date): string {
  return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`;
}

export type QuotationPDFProps = {
  companyName: string;
  planName: string;
  userCount: number;
  totalPrice: number;
};

export function QuotationPDF({ companyName, planName, userCount, totalPrice }: QuotationPDFProps) {
  const plan = QUOTATION_PLANS.find((p) => p.name === planName) ?? QUOTATION_PLANS[0];
  const { userFeeSubtotal, subtotal, tax } = calculateQuotation(plan.id, userCount);

  const issueDate = new Date();
  const validUntilDate = new Date(issueDate);
  validUntilDate.setDate(validUntilDate.getDate() + 30);

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.title}>御見積書</Text>

        <View style={styles.topRow}>
          <Text style={styles.addressee}>{(companyName || "貴社").trim()} 御中</Text>
          <View style={styles.metaBlock}>
            <Text style={styles.metaText}>発行日: {formatDate(issueDate)}</Text>
            <Text style={styles.metaText}>有効期限: {formatDate(validUntilDate)}</Text>
            <Text style={styles.issuerTextBold}>Webテストナビ</Text>
            <Text style={styles.issuerText}>運営者: 福井敬介</Text>
          </View>
        </View>

        <View style={styles.totalBox}>
          <Text style={styles.totalLabel}>御見積金額（税込）</Text>
          <Text style={styles.totalValue}>{formatCurrency(totalPrice)}</Text>
        </View>

        <Text style={styles.sectionLabel}>ご利用プラン: {plan.name}（{plan.description}）</Text>

        <View style={styles.table}>
          <View style={styles.tableHeaderRow}>
            <Text style={[styles.th, styles.colItem]}>項目</Text>
            <Text style={[styles.th, styles.colQty]}>数量</Text>
            <Text style={[styles.th, styles.colUnit]}>単価</Text>
            <Text style={[styles.th, styles.colAmount]}>金額</Text>
          </View>
          <View style={styles.tableRow}>
            <Text style={[styles.td, styles.colItem]}>{plan.name}（月額基本料金）</Text>
            <Text style={[styles.td, styles.colQty]}>1</Text>
            <Text style={[styles.td, styles.colUnit]}>{formatCurrency(plan.baseFee)}</Text>
            <Text style={[styles.td, styles.colAmount]}>{formatCurrency(plan.baseFee)}</Text>
          </View>
          <View style={styles.tableRow}>
            <Text style={[styles.td, styles.colItem]}>利用人数追加料金</Text>
            <Text style={[styles.td, styles.colQty]}>{userCount}名</Text>
            <Text style={[styles.td, styles.colUnit]}>{formatCurrency(plan.perUserFee)}</Text>
            <Text style={[styles.td, styles.colAmount]}>{formatCurrency(userFeeSubtotal)}</Text>
          </View>
        </View>

        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>小計</Text>
          <Text style={styles.summaryValue}>{formatCurrency(subtotal)}</Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>消費税（10%）</Text>
          <Text style={styles.summaryValue}>{formatCurrency(tax)}</Text>
        </View>
        <View style={styles.grandTotalRow}>
          <Text style={styles.grandTotalLabel}>合計金額</Text>
          <Text style={styles.grandTotalValue}>{formatCurrency(totalPrice)}</Text>
        </View>

        <Text style={styles.notes}>
          ※ 本見積書は概算であり、正式なご契約時に金額が変動する場合がございます。{"\n"}
          ※ 消費税は税制改正等により変動する可能性がございます。{"\n"}
          ※ ご不明点がございましたら、Webテストナビ運営までお問い合わせください。
        </Text>
      </Page>
    </Document>
  );
}
