"use client";

import { useState, useEffect } from "react";

const GUIDE_KEY = "mikomi-guide-done";

const steps = [
  { target: "[data-guide='plans']", title: "1/5 料金プラン", text: "プランごとに月額単価・顧客数・解約率を設定。複数プランOK。" },
  { target: "[data-guide='employees']", title: "2/5 採用計画", text: "社員を追加して、何ヶ月目に雇うか設定。営業なら顧客獲得もシミュレート。" },
  { target: "[data-guide='costs']", title: "3/5 コスト", text: "固定費・初期費用・融資を設定。ドロップダウンからよくある項目を選択可能。" },
  { target: "[data-guide='chart']", title: "4/5 グラフ", text: "キャッシュフローと損益の推移をリアルタイムで確認。" },
  { target: "[data-guide='scenario']", title: "5/5 シナリオ", text: "現在の設定を保存して、楽観/悲観を比較できます。" },
];

export function Guide() {
  const [currentStep, setCurrentStep] = useState(-1);
  const [visible, setVisible] = useState(false);
  const [rect, setRect] = useState<DOMRect | null>(null);

  useEffect(() => {
    if (localStorage.getItem(GUIDE_KEY) !== "true") {
      const timer = setTimeout(() => {
        setCurrentStep(0);
        setVisible(true);
      }, 800);
      return () => clearTimeout(timer);
    }
  }, []);

  // ステップ変更時にスクロールして位置取得
  useEffect(() => {
    if (!visible || currentStep < 0) return;

    const el = document.querySelector(steps[currentStep].target);
    if (!el) { setRect(null); return; }

    el.scrollIntoView({ behavior: "smooth", block: "center" });

    // スクロール完了後に位置取得
    const timer = setTimeout(() => {
      setRect(el.getBoundingClientRect());
    }, 400);

    return () => clearTimeout(timer);
  }, [visible, currentStep]);

  // スクロールロック（位置取得後）
  useEffect(() => {
    if (visible && rect) {
      document.body.style.overflow = "hidden";
      return () => { document.body.style.overflow = ""; };
    }
  }, [visible, rect]);

  if (!visible || currentStep < 0) return null;

  const step = steps[currentStep];
  const isLast = currentStep === steps.length - 1;

  const dismiss = () => {
    setVisible(false);
    document.body.style.overflow = "";
    localStorage.setItem(GUIDE_KEY, "true");
  };

  const next = () => {
    if (isLast) {
      dismiss();
    } else {
      setRect(null); // リセットしてスクロール解除
      document.body.style.overflow = "";
      setCurrentStep((s) => s + 1);
    }
  };

  return (
    <>
      {/* オーバーレイ（ターゲット部分をくり抜き） */}
      <div className="fixed inset-0 z-40" onClick={dismiss}>
        <svg className="w-full h-full">
          <defs>
            <mask id="guide-mask">
              <rect width="100%" height="100%" fill="white" />
              {rect && (
                <rect
                  x={rect.left - 6}
                  y={rect.top - 6}
                  width={rect.width + 12}
                  height={rect.height + 12}
                  rx="8"
                  fill="black"
                />
              )}
            </mask>
          </defs>
          <rect width="100%" height="100%" fill="rgba(0,0,0,0.5)" mask="url(#guide-mask)" />
          {rect && (
            <rect
              x={rect.left - 6}
              y={rect.top - 6}
              width={rect.width + 12}
              height={rect.height + 12}
              rx="8"
              fill="none"
              stroke="#3b82f6"
              strokeWidth="2"
            />
          )}
        </svg>
      </div>

      {/* 吹き出し */}
      <div
        className="fixed z-50 bg-background border border-border rounded-lg shadow-xl p-4 w-72"
        style={rect ? {
          top: rect.bottom + 16 + rect.height > window.innerHeight
            ? Math.max(16, rect.top - 160)
            : rect.bottom + 16,
          left: Math.max(16, Math.min(rect.left, window.innerWidth - 304)),
        } : {
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <p className="font-bold text-sm mb-1">{step.title}</p>
        <p className="text-sm text-muted mb-3">{step.text}</p>
        <div className="flex items-center justify-between">
          <button onClick={dismiss} className="text-sm text-muted hover:text-foreground">スキップ</button>
          <button onClick={next} className="bg-blue-600 hover:bg-blue-700 text-white text-sm px-4 py-1.5 rounded">
            {isLast ? "完了" : "次へ"}
          </button>
        </div>
      </div>
    </>
  );
}
