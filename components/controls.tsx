"use client";

import { useId, useState, type ReactNode } from "react";
import { motion } from "motion/react";
import { parseHex } from "@/lib/color";

export function Section({
  title,
  hint,
  children,
}: {
  title: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-zinc-800/80 bg-zinc-900/40 p-4 backdrop-blur-sm">
      <div className="mb-3 flex items-baseline justify-between gap-2">
        <h3 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-zinc-400">
          {title}
        </h3>
        {hint && <p className="text-[11px] text-zinc-600">{hint}</p>}
      </div>
      <div className="space-y-4">{children}</div>
    </section>
  );
}

export function Segmented<T extends string>({
  value,
  onChange,
  options,
  disabled,
}: {
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: string; title?: string }[];
  disabled?: boolean;
}) {
  const layoutId = useId();
  return (
    <div className="flex flex-wrap gap-1 rounded-xl border border-zinc-800 bg-zinc-950/60 p-1">
      {options.map((o) => {
        const active = o.value === value;
        return (
          <button
            key={o.value}
            type="button"
            disabled={disabled}
            title={o.title}
            onClick={() => onChange(o.value)}
            className={`relative flex-1 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors ${
              active ? "text-zinc-900" : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            {active && (
              <motion.span
                layoutId={layoutId}
                className="absolute inset-0 rounded-lg bg-zinc-100"
                transition={{ type: "spring", stiffness: 480, damping: 36 }}
              />
            )}
            <span className="relative z-10">{o.label}</span>
          </button>
        );
      })}
    </div>
  );
}

export function ColorField({
  label,
  value,
  onChange,
  swatches,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  swatches?: string[];
}) {
  const [text, setText] = useState(value);
  const [prevValue, setPrevValue] = useState(value);
  // Keep the text field in sync when the color changes externally.
  if (prevValue !== value) {
    setPrevValue(value);
    setText(value);
  }

  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-xs text-zinc-400">{label}</span>
      <div className="flex items-center gap-2">
        {swatches && swatches.length > 0 && (
          <div className="flex items-center gap-1">
            {swatches.slice(0, 4).map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => onChange(c)}
                aria-label={`Use ${c}`}
                className="h-5 w-5 rounded-md border border-white/10 transition-transform hover:scale-110"
                style={{ background: c }}
              />
            ))}
          </div>
        )}
        <input
          type="color"
          className="color-swatch h-8 w-10"
          value={parseHex(value) ?? "#000000"}
          onChange={(e) => onChange(e.target.value)}
          aria-label={`${label} color picker`}
        />
        <input
          type="text"
          value={text}
          onChange={(e) => {
            setText(e.target.value);
            const parsed = parseHex(e.target.value);
            if (parsed) onChange(parsed);
          }}
          onBlur={() => setText(value)}
          spellCheck={false}
          className="w-[78px] rounded-lg border border-zinc-800 bg-zinc-950/70 px-2 py-1 font-mono text-[11px] text-zinc-300 outline-none transition focus:border-zinc-600"
        />
      </div>
    </div>
  );
}

export function RangeField({
  label,
  value,
  min,
  max,
  step = 1,
  onChange,
  format,
  disabled,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (v: number) => void;
  format?: (v: number) => string;
  disabled?: boolean;
}) {
  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between">
        <span className="text-xs text-zinc-400">{label}</span>
        <span className="font-mono text-[11px] text-zinc-500">
          {format ? format(value) : value}
        </span>
      </div>
      <input
        type="range"
        className="slider"
        min={min}
        max={max}
        step={step}
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(Number(e.target.value))}
      />
    </div>
  );
}

export function Toggle({
  label,
  description,
  checked,
  onChange,
  disabled,
}: {
  label: string;
  description?: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className="flex w-full items-center justify-between gap-3 py-0.5 text-left disabled:opacity-40"
    >
      <span className="flex flex-col gap-0.5">
        <span className="text-xs text-zinc-300">{label}</span>
        {description && (
          <span className="text-[11px] text-zinc-500">{description}</span>
        )}
      </span>
      <span
        className={`relative h-5 w-9 shrink-0 rounded-full transition-colors ${
          checked ? "bg-indigo-500" : "bg-zinc-700"
        }`}
      >
        <span
          className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${
            checked ? "translate-x-[18px]" : "translate-x-0.5"
          }`}
        />
      </span>
    </button>
  );
}
