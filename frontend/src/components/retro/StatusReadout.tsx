"use client";

interface StatusItem {
  label: string;
  value: string | number;
}

interface StatusReadoutProps {
  items: StatusItem[];
}

export function StatusReadout({ items }: StatusReadoutProps) {
  return (
    <div
      className="flex flex-wrap items-center gap-x-4 gap-y-1 px-4 py-3 border text-xs"
      style={{
        backgroundColor: "var(--retro-bg-surface)",
        borderColor: "var(--retro-border)",
        borderRadius: "4px",
      }}
    >
      {items.map((item, i) => (
        <span key={item.label} className="flex items-center gap-2">
          {i > 0 && (
            <span style={{ color: "var(--retro-text-muted)" }}>|</span>
          )}
          <span
            className="uppercase tracking-wider"
            style={{ color: "var(--retro-text-dim)" }}
          >
            {item.label}:
          </span>
          <span
            className="font-medium"
            style={{ color: "var(--retro-text)" }}
          >
            {item.value}
          </span>
        </span>
      ))}
    </div>
  );
}
