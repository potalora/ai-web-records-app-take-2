"use client";

import { RECORD_TYPE_SHORT, RECORD_TYPE_COLORS, DEFAULT_RECORD_COLOR } from "@/lib/constants";

interface LogEntry {
  id: string;
  timestamp: string | null;
  recordType: string;
  text: string;
}

interface TerminalLogProps {
  entries: LogEntry[];
  onClickEntry?: (id: string) => void;
}

function formatTimestamp(dateStr: string | null): string {
  if (!dateStr) return "[----.--.-- --:--]";
  const d = new Date(dateStr);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  const h = String(d.getHours()).padStart(2, "0");
  const min = String(d.getMinutes()).padStart(2, "0");
  return `[${y}.${m}.${day} ${h}:${min}]`;
}

export function TerminalLog({ entries, onClickEntry }: TerminalLogProps) {
  if (entries.length === 0) {
    return (
      <div className="py-8 text-center">
        <span
          className="text-xs tracking-wider"
          style={{ color: "var(--retro-text-muted)" }}
        >
          NO ENTRIES IN LOG
        </span>
      </div>
    );
  }

  return (
    <div className="space-y-0">
      {entries.map((entry) => {
        const colors = RECORD_TYPE_COLORS[entry.recordType] || DEFAULT_RECORD_COLOR;
        const shortType = RECORD_TYPE_SHORT[entry.recordType] || entry.recordType.toUpperCase().slice(0, 4);
        return (
          <div
            key={entry.id}
            className="flex items-start gap-3 py-1.5 border-b transition-colors"
            style={{
              borderColor: "var(--retro-border)",
              cursor: onClickEntry ? "pointer" : undefined,
            }}
            onClick={() => onClickEntry?.(entry.id)}
            onMouseEnter={(e) => {
              if (onClickEntry) e.currentTarget.style.backgroundColor = "var(--retro-bg-card-hover)";
            }}
            onMouseLeave={(e) => {
              if (onClickEntry) e.currentTarget.style.backgroundColor = "transparent";
            }}
          >
            <span
              className="text-xs shrink-0"
              style={{ color: "var(--retro-amber-dim)" }}
            >
              {formatTimestamp(entry.timestamp)}
            </span>
            <span
              className="text-xs font-medium shrink-0 uppercase"
              style={{ color: colors.text, minWidth: "3rem" }}
            >
              {shortType}
            </span>
            <span
              className="text-sm truncate"
              style={{ color: "var(--retro-text)" }}
            >
              {entry.text}
            </span>
          </div>
        );
      })}
    </div>
  );
}
