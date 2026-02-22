"use client";

import React from "react";
import { DetailRow, StatusBadge, str, nested, formatDate } from "./shared";

export function ProcedureRenderer({ r }: { r: Record<string, unknown> }) {
  const name =
    str(nested(r, "code", "text")) ||
    str(nested(r, "code", "coding", "0", "display")) ||
    "";
  const date = formatDate(r.performedDateTime ?? nested(r, "performedPeriod", "start"));
  const status = str(r.status);
  const provider =
    str(nested(r, "performer", "0", "actor", "display")) ||
    str(nested(r, "asserter", "display")) ||
    "";
  const codeValue = str(nested(r, "code", "coding", "0", "code"));
  const codeSystem = str(nested(r, "code", "coding", "0", "system"));

  return (
    <div className="space-y-3">
      {name && (
        <p
          className="text-base font-semibold"
          style={{ color: "var(--theme-text)", fontFamily: "var(--font-body)" }}
        >
          {name}
        </p>
      )}
      <DetailRow label="Date" value={date} />
      {status && (
        <div className="pt-1">
          <StatusBadge label={status} />
        </div>
      )}
      <DetailRow label="Provider" value={provider} />

      {/* Code footer strip */}
      {codeValue && (
        <div
          className="flex items-center gap-2 px-3 py-1.5 rounded-md text-xs"
          style={{
            backgroundColor: "var(--theme-bg-deep)",
            fontFamily: "var(--font-mono)",
          }}
        >
          <span style={{ color: "var(--theme-text-muted)" }}>Code</span>
          <span style={{ color: "var(--theme-amber)" }}>{codeValue}</span>
          {codeSystem && (
            <span className="text-[11px]" style={{ color: "var(--theme-text-dim)" }}>
              ({codeSystem})
            </span>
          )}
        </div>
      )}
    </div>
  );
}
