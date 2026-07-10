"use client";

/**
 * 美容室デモ「hue.」スクロール駆動LP
 * - Hero: カーソルXで2本のサロン動画をスクラブ再生
 * - Gallery: 黒パネル内の散乱グリッド(RAFでスケールin/out)
 * - Outro: 白オーバーレイ + 「book」CTA → /reserve
 * 依存追加なし(素のRAF + CSSアニメーション)
 */

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";

// アジア系モデルのサロン動画(Pexels / Ron Lach)
// デスクトップはHD、スマホは軽量なSD版を使用(読み込み高速化)
const VIDEO_LEFT =
  "https://videos.pexels.com/video-files/10318433/10318433-hd_1366_720_25fps.mp4";
const VIDEO_RIGHT =
  "https://videos.pexels.com/video-files/10317806/10317806-hd_1366_720_25fps.mp4";
const VIDEO_LEFT_SD =
  "https://videos.pexels.com/video-files/10318433/10318433-sd_640_360_25fps.mp4";
const VIDEO_RIGHT_SD =
  "https://videos.pexels.com/video-files/10317806/10317806-sd_640_360_25fps.mp4";
// ポスター(静止画)。動画の読み込みを待たずに即表示する
const POSTER_LEFT =
  "https://images.pexels.com/videos/10318433/adolescent-adult-barber-beautiful-10318433.jpeg?auto=compress&cs=tinysrgb&w=1200";
const POSTER_RIGHT =
  "https://images.pexels.com/videos/10317806/adolescent-adult-bathroom-beauty-salon-10317806.jpeg?auto=compress&cs=tinysrgb&w=1200";

const px = (id: number) =>
  `https://images.pexels.com/photos/${id}/pexels-photo-${id}.jpeg?auto=compress&cs=tinysrgb&w=800&h=1200&fit=crop`;

// アジア系モデルのヘアスタイル写真(Pexels)
const GALLERY = [
  { src: px(30661047), label: "ストレートロング / ¥6,600" },
  { src: px(30661046), label: "カラーリタッチ / ¥8,800" },
  { src: px(6690788), label: "ウェーブパーマ / ¥15,400" },
  { src: px(10318038), label: "アイロンスタイリング / ¥7,700" },
  { src: px(10317446), label: "ショートボブ / ¥6,600" },
  { src: px(10317451), label: "ハイトーンカラー / ¥14,300" },
  { src: px(15685120), label: "カールセット / ¥7,700" },
  { src: px(7440134), label: "レイヤーカット / ¥6,600" },
  { src: px(10318488), label: "トリートメント / ¥8,800" },
  { src: px(34741687), label: "サロンスタイル / ¥9,900" },
];

const SYMBOLS = ["✂", "§", "~", "%", "/"];
const EASE = "cubic-bezier(0.25, 0.1, 0.25, 1)";
// 高級感: 日本語の見出し・キャプションは明朝体(Shippori Mincho)を使用
const SERIF = 'var(--font-heading), "Shippori Mincho", "Hiragino Mincho ProN", serif';

/** 散乱グリッド: 各行の主列 a = (r*2 + r%2) % cols、3行ごとに2枚目 */
function buildLayout(count: number, cols: number): number[][] {
  const rows: number[][] = [];
  let placed = 0;
  let r = 0;
  while (placed < count) {
    const row = new Array<number>(cols).fill(-1);
    const a = (r * 2 + (r % 2)) % cols;
    row[a] = placed++;
    if (placed < count && r % 3 === 0) {
      let b = (a + 2) % cols;
      if (b === a) b = (a + 1) % cols;
      row[b] = placed++;
    }
    rows.push(row);
    r++;
  }
  return rows;
}

function fadeUp(delay: number): React.CSSProperties {
  return { animation: `salon-fade-up 0.6s ${EASE} ${delay}s both` };
}

