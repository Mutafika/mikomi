"use client";

import { useState, useRef, useEffect } from "react";

interface Option {
  name: string;
  amount?: number;
}

interface Props {
  value: string;
  options: Option[];
  onChange: (name: string, amount?: number) => void;
  placeholder?: string;
  className?: string;
}

export function ComboBox({ value, options, onChange, placeholder, className }: Props) {
  const [open, setOpen] = useState(false);
  const [filter, setFilter] = useState("");
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const filtered = filter
    ? options.filter((o) => o.name.includes(filter))
    : options;

  return (
    <div ref={ref} className="relative flex-1">
      <input
        value={value}
        onChange={(e) => {
          setFilter(e.target.value);
          onChange(e.target.value);
          if (!open) setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        placeholder={placeholder}
        className={className}
      />
      {open && filtered.length > 0 && (
        <div className="absolute z-50 left-0 right-0 top-full mt-1 bg-background border border-border rounded shadow-lg max-h-48 overflow-y-auto">
          {filtered.map((o) => (
            <button
              key={o.name}
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => {
                onChange(o.name, o.amount);
                setFilter("");
                setOpen(false);
              }}
              className="w-full text-left px-3 py-1.5 text-sm hover:bg-surface flex justify-between"
            >
              <span>{o.name}</span>
              {o.amount != null && (
                <span className="text-muted">{o.amount.toLocaleString()}円</span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
