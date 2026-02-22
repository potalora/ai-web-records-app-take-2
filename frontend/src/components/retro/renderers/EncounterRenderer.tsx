"use client";

import React from "react";
import { DetailRow, StatusBadge, str, nested, formatDate } from "./shared";

const CLASS_BORDER_COLORS: Record<string, string> = {
  amb: "var(--theme-sage)",
  ambulatory: "var(--theme-sage)",
  imp: "var(--theme-ochre)",
  inpatient: "var(--theme-ochre)",
  emer: "var(--theme-terracotta)",
  emergency: "var(--theme-terracotta)",
  vr: "var(--record-procedure-text)",
  virtual: "var(--record-procedure-text)",
};

export function EncounterRenderer({ r }: { r: Record<string, unknown> }) {
  const encounterType =
    str(nested(r, "type", "0", "text")) ||
    str(nested(r, "type", "0", "coding", "0", "display")) ||
    "";
  const status = str(r.status);
  const periodStart = formatDate(nested(r, "period", "start"));
  const periodEnd = formatDate(nested(r, "period", "end"));
  const department = str(nested(r, "location", "0", "location", "display"));
  const provider = str(nested(r, "participant", "0", "individual", "display"));
  const reason = str(nested(r, "reasonCode", "0", "text")) || str(nested(r, "reasonCode", "0", "coding", "0", "display"));

  const encounterClass = str(nested(r, "class", "code")).toLowerCase() ||
    str(nested(r, "class", "display")).toLowerCase();
  const borderColor = CLASS_BORDER_COLORS[encounterClass] ?? "var(--record-encounter-dot)";

  return (
    <div
      className="space-y-3 record-accent-left"
      style={{ "--accent-color": borderColor } as React.CSSProperties}
    >
      {encounterType && (
        <p
          className="text-base font-semibold"
          style={{ color: "var(--theme-text)", fontFamily: "var(--font-body)" }}
        >
          {encounterType}
        </p>
      )}

      {/* Date range */}
      {periodStart && (
        <div className="flex items-center gap-2 text-xs">
          <span style={{ color: "var(--theme-text)" }}>{periodStart}</span>
          {periodEnd && periodEnd !== periodStart && (
            <>
              <span style={{ color: "var(--theme-text-muted)" }}>→</span>
              <span style={{ color: "var(--theme-text)" }}>{periodEnd}</span>
            </>
          )}
        </div>
      )}

      {status && (
        <div>
          <StatusBadge label={status} />
        </div>
      )}

      <DetailRow label="Department" value={department} />
      <DetailRow label="Provider" value={provider} />
      <DetailRow label="Reason" value={reason} />
    </div>
  );
}