export default function SalonPage() {
  const [cols, setCols] = useState(4);
  const [isDesktop, setIsDesktop] = useState(true);
  const [isTouch, setIsTouch] = useState(false);

  const spacerRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const cellRefs = useRef<(HTMLDivElement | null)[]>([]);
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);
  const canvasRef = useRef<HTMLDivElement>(null);
  const leftRef = useRef<HTMLVideoElement>(null);
  const rightRef = useRef<HTMLVideoElement>(null);
  const cursorRef = useRef<HTMLDivElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const footerRef = useRef<HTMLDivElement>(null);
  const infoRef = useRef<HTMLDivElement>(null);
  const buyRef = useRef<HTMLAnchorElement>(null);
  const symbolRef = useRef<HTMLSpanElement>(null);

  const layout = useMemo(() => buildLayout(GALLERY.length, cols), [cols]);

  // ブレークポイント / タッチ判定
  useEffect(() => {
    const update = () => {
      const w = window.innerWidth;
      setCols(w < 640 ? 2 : w < 1024 ? 3 : 4);
      setIsDesktop(w >= 1024);
    };
    setIsTouch(window.matchMedia("(pointer: coarse)").matches || "ontouchstart" in window);
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  // メインエンジン(RAF)
  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const mouse = { x: window.innerWidth / 2, y: window.innerHeight / 2, moved: false };
    const activeSideRef = { current: "right" as "left" | "right" }; // 表示中の video 要素
    let lastSymbolAt = 0;
    let lastScrollY = -1;
    let spacerH = 0;
    let raf = 0;

    // スマホ対策: アドレスバーの伸縮で innerHeight が毎フレーム変わると
    // 計算がずれてガタつくため、高さは「幅が変わった時だけ」更新する
    let stableVh = window.innerHeight;
    let lastW = window.innerWidth;
    const onResize = () => {
      if (window.innerWidth !== lastW) {
        lastW = window.innerWidth;
        stableVh = window.innerHeight;
      }
    };
    window.addEventListener("resize", onResize);

    const onMove = (e: MouseEvent) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
      mouse.moved = true;
      const c = cursorRef.current;
      if (c) {
        c.style.left = `${e.clientX}px`;
        c.style.top = `${e.clientY}px`;
        c.style.opacity = "1";
      }
    };
    window.addEventListener("mousemove", onMove);

    // タッチ端末: 交互自動再生
    const left = leftRef.current;
    const right = rightRef.current;
    const touch = window.matchMedia("(pointer: coarse)").matches || "ontouchstart" in window;
    // 端末に応じた画質を設定(JSXにsrcを書かず、二重ダウンロードを防ぐ)
    // スマホは1本目のみ先に読み込み、2本目は再生が終わる時に読み込む
    if (left && !left.src) left.src = touch ? VIDEO_LEFT_SD : VIDEO_LEFT;
    if (right && !right.src && !touch) right.src = VIDEO_RIGHT;
    const onLeftEnd = () => {
      if (!left || !right) return;
      if (!right.src) right.src = VIDEO_RIGHT_SD; // 遅延読み込み
      left.style.display = "none";
      right.style.display = "block";
      right.currentTime = 0;
      void right.play().catch(() => {});
    };
    const onRightEnd = () => {
      if (!left || !right) return;
      right.style.display = "none";
      left.style.display = "block";
      left.currentTime = 0;
      void left.play().catch(() => {});
    };
    if (touch && !reduced && left && right) {
      left.style.display = "block";
      right.style.display = "none";
      activeSideRef.current = "left";
      left.addEventListener("ended", onLeftEnd);
      right.addEventListener("ended", onRightEnd);
      void left.play().catch(() => {});
    }

    const tick = () => {
      const vh = stableVh;
      const vw = window.innerWidth;
      // iOSのラバーバンド(引っ張り)で負値になるのを防ぐ
      const scrollY = Math.max(0, window.scrollY);
      const wrap = wrapRef.current;
      const panel = panelRef.current;
      const spacer = spacerRef.current;
      if (!wrap || !panel || !spacer) {
        raf = requestAnimationFrame(tick);
        return;
      }

      // スペーサー高さ(画像ロードで変わるため毎フレーム確認)
      const maxScroll = Math.max(0, wrap.scrollHeight - vh);
      const h = vh + maxScroll + 2 * vh;
      if (h !== spacerH) {
        spacerH = h;
        spacer.style.height = `${h}px`;
      }

      // Phase 1: パネルスライドアップ / Phase 2: 内側ラッパーを上へ
      if (scrollY <= vh) {
        panel.style.transform = `translateY(${vh - scrollY}px)`;
        wrap.style.transform = "translateY(0px)";
      } else {
        panel.style.transform = "translateY(0px)";
        wrap.style.transform = `translateY(${-(scrollY - vh)}px)`;
      }

      // 動画: 最初の100vhを超えたら非表示
      const canvas = canvasRef.current;
      if (canvas) canvas.style.visibility = scrollY > vh ? "hidden" : "visible";

      // カードのスケール計算
      cellRefs.current.forEach((cell, i) => {
        const card = cardRefs.current[i];
        if (!cell || !card) return;
        const rect = cell.getBoundingClientRect();
        let scale = 0;
        if (rect.bottom > 0 && rect.top < vh) {
          const enter = Math.min(1, (vh - rect.top) / (vh * 0.6));
          const exit = Math.min(1, rect.bottom / (vh * 0.4));
          scale = Math.max(0, Math.min(enter, exit));
        }
        card.style.transform = `scale(${scale})`;
      });

      // Outro
      const start = vh + maxScroll;
      const p = Math.max(0, Math.min(1, (scrollY - start) / (vh - 100)));
      const desktop = vw >= 1024;
      const outroOffset = desktop ? 166 : 132;
      if (overlayRef.current) overlayRef.current.style.opacity = `${p}`;
      if (footerRef.current) {
        footerRef.current.style.opacity = `${p}`;
        footerRef.current.style.pointerEvents = p > 0.5 ? "auto" : "none";
      }
      const info = infoRef.current;
      if (info) {
        if (p > 0) {
          // 登場アニメーション(fill:both)が transform/opacity を上書きするため解除
          info.style.animation = "none";
          info.style.transform = `translateY(${-p * outroOffset}px)`;
          info.style.opacity = `${1 - p}`; // bookボタンと重ならないようフェードアウト
        } else {
          info.style.transform = "translateY(0px)";
          info.style.opacity = "";
        }
      }
      const buy = buyRef.current;
      if (buy) {
        buy.style.transform = `scale(${p})`;
        buy.style.pointerEvents = p > 0.6 ? "auto" : "none";
      }

      // 円形シンボルのランダム化(80msスロットル)
      if (scrollY !== lastScrollY) {
        const now = performance.now();
        if (now - lastSymbolAt > 80 && symbolRef.current) {
          lastSymbolAt = now;
          symbolRef.current.textContent =
            SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)] ?? "✂";
        }
        lastScrollY = scrollY;
      }

      // デスクトップ: カーソルXで動画スクラブ
      if (!touch && !reduced && left && right && mouse.moved && scrollY <= vh) {
        const center = vw / 2;
        const dead = Math.max(30, vw * 0.05);
        const dx = mouse.x - center;
        if (Math.abs(dx) <= dead) {
          // デッドゾーン: 両動画 currentTime=0、最後のアクティブ側を表示し続ける
          const active = activeSideRef.current === "left" ? left : right;
          if (!active.seeking && active.currentTime !== 0) active.currentTime = 0;
        } else if (dx < 0) {
          // カーソル左側 → RIGHT動画を表示してスクラブ
          if (activeSideRef.current !== "right") {
            activeSideRef.current = "right";
            left.style.display = "none";
            right.style.display = "block";
          }
          const range = center - dead;
          const progress = Math.min(1, (center - dead - mouse.x) / range);
          if (right.duration > 0 && !right.seeking) {
            right.currentTime = progress * right.duration;
          }
        } else {
          // カーソル右側 → LEFT動画を表示してスクラブ
          if (activeSideRef.current !== "left") {
            activeSideRef.current = "left";
            right.style.display = "none";
            left.style.display = "block";
          }
          const range = vw - (center + dead);
          const progress = Math.min(1, (mouse.x - (center + dead)) / range);
          if (left.duration > 0 && !left.seeking) {
            left.currentTime = progress * left.duration;
          }
        }
      }

      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("resize", onResize);
      left?.removeEventListener("ended", onLeftEnd);
      right?.removeEventListener("ended", onRightEnd);
    };
  }, []);

  // 動画ロード監視
  const showCursor = isDesktop && !isTouch;

  return (
    <div
      id="scroll-spacer"
      ref={spacerRef}
      className="relative select-none bg-white"
      style={{ height: "500vh", cursor: showCursor ? "none" : "auto" }}
    >
      {/* 1G. 動画コンテナ */}
      <div
        id="main-canvas"
        ref={canvasRef}
        className="pointer-events-none fixed z-0 overflow-hidden bg-black"
        style={{
          left: 0,
          top: isDesktop ? 0 : 220,
          width: "100vw",
          height: isDesktop ? "100vh" : "calc(100vh - 220px)",
        }}
      >
        {/* 動画読み込み中はポスター(静止画)を即表示 */}
        <video
          ref={leftRef}
          muted
          playsInline
          preload="auto"
          poster={POSTER_LEFT}
          className="absolute inset-0 h-full w-full object-cover"
          style={{ display: "none", filter: "brightness(0.82) saturate(0.85) contrast(1.02)" }}
        />
        <video
          ref={rightRef}
          muted
          playsInline
          preload="auto"
          poster={POSTER_RIGHT}
          className="absolute inset-0 h-full w-full object-cover"
          style={{ display: "block", filter: "brightness(0.82) saturate(0.85) contrast(1.02)" }}
        />
        {/* 上下に薄いグラデーションを重ねて深みを出す */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "linear-gradient(to bottom, rgba(0,0,0,0.35) 0%, rgba(0,0,0,0) 22%, rgba(0,0,0,0) 70%, rgba(0,0,0,0.45) 100%)",
          }}
        />
      </div>

      {/* SECTION 2: 黒パネル(ギャラリー) */}
      <div
        ref={panelRef}
        className="fixed inset-0 z-10 bg-black"
        style={{ transform: "translateY(100vh)" }}
      >
        <div ref={wrapRef} style={{ width: "100%", paddingTop: "min(400px, 40vh)", paddingBottom: "30vh" }}>
          <div
            className="grid gap-4 px-4 sm:gap-8 sm:px-8"
            style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
          >
            {layout.flatMap((row, r) =>
              row.map((imgIdx, c) => {
                const item = imgIdx === -1 ? undefined : GALLERY[imgIdx];
                if (imgIdx === -1 || !item) {
                  return <div key={`${r}-${c}`} style={{ aspectRatio: "2 / 3" }} />;
                }
                const originRight = c < cols / 2;
                return (
                  <div
                    key={`${r}-${c}`}
                    ref={(el) => {
                      cellRefs.current[imgIdx] = el;
                    }}
                    style={{ aspectRatio: "2 / 3" }}
                  >
                    <div
                      ref={(el) => {
                        cardRefs.current[imgIdx] = el;
                      }}
                      className="bp-card group relative h-full w-full overflow-hidden"
                      style={{
                        transform: "scale(0)",
                        transformOrigin: originRight ? "right bottom" : "left bottom",
                      }}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={item.src}
                        alt={item.label}
                        className="h-full w-full object-cover grayscale-[30%] transition-all duration-700 ease-out group-hover:scale-[1.04] group-hover:grayscale-0"
                        loading="lazy"
                      />
                      {/* メニュー名と料金: PC(lg以上)はホバー表示、それ以外は常時表示 */}
                      <span
                        className="absolute inset-x-0 bottom-0 flex items-end bg-gradient-to-t from-black/70 to-transparent px-3 pb-3 pt-12 text-white transition-opacity duration-500 opacity-100 lg:opacity-0 lg:group-hover:opacity-100"
                        style={{ fontSize: 12, letterSpacing: "0.15em", fontFamily: SERIF }}
                      >
                        {item.label}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* 1I. 白オーバーレイ */}
      <div
        id="outro-overlay"
        ref={overlayRef}
        className="pointer-events-none fixed inset-0"
        style={{ zIndex: 12, background: "#fff", opacity: 0 }}
      />

      {/* 1A. カスタムカーソル */}
      {showCursor && (
        <div
          ref={cursorRef}
          className="pointer-events-none fixed z-50"
          style={{
            transform: "translate(-50%, -50%)",
            mixBlendMode: "exclusion",
            opacity: 0,
            left: "50vw",
            top: "50vh",
          }}
        >
          <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
            <circle cx="24" cy="24" r="22.75" stroke="#fff" strokeWidth="2.5" />
            <text
              x="24"
              y="31"
              textAnchor="middle"
              fill="#fff"
              style={{ fontSize: 20 }}
            >
              ✂
            </text>
          </svg>
        </div>
      )}

      {/* 1B. ロゴ */}
      <div
        className="pointer-events-none fixed z-20"
        style={{
          mixBlendMode: "exclusion",
          top: isDesktop ? 32 : 16,
          left: isDesktop ? 32 : 16,
          ...fadeUp(0),
        }}
      >
        <svg
          viewBox="0 0 355 110"
          style={{ width: isDesktop ? 355 : cols === 3 ? 266 : 124 }}
          fill="none"
        >
          <text
            x="0"
            y="88"
            fill="#fff"
            style={{ fontSize: 110, fontWeight: 500, letterSpacing: "-0.04em" }}
          >
            hue.
          </text>
          <circle cx="330" cy="30" r="18" stroke="#fff" strokeWidth="3" />
          <text
            x="330"
            y="38"
            textAnchor="middle"
            fill="#fff"
            style={{ fontSize: 22, fontWeight: 500 }}
          >
            R
          </text>
        </svg>
      </div>

      {/* 1C. キャプション */}
      <div
        className="pointer-events-none fixed z-20"
        style={{
          mixBlendMode: "exclusion",
          left: isDesktop ? 32 : 16,
          top: isDesktop ? 244 : cols === 3 ? 180 : 118,
          width: isDesktop ? 560 : cols === 3 ? "calc(50vw - 48px)" : "calc(100vw - 32px)",
          fontSize: 13,
          lineHeight: "220%",
          letterSpacing: "0.08em",
          color: "#fff",
          fontWeight: 400,
          fontFamily: SERIF,
          ...fadeUp(0.3),
        }}
      >
        色は、その人の光のあたり方で決まる。
        <br />
        hue. は東京・青山のヘアアトリエ。カットとカラーで、
        あなたの輪郭に一番きれいな影と光を仕込みます。
        <span style={{ display: "block", marginTop: 12, fontSize: 11, letterSpacing: "0.35em", opacity: 0.8 }}>
          カット ／ カラー ／ 質感 — アーカイブ 2026
        </span>
      </div>

      {/* 1D. ヘッダーナビ */}
      <div
        className="pointer-events-none fixed z-20 flex items-center justify-end"
        style={{
          mixBlendMode: "exclusion",
          top: isDesktop ? 32 : 16,
          right: isDesktop ? 32 : 16,
          height: 30,
          ...fadeUp(0.15),
        }}
      >
        <Link
          href="/reserve"
          className="pointer-events-auto border-b border-white/50 pb-1 text-white transition-opacity hover:opacity-70"
          style={{
            fontSize: isDesktop ? 13 : 12,
            fontWeight: 400,
            letterSpacing: "0.35em",
            fontFamily: SERIF,
          }}
        >
          ご予約
        </Link>
      </div>

      {/* 1E. サロン情報 */}
      <div
        id="outro-info"
        ref={infoRef}
        data-outro-offset={isDesktop ? 166 : 132}
        className="pointer-events-none fixed z-20 flex flex-col items-center"
        style={{
          mixBlendMode: "exclusion",
          ...(isDesktop
            ? { right: 32, bottom: 80, width: 330 }
            : { left: 0, right: 0, bottom: 48 }),
          ...fadeUp(0.45),
        }}
      >
        <div
          className="flex flex-col items-start"
          style={{
            width: isDesktop ? "100%" : 252,
            marginBottom: isDesktop ? 32 : 12,
          }}
        >
          <div
            className="relative"
            style={{ width: isDesktop ? 30 : 20, height: isDesktop ? 30 : 20 }}
          >
            <svg viewBox="0 0 40 40" className="h-full w-full" fill="none">
              <circle
                cx="20"
                cy="20"
                r="18.75"
                stroke="#fff"
                strokeWidth={isDesktop ? 2.5 : 2}
              />
            </svg>
            <span
              id="circle-symbol"
              ref={symbolRef}
              className="absolute inset-0 flex items-center justify-center uppercase text-white"
              style={{
                fontSize: isDesktop ? 15 : 10,
                fontWeight: 500,
                letterSpacing: "-0.04em",
              }}
            >
              ✂
            </span>
          </div>
        </div>
        <div
          className="w-full text-center text-white"
          style={{
            fontSize: isDesktop ? 22 : 16,
            fontWeight: 400,
            lineHeight: "180%",
            letterSpacing: "0.3em",
            fontFamily: SERIF,
          }}
        >
          スタイルアーカイブ
          <br />
          <span style={{ fontSize: isDesktop ? 13 : 11, letterSpacing: "0.5em", opacity: 0.8 }}>
            二〇二六 秋冬
          </span>
        </div>
        <div
          className="w-full text-center text-white"
          style={{
            fontSize: isDesktop ? 64 : 44,
            fontWeight: 500,
            lineHeight: "130%",
            letterSpacing: "-0.02em",
          }}
        >
          ¥6,600
          <span style={{ fontSize: isDesktop ? 18 : 14, letterSpacing: "0.2em", fontFamily: SERIF }}>
            より
          </span>
        </div>
      </div>

      {/* 1F. bookボタン */}
      <Link
        id="outro-buy"
        ref={buyRef}
        href="/reserve"
        className="fixed z-20 flex items-center justify-center"
        style={{
          mixBlendMode: "exclusion",
          ...(isDesktop
            ? { right: 32, bottom: 32, width: 330, height: 174 }
            : { left: 16, right: 16, bottom: 60, height: 100 }),
          transformOrigin: "right bottom",
          transform: "scale(0)",
          pointerEvents: "none",
          background: "#fff",
          borderRadius: 1335,
        }}
      >
        <span
          style={{
            fontSize: isDesktop ? 56 : 36,
            fontWeight: 400,
            letterSpacing: "0.4em",
            paddingLeft: "0.4em",
            color: "#fff",
            mixBlendMode: "exclusion",
            fontFamily: SERIF,
          }}
        >
          ご予約
        </span>
      </Link>

      {/* 1J. フッター */}
      <div
        id="outro-footer"
        ref={footerRef}
        className="fixed z-20 flex text-white"
        style={{
          mixBlendMode: "exclusion",
          left: 16,
          right: isDesktop ? "auto" : 16,
          bottom: isDesktop ? 32 : 24,
          gap: isDesktop ? 80 : undefined,
          justifyContent: isDesktop ? "flex-start" : "space-between",
          opacity: 0,
          pointerEvents: "none",
          fontSize: isDesktop ? 12 : 11,
          fontWeight: 400,
          letterSpacing: "0.2em",
          fontFamily: SERIF,
        }}
      >
        <span>hue. (R) 2026 — 東京・青山</span>
        <Link
          href="/privacy"
          className="border-b border-white/40 transition-opacity hover:opacity-70"
        >
          プライバシーポリシー
        </Link>
      </div>
    </div>
  );
}
