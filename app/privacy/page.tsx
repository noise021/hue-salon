import Link from "next/link";

// 美容室デモ「hue.」プライバシーポリシー(デモ用サンプル文)
const SERIF = 'var(--font-heading), "Shippori Mincho", "Hiragino Mincho ProN", serif';

export const metadata = {
  title: "プライバシーポリシー | hue.",
};

const SECTIONS = [
  {
    title: "1. 個人情報の取得",
    body: "当サロンは、ご予約・お問い合わせの際に、お名前、電話番号、メールアドレス等の個人情報を適正な手段により取得いたします。",
  },
  {
    title: "2. 利用目的",
    body: "取得した個人情報は、ご予約の確認・変更のご連絡、施術履歴の管理、サービス向上のための分析、およびお客様の同意を得た範囲でのご案内にのみ利用いたします。",
  },
  {
    title: "3. 第三者提供",
    body: "法令に基づく場合を除き、ご本人の同意なく個人情報を第三者に提供することはありません。",
  },
  {
    title: "4. 安全管理",
    body: "個人情報への不正アクセス、紛失、漏えい等を防止するため、適切な安全管理措置を講じます。",
  },
  {
    title: "5. 開示・訂正・削除",
    body: "ご本人からの個人情報の開示・訂正・削除のご請求には、本人確認のうえ速やかに対応いたします。ご希望の際は店頭またはメールにてご連絡ください。",
  },
];

export default function SalonPrivacyPage() {
  return (
    <main className="mx-auto min-h-screen max-w-2xl bg-white px-6 py-14 text-neutral-900">
      <Link href="/" className="text-2xl font-medium tracking-tight">
        hue.
      </Link>
      <h1
        className="mt-14 text-2xl"
        style={{ fontFamily: SERIF, letterSpacing: "0.3em" }}
      >
        プライバシーポリシー
      </h1>
      <p className="mt-4 text-xs tracking-widest text-neutral-400">
        hue. hair atelier aoyama — 個人情報保護方針
      </p>

      <div className="mt-12 space-y-10">
        {SECTIONS.map((s) => (
          <section key={s.title}>
            <h2
              className="text-sm text-neutral-900"
              style={{ fontFamily: SERIF, letterSpacing: "0.2em" }}
            >
              {s.title}
            </h2>
            <p className="mt-3 text-sm leading-8 tracking-wide text-neutral-600">
              {s.body}
            </p>
          </section>
        ))}
      </div>

      <p className="mt-16 border-t border-neutral-200 pt-6 text-xs leading-6 tracking-widest text-neutral-400">
        制定日: 2026年1月1日
        <br />
        hue. hair atelier（東京都港区南青山 — デモサイトのため架空の住所です）
      </p>

      <Link
        href="/"
        className="mt-12 inline-block border-b border-neutral-300 pb-1 text-sm tracking-widest text-neutral-700 transition-opacity hover:opacity-60"
        style={{ fontFamily: SERIF }}
      >
        トップへ戻る
      </Link>
    </main>
  );
}
