"use client";

import { useState, useEffect } from "react";

const GUIDE_KEY = "mikomi-guide-done";

const steps = [
  { target: "[data-guide='plans']", title: "料金プラン", text: "プランごとに月額単価・顧客数・解約率を設定。複数プランOK。" },
  { target: "[data-guide='employees']", title: "採用計画", text: "社員を追加して、何ヶ月目に雇うか設定。営業なら顧客獲得もシミュレート。" },
  { target: "[data-guide='costs']", title: "コスト", text: "固定費・初期費用・融資を設定。ドロップダウンからよくある項目を選択可能。" },
  { target: "[data-guide='chart']", title: "グラフ", text: "キャッシュフローと損益の推移をリアルタイムで確認。" },
  { target: "[data-guide='scenario']", title: "シナリオ", text: "現在の設定を保存して、楽観/悲観を比較できます。" },
];

export function Guide() {
  const [currentStep, setCurrentStep] = useState(-1);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (localStorage.getItem(GUIDE_KEY) !== "true") {
      const timer = setTimeout(() => {
        setCurrentStep(0);
        setVisible(true);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, []);

  if (!visible || currentStep < 0) return null;

  const step = steps[currentStep];
  const isLast = currentStep === steps.length - 1;

  const dismiss = () => {
    setVisible(false);
    localStorage.setItem(GUIDE_KEY, "true");
  };

  const next = () => {
    if (isLast) {
      dismiss();
    } else {
      setCurrentStep((s) => s + 1);
    }
  };

  // ターゲット要素の位置を取得
  const el = typeof document !== "undefined" ? document.querySelector(step.target) : null;
  const rect = el?.getBoundingClientRect();

  return (
    <>
      {/* オーバーレイ */}
      <div className="fixed inset-0 bg-black/40 z-40" onClick={dismiss} />

      {/* ハイライト */}
      {rect && (
        <div
          className="fixed z-40 border-2 border-blue-400 rounded-lg pointer-events-none"
          style={{
            top: rect.top - 4,
            left: rect.left - 4,
            width: rect.width + 8,
            height: rect.height + 8,
          }}
        />
      )}

      {/* 吹き出し */}
      <div
        className="fixed z-50 bg-background border border-border rounded-lg shadow-xl p-4 max-w-xs"
        style={{
          top: rect ? rect.bottom + 12 : "50%",
          left: rect ? Math.min(rect.left, window.innerWidth - 320) : "50%",
          ...(!rect ? { transform: "translate(-50%, -50%)" } : {}),
        }}
      >
        <div className="flex items-center justify-between mb-2">
          <p className="font-bold text-sm">{step.title}</p>
          <span className="text-xs text-muted">{currentStep + 1}/{steps.length}</span>
        </div>
        <p className="text-sm text-muted mb-3">{step.text}</p>
        <div className="flex items-center justify-between">
          <button onClick={dismiss} className="text-xs text-muted hover:text-foreground">スキップ</button>
          <button onClick={next} className="bg-blue-600 hover:bg-blue-700 text-white text-sm px-4 py-1 rounded">
            {isLast ? "完了" : "次へ"}
          </button>
        </div>
      </div>
    </>
  );
}
