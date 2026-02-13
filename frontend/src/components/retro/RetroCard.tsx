"use client";

import { cn } from "@/lib/utils";

interface RetroCardProps {
  className?: string;
  accentTop?: boolean;
  children: React.ReactNode;
}

export function RetroCard({ className, accentTop, children }: RetroCardProps) {
  return (
    <div
      className={cn(
        "border transition-colors",
        className,
      )}
      style={{
        backgroundColor: "var(--retro-bg-card)",
        borderColor: "var(--retro-border)",
        borderRadius: "4px",
        borderTop: accentTop ? "2px solid var(--retro-amber)" : undefined,
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = "var(--retro-border-active)";
        if (accentTop) e.currentTarget.style.borderTop = "2px solid var(--retro-amber)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = "var(--retro-border)";
        if (accentTop) e.currentTarget.style.borderTop = "2px solid var(--retro-amber)";
      }}
    >
      {children}
    </div>
  );
}

export function RetroCardHeader({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className={cn("px-4 py-3 border-b", className)}
      style={{ borderColor: "var(--retro-border)" }}
    >
      {children}
    </div>
  );
}

export function RetroCardContent({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return <div className={cn("px-4 py-4", className)}>{children}</div>;
}
