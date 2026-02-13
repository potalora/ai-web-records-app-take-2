"use client";

import { cn } from "@/lib/utils";

interface RetroButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "ghost" | "destructive" | "large";
  children: React.ReactNode;
}

const variantStyles: Record<string, React.CSSProperties> = {
  primary: {
    backgroundColor: "var(--retro-amber)",
    color: "var(--retro-bg-deep)",
  },
  ghost: {
    backgroundColor: "transparent",
    color: "var(--retro-amber)",
    border: "1px solid var(--retro-border)",
  },
  destructive: {
    backgroundColor: "var(--retro-terracotta)",
    color: "var(--retro-text)",
  },
  large: {
    backgroundColor: "var(--retro-amber)",
    color: "var(--retro-bg-deep)",
  },
};

export function RetroButton({
  variant = "primary",
  className,
  children,
  disabled,
  ...props
}: RetroButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center font-semibold tracking-wider uppercase transition-all cursor-pointer",
        variant === "large"
          ? "px-8 py-3 text-sm"
          : "px-4 py-2 text-xs",
        disabled && "opacity-50 cursor-not-allowed",
        className,
      )}
      style={{
        ...variantStyles[variant],
        fontFamily: "var(--font-display)",
        borderRadius: "2px",
        animation: variant === "large" && !disabled ? "pulse-glow 2s ease-in-out infinite" : undefined,
      }}
      disabled={disabled}
      onMouseEnter={(e) => {
        if (disabled) return;
        if (variant === "ghost") {
          e.currentTarget.style.borderColor = "var(--retro-amber)";
          e.currentTarget.style.textShadow = "0 0 8px rgba(224, 144, 64, 0.4)";
        } else {
          e.currentTarget.style.filter = "brightness(1.15)";
          e.currentTarget.style.textShadow = "0 0 4px rgba(0,0,0,0.3)";
        }
      }}
      onMouseLeave={(e) => {
        if (disabled) return;
        if (variant === "ghost") {
          e.currentTarget.style.borderColor = "var(--retro-border)";
          e.currentTarget.style.textShadow = "none";
        } else {
          e.currentTarget.style.filter = "none";
          e.currentTarget.style.textShadow = "none";
        }
      }}
      {...props}
    >
      {children}
    </button>
  );
}
