"use client";

import React from "react";
import { DetailRow, str, obj, nested, formatDate } from "./shared";

export function ObservationSocialRenderer({ r }: { r: Record<string, unknown> }) {
  const name =
    str(nested(r, "code", "text")) ||
    str(nested(r, "code", "coding", "0", "display")) ||
    "";
  const valueQuantity = obj(r.valueQuantity);
  const valueNum = str(valueQuantity.value);
  const valueUnit = str(valueQuantity.unit);
  const valueString = str(r.valueString);
  const valueCodeable = str(nested(r, "valueCodeableConcept", "text")) ||
    str(nested(r, "valueCodeableConcept", "coding", "0", "display"));
  const displayValue = valueCodeable || valueString || (valueNum ? `${valueNum} ${valueUnit}` : "");
  const effectiveDate = formatDate(r.effectiveDateTime);

  return (
    <div
      className="space-y-2 px-3 py-2 rounded-md"
      style={{
        backgroundColor: "var(--theme-bg-deep)",
        borderLeft: "2px solid var(--theme-border-active)",
      }}
    >
      {name && (
        <p className="text-[13px] font-medium" style={{ color: "var(--theme-text-muted)" }}>
          {name}
        </p>
      )}
      {displayValue && (
        <p className="text-sm" style={{ color: "var(--theme-text)" }}>
          {displayValue}
        </p>
      )}
      <DetailRow label="Date" value={effectiveDate} />
    </div>
  );
}
