"use client";

import { cn } from "@/lib/utils";

interface RetroTab {
  key: string;
  label: string;
  separator?: boolean;
}

interface RetroTabsProps {
  tabs: RetroTab[];
  active: string;
  onChange: (key: string) => void;
}

export function RetroTabs({ tabs, active, onChange }: RetroTabsProps) {
  return (
    <div
      className="flex items-center gap-0.5 overflow-x-auto border-b pb-px"
      style={{ borderColor: "var(--retro-border)" }}
    >
      {tabs.map((tab) => {
        if (tab.separator) {
          return (
            <span
              key={tab.key}
              className="px-1 text-xs select-none"
              style={{ color: "var(--retro-text-muted)" }}
            >
              |
            </span>
          );
        }
        const isActive = active === tab.key;
        return (
          <button
            key={tab.key}
            onClick={() => onChange(tab.key)}
            className={cn(
              "relative px-3 py-2 text-xs font-medium uppercase tracking-wider transition-colors whitespace-nowrap cursor-pointer",
              isActive && "crt-glow",
            )}
            style={{
              color: isActive ? "var(--retro-amber)" : "var(--retro-text-dim)",
              fontFamily: "var(--font-display)",
            }}
            onMouseEnter={(e) => {
              if (!isActive) e.currentTarget.style.color = "var(--retro-text)";
            }}
            onMouseLeave={(e) => {
              if (!isActive) e.currentTarget.style.color = "var(--retro-text-dim)";
            }}
          >
            {tab.label}
            {isActive && (
              <span
                className="absolute bottom-0 left-1 right-1 h-px retro-underline-glow"
                style={{
                  backgroundColor: "var(--retro-amber)",
                }}
              />
            )}
          </button>
        );
      })}
    </div>
  );
}
