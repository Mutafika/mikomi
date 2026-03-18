"use client";

import { useState } from "react";

interface Props {
  text: string;
  children: React.ReactNode;
}

export function Tip({ text, children }: Props) {
  const [show, setShow] = useState(false);

  return (
    <span className="relative inline-flex items-center gap-1.5">
      {children}
      <span
        className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-blue-500/20 text-blue-400 text-[10px] font-bold cursor-help shrink-0"
        onMouseEnter={() => setShow(true)}
        onMouseLeave={() => setShow(false)}
        onClick={() => setShow(!show)}
      >
        ?
      </span>
      {show && (
        <span className="absolute z-50 top-full left-0 mt-2 px-3 py-2 bg-foreground text-background text-sm rounded-lg shadow-lg w-64 leading-snug whitespace-normal">
          {text}
        </span>
      )}
    </span>
  );
}
