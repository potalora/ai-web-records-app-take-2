"use client";

import React from "react";
import { DetailRow, str, arr, obj, nested, formatDate } from "./shared";

const MODALITY_COLORS: Record<string, string> = {
  CT: "var(--record-imaging-text)",
  MRI: "var(--record-procedure-text)",
  "X-Ray": "var(--theme-ochre)",
  XR: "var(--theme-ochre)",
  US: "var(--theme-sage)",
  MG: "var(--theme-sienna)",
  NM: "var(--theme-terracotta)",
};

export function ImagingRenderer({ r }: { r: Record<string, unknown> }) {
  const description = str(r.description) || str(nested(r, "code", "text")) || "";
  const startedDate = formatDate(r.started);

  // Modality badges
  const modalityArr = arr(r.modality);
  const modalityCodes: string[] = [];
  for (const m of modalityArr) {
    const code = str(obj(m).code) || str(nested(obj(m), "coding", "0", "code"));
    const display = str(obj(m).display) || str(nested(obj(m), "coding", "0", "display"));
    if (code || display) modalityCodes.push(display || code);
  }
  // Fallback: single modality on study level
  if (modalityCodes.length === 0) {
    const singleModality = str(nested(r, "modality", "code")) || str(nested(r, "modality", "display"));
    if (singleModality) modalityCodes.push(singleModality);
  }

  const procedureCodes = arr(r.procedureCode);
  const procedureNames = procedureCodes
    .map((p) => str(obj(p).text) || str(nested(obj(p), "coding", "0", "display")))
    .filter(Boolean);

  const series = arr(r.series);
  const seriesCount = series.length;

  return (
    <div className="space-y-3">
      {description && (
        <p
          className="text-base font-semibold"
          style={{ color: "var(--theme-text)", fontFamily: "var(--font-body)" }}
        >
          {description}
        </p>
      )}

      {/* Modality badges */}
      {modalityCodes.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {modalityCodes.map((mod) => (
            <span
              key={mod}
              className="px-2 py-0.5 text-xs font-semibold rounded"
              style={{
                backgroundColor: "var(--record-imaging-bg)",
                color: MODALITY_COLORS[mod] ?? "var(--record-imaging-text)",
              }}
            >
              {mod}
            </span>
          ))}
        </div>
      )}

      <DetailRow label="Study Date" value={startedDate} />

      {procedureNames.length > 0 && (
        <DetailRow label="Procedure" value={procedureNames.join(", ")} />
      )}

      {seriesCount > 0 && (
        <DetailRow label="Series" value={`${seriesCount} series`} />
      )}
    </div>
  );
}
