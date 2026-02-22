"use client";

import React from "react";
import { DetailRow, StatusBadge, str, arr, nested, formatDate } from "./shared";

export function DiagnosticReportRenderer({ r }: { r: Record<string, unknown> }) {
  const name =
    str(nested(r, "code", "text")) ||
    str(nested(r, "code", "coding", "0", "display")) ||
    "";
  const status = str(r.status);
  const effectiveDate = formatDate(r.effectiveDateTime ?? nested(r, "effectivePeriod", "start"));
  const issued = formatDate(r.issued);
  const conclusion = str(r.conclusion);
  const results = arr(r.result);
  const performers = arr(r.performer);
  const interpreterNames = performers.map((p) => str((p as Record<string, unknown>)?.display)).filter(Boolean);

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

      {status && (
        <div>
          <StatusBadge label={status} />
        </div>
      )}

      <DetailRow label="Effective" value={effectiveDate} />
      <DetailRow label="Issued" value={issued} />

      {/* Conclusion block */}
      {conclusion && (
        <div
          className="px-3 py-2 rounded-md text-xs"
          style={{
            backgroundColor: "var(--record-diagnostic_report-bg)",
            color: "var(--theme-text)",
            borderLeft: "2px solid var(--record-diagnostic_report-dot)",
          }}
        >
          <div className="text-[10px] font-medium mb-1" style={{ color: "var(--theme-text-muted)" }}>
            Conclusion
          </div>
          {conclusion}
        </div>
      )}

      {results.length > 0 && (
        <DetailRow label="Results" value={`${results.length} result(s)`} />
      )}

      {interpreterNames.length > 0 && (
        <DetailRow label="Performer" value={interpreterNames.join(", ")} />
      )}
    </div>
  );
}
