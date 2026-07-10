"use client";

/**
 * 美容室デモ「hue.」予約ページ(UIのみ・送信なし)
 * DB保存やAPI送信は行わないデモ実装。
 */

import { useMemo, useState } from "react";
import Link from "next/link";

const MENUS = [
  { id: "cut", name: "カット", price: 6600 },
  { id: "cut-color", name: "カット + カラー", price: 13200 },
  { id: "cut-perm", name: "カット + パーマ", price: 15400 },
  { id: "treatment", name: "トリートメント", price: 8800 },
];

const STYLISTS = [
  { id: "any", name: "指名なし" },
  { id: "aoi", name: "アオイ" },
  { id: "riku", name: "リク" },
  { id: "sena", name: "セナ" },
];

const TIMES = Array.from({ length: 19 }, (_, i) => {
  const h = 10 + Math.floor(i / 2);
  const m = i % 2 === 0 ? "00" : "30";
  return `${h}:${m}`;
});

const yen = (n: number) => `¥${n.toLocaleString("ja-JP")}`;

const SERIF = 'var(--font-heading), "Shippori Mincho", "Hiragino Mincho ProN", serif';

export default function SalonReservePage() {
  const [menu, setMenu] = useState<string | null>(null);
  const [stylist, setStylist] = useState<string>("any");
  const [date, setDate] = useState("");
  const [time, setTime] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [tel, setTel] = useState("");
  const [email, setEmail] = useState("");
  const [errors, setErrors] = useState<string[]>([]);
  const [done, setDone] = useState(false);

  const today = useMemo(() => new Date().toISOString().slice(0, 10), []);
  const selectedMenu = MENUS.find((m) => m.id === menu);
  const selectedStylist = STYLISTS.find((s) => s.id === stylist);

  const submit = () => {
    const errs: string[] = [];
    if (!menu) errs.push("メニューを選択してください");
    if (!date) errs.push("日付を選択してください");
    if (!time) errs.push("時間を選択してください");
    if (!name.trim()) errs.push("お名前を入力してください");
    if (!/^[0-9+\-() ]{10,}$/.test(tel)) errs.push("電話番号を正しく入力してください");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errs.push("メールアドレスを正しく入力してください");
    setErrors(errs);
    if (errs.length === 0) setDone(true);
  };

  const sectionTitle = "mb-4 mt-12 border-b border-neutral-100 pb-2 text-xs tracking-[0.3em] text-neutral-400";

  if (done) {
    return (
      <main className="mx-auto flex min-h-screen max-w-xl flex-col justify-center bg-white px-6 py-16 text-neutral-900">
        <p className="text-3xl font-medium tracking-tight">
          ご予約を承りました<span className="text-neutral-400">（デモ）</span>
        </p>
        <div className="mt-8 space-y-2 border-t border-neutral-200 pt-6 text-sm leading-relaxed">
          <p>メニュー: {selectedMenu?.name}（{selectedMenu ? yen(selectedMenu.price) : ""}）</p>
          <p>スタイリスト: {selectedStylist?.name}</p>
          <p>日時: {date} {time}</p>
          <p>お名前: {name} 様</p>
          <p>連絡先: {tel} / {email}</p>
        </div>
        <p className="mt-8 text-xs text-neutral-400">
          このページはデモです。実際の予約は行われません。
        </p>
        <Link
          href="/"
          className="mt-10 inline-block w-fit rounded-full bg-neutral-900 px-8 py-3 text-sm text-white"
        >
          トップへ戻る
        </Link>
      </main>
    );
  }

  return (
    <main className="mx-auto min-h-screen max-w-xl bg-white px-6 py-10 text-neutral-900">
      <Link href="/" className="text-2xl font-medium tracking-tight">
        hue.
      </Link>
      <h1
        className="mt-12 text-2xl"
        style={{ fontFamily: SERIF, letterSpacing: "0.4em" }}
      >
        ご予約
      </h1>
      <p className="mt-4 text-xs tracking-[0.25em] text-neutral-400">
        ご希望の内容をお選びください
      </p>

      {/* 1. メニュー */}
      <p className={sectionTitle}>01 — メニュー</p>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {MENUS.map((m) => (
          <button
            key={m.id}
            type="button"
            onClick={() => setMenu(m.id)}
            className={`flex items-center justify-between rounded-lg border px-4 py-4 text-left text-sm transition-colors ${
              menu === m.id
                ? "border-neutral-900 bg-neutral-900 text-white"
                : "border-neutral-200 hover:border-neutral-400"
            }`}
          >
            <span>{m.name}</span>
            <span className={menu === m.id ? "text-neutral-300" : "text-neutral-500"}>
              {yen(m.price)}
            </span>
          </button>
        ))}
      </div>

      {/* 2. スタイリスト */}
      <p className={sectionTitle}>02 — スタイリスト</p>
      <div className="flex flex-wrap gap-3">
        {STYLISTS.map((s) => (
          <button
            key={s.id}
            type="button"
            onClick={() => setStylist(s.id)}
            className="flex flex-col items-center gap-2"
          >
            <span
              className={`flex h-16 w-16 items-center justify-center rounded-full border text-lg font-medium transition-colors ${
                stylist === s.id
                  ? "border-neutral-900 bg-neutral-900 text-white"
                  : "border-neutral-200 text-neutral-500 hover:border-neutral-400"
              }`}
            >
              {s.id === "any" ? "—" : s.name[0]}
            </span>
            <span className="text-xs text-neutral-600">{s.name}</span>
          </button>
        ))}
      </div>

      {/* 3. 日時 */}
      <p className={sectionTitle}>03 — 日時</p>
      <input
        type="date"
        min={today}
        value={date}
        onChange={(e) => setDate(e.target.value)}
        className="w-full rounded-lg border border-neutral-200 px-4 py-3 text-sm"
      />
      <div className="mt-3 flex flex-wrap gap-2">
        {TIMES.map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTime(t)}
            className={`rounded-full border px-4 py-2 text-xs transition-colors ${
              time === t
                ? "border-neutral-900 bg-neutral-900 text-white"
                : "border-neutral-200 text-neutral-600 hover:border-neutral-400"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* 4. お客様情報 */}
      <p className={sectionTitle}>04 — お客様情報</p>
      <div className="space-y-3">
        <input
          type="text"
          placeholder="お名前"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full rounded-lg border border-neutral-200 px-4 py-3 text-sm"
        />
        <input
          type="tel"
          placeholder="電話番号（例: 09012345678）"
          value={tel}
          onChange={(e) => setTel(e.target.value)}
          className="w-full rounded-lg border border-neutral-200 px-4 py-3 text-sm"
        />
        <input
          type="email"
          placeholder="メールアドレス"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full rounded-lg border border-neutral-200 px-4 py-3 text-sm"
        />
      </div>

      {errors.length > 0 && (
        <ul className="mt-6 space-y-1 text-sm text-red-600">
          {errors.map((e) => (
            <li key={e}>・{e}</li>
          ))}
        </ul>
      )}

      <button
        type="button"
        onClick={submit}
        className="mt-12 w-full rounded-full bg-neutral-900 py-5 text-sm text-white transition-opacity hover:opacity-80"
        style={{ fontFamily: SERIF, letterSpacing: "0.5em", paddingLeft: "0.5em" }}
      >
        予約する
      </button>
      <p className="mt-4 pb-10 text-center text-xs text-neutral-400">
        このページはデモです。実際の予約は行われません。
      </p>
    </main>
  );
}
