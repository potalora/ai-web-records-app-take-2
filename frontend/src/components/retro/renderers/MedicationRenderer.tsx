"use client";

import React from "react";
import { DetailRow, StatusBadge, BarRow, str, obj, arr, nested, formatDate } from "./shared";

export function MedicationRenderer({ r }: { r: Record<string, unknown> }) {
  const name =
    str(nested(r, "medicationCodeableConcept", "text")) ||
    str(nested(r, "code", "text")) ||
    "";

  const dosageArr = arr(r.dosageInstruction ?? r.dosage);
  const firstDosage = obj(dosageArr[0]);
  const dosageText = str(firstDosage.text) || str(nested(firstDosage, "doseAndRate", "0", "doseQuantity", "value"));
  const route = str(nested(firstDosage, "route", "text")) || str(nested(firstDosage, "route", "coding", "0", "display"));
  const timing = str(nested(firstDosage, "timing", "code", "text")) || str(nested(firstDosage, "timing", "repeat", "frequency"));
  const prescriber = str(nested(r, "requester", "display"));
  const authoredOn = formatDate(r.authoredOn);
  const effectiveStart = formatDate(nested(r, "effectivePeriod", "start") ?? nested(r, "dispenseRequest", "validityPeriod", "start"));
  const effectiveEnd = formatDate(nested(r, "effectivePeriod", "end") ?? nested(r, "dispenseRequest", "validityPeriod", "end"));
  const status = str(r.status);

  // Dispense info
  const dispenseQuantity = str(nested(r, "dispenseRequest", "quantity", "value"));
  const dispenseUnit = str(nested(r, "dispenseRequest", "quantity", "unit"));
  const refills = str(nested(r, "dispenseRequest", "numberOfRepeatsAllowed"));

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

      {/* Dosage strip */}
      {(dosageText || route || timing) && (
        <div
          className="flex flex-wrap items-center gap-x-4 gap-y-1 px-3 py-2 rounded-md text-xs"
          style={{
            backgroundColor: "var(--record-medication-bg)",
            color: "var(--record-medication-text)",
          }}
        >
          {dosageText && <span className="font-semibold">{dosageText}</span>}
          {route && <span>{route}</span>}
          {timing && <span>{timing}</span>}
        </div>
      )}

      <DetailRow label="Prescriber" value={prescriber} />

      {/* Date range bar */}
      {(effectiveStart || effectiveEnd) && (
        <div
          className="flex items-center gap-2 px-3 py-2 rounded-md text-xs"
          style={{ backgroundColor: "var(--theme-bg-deep)" }}
        >
          {effectiveStart && (
            <>
              <span style={{ color: "var(--theme-text-muted)" }}>Start</span>
              <span style={{ color: "var(--theme-text)" }}>{effectiveStart}</span>
            </>
          )}
          {effectiveEnd && (
            <>
              <span style={{ color: "var(--theme-text-muted)" }}>→ End</span>
              <span style={{ color: "var(--theme-text)" }}>{effectiveEnd}</span>
            </>
          )}
        </div>
      )}

      {authoredOn && !effectiveStart && <DetailRow label="Authored" value={authoredOn} />}

      {/* Dispense info */}
      {(dispenseQuantity || refills) && (
        <BarRow
          items={[
            { label: "Quantity", value: dispenseQuantity ? `${dispenseQuantity} ${dispenseUnit}` : "" },
            { label: "Refills", value: refills },
          ]}
        />
      )}

      {status && (
        <div className="pt-1">
          <StatusBadge label={status} />
        </div>
      )}
    </div>
  );
}
