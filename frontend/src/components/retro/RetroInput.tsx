"use client";

import { cn } from "@/lib/utils";

interface RetroInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}

export function RetroInput({ label, className, id, ...props }: RetroInputProps) {
  return (
    <div className="space-y-1.5">
      {label && (
        <label
          htmlFor={id}
          className="text-xs uppercase tracking-wider"
          style={{ color: "var(--retro-text-dim)" }}
        >
          {label}
        </label>
      )}
      <input
        id={id}
        className={cn(
          "w-full px-3 py-2 text-sm border outline-none transition-colors",
          className,
        )}
        style={{
          backgroundColor: "var(--retro-bg-deep)",
          color: "var(--retro-text)",
          borderColor: "var(--retro-border)",
          borderRadius: "2px",
        }}
        onFocus={(e) => {
          e.currentTarget.style.borderColor = "var(--retro-amber)";
          e.currentTarget.style.boxShadow = "0 0 4px rgba(224, 144, 64, 0.2)";
        }}
        onBlur={(e) => {
          e.currentTarget.style.borderColor = "var(--retro-border)";
          e.currentTarget.style.boxShadow = "none";
        }}
        {...props}
      />
    </div>
  );
}
