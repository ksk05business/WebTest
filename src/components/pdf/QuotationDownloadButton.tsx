"use client";

import { useEffect, useState } from "react";
import { PDFDownloadLink } from "@react-pdf/renderer";
import { Download, Loader2 } from "lucide-react";
import { QuotationPDF, type QuotationPDFProps } from "./QuotationPDF";

const BUTTON_CLASS =
  "flex w-full items-center justify-center gap-2 rounded-full bg-blue-600 px-6 py-3 text-sm font-bold text-white no-underline shadow-lg shadow-blue-900/20 transition-all hover:-translate-y-0.5 hover:bg-blue-700 hover:shadow-xl";

// Next.jsのSSR（静的エクスポートのプリレンダリング）時にPDFDownloadLinkを評価すると
// Blob生成等のブラウザ専用処理でハイドレーションエラーになるため、mountedフラグで
// クライアント側でのみ実際にPDFDownloadLinkをレンダリングする。
export function QuotationDownloadButton(props: QuotationPDFProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <button type="button" disabled className={`${BUTTON_CLASS} cursor-not-allowed opacity-60`}>
        <Loader2 className="h-4 w-4 animate-spin" />
        PDFを作成中...
      </button>
    );
  }

  const fileName = `見積書_${(props.companyName || "貴社").trim()}.pdf`;

  return (
    <PDFDownloadLink
      document={<QuotationPDF {...props} />}
      fileName={fileName}
      className={BUTTON_CLASS}
    >
      {({ loading }) =>
        loading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            PDFを作成中...
          </>
        ) : (
          <>
            <Download className="h-4 w-4" />
            見積書をダウンロード
          </>
        )
      }
    </PDFDownloadLink>
  );
}
