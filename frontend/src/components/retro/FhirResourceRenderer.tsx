"use client";

import React from "react";

interface FhirResourceRendererProps {
  recordType: string;
  fhirResource: Record<string, unknown>;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function DetailRow({
  label,
  value,
  mono,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  if (!value) return null;
  return (
    <div className="flex items-baseline justify-between gap-3 py-1">
      <span
        className="text-xs font-medium shrink-0"
        style={{ color: "var(--theme-text-muted)" }}
      >
        {label}
      </span>
      <span
        className={`text-xs text-right truncate ${mono ? "font-mono" : ""}`}
        style={{ color: "var(--theme-text)" }}
      >
        {value}
      </span>
    </div>
  );
}

function StatusBadge({
  label,
  color,
}: {
  label: string;
  color?: string;
}) {
  if (!label) return null;
  return (
    <span
      className="inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-md"
      style={{
        backgroundColor: color ?? "var(--theme-bg-deep)",
        color: "var(--theme-text)",
      }}
    >
      {label}
    </span>
  );
}

function SectionDivider() {
  return (
    <div
      className="border-t my-2"
      style={{ borderColor: "var(--theme-border)" }}
    />
  );
}

function BarRow({ items }: { items: Array<{ label: string; value: string }> }) {
  const filtered = items.filter((i) => i.value);
  if (filtered.length === 0) return null;
  return (
    <div
      className="flex flex-wrap items-center gap-x-5 gap-y-1 px-3 py-2 rounded-md text-xs"
      style={{
        backgroundColor: "var(--theme-bg-deep)",
        borderColor: "var(--theme-border)",
      }}
    >
      {filtered.map((item) => (
        <span key={item.label} className="flex items-center gap-1.5">
          <span style={{ color: "var(--theme-text-muted)" }}>
            {item.label}:
          </span>
          <span style={{ color: "var(--theme-text)" }}>{item.value}</span>
        </span>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Safe accessors
// ---------------------------------------------------------------------------

function str(val: unknown): string {
  if (val === null || val === undefined) return "";
  if (typeof val === "string") return val;
  if (typeof val === "number" || typeof val === "boolean") return String(val);
  return "";
}

function obj(val: unknown): Record<string, unknown> {
  if (val && typeof val === "object" && !Array.isArray(val))
    return val as Record<string, unknown>;
  return {};
}

function arr(val: unknown): unknown[] {
  if (Array.isArray(val)) return val;
  return [];
}

function nested(root: Record<string, unknown>, ...keys: string[]): unknown {
  let current: unknown = root;
  for (const key of keys) {
    if (current && typeof current === "object" && !Array.isArray(current)) {
      current = (current as Record<string, unknown>)[key];
    } else {
      return undefined;
    }
  }
  return current;
}

function formatDate(val: unknown): string {
  const s = str(val);
  if (!s) return "";
  try {
    const d = new Date(s);
    if (isNaN(d.getTime())) return s;
    return d.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return s;
  }
}

// ---------------------------------------------------------------------------
// Type-specific renderers
// ---------------------------------------------------------------------------

function MedicationRenderer({ r }: { r: Record<string, unknown> }) {
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
  const effectiveStart = formatDate(r._effectiveStart ?? nested(r, "dispenseRequest", "validityPeriod", "start"));
  const effectiveEnd = formatDate(r._effectiveEnd ?? nested(r, "dispenseRequest", "validityPeriod", "end"));
  const status = str(r.status);

  return (
    <div className="space-y-2">
      {name && (
        <p
          className="text-sm font-semibold"
          style={{ color: "var(--theme-text)", fontFamily: "var(--font-body)" }}
        >
          {name}
        </p>
      )}
      <BarRow
        items={[
          { label: "Dosage", value: dosageText },
          { label: "Route", value: route },
          { label: "Frequency", value: timing },
        ]}
      />
      <DetailRow label="Prescriber" value={prescriber} />
      {(authoredOn || effectiveStart || effectiveEnd) && (
        <>
          <DetailRow label="Authored" value={authoredOn} />
          {effectiveStart && <DetailRow label="Start" value={effectiveStart} />}
          {effectiveEnd && <DetailRow label="End" value={effectiveEnd} />}
        </>
      )}
      {status && (
        <div className="pt-1">
          <StatusBadge label={status} />
        </div>
      )}
    </div>
  );
}

function ConditionRenderer({ r }: { r: Record<string, unknown> }) {
  const name = str(nested(r, "code", "text")) || "";
  const clinicalStatus =
    str(nested(r, "clinicalStatus", "coding", "0", "code")) ||
    str(nested(r, "clinicalStatus", "text")) ||
    "";
  const onset = formatDate(r.onsetDateTime);
  const abatement = formatDate(r.abatementDateTime);
  const categoryText =
    str(nested(r, "category", "0", "text")) ||
    str(nested(r, "category", "0", "coding", "0", "display")) ||
    "";
  const notes = str(nested(r, "note", "0", "text"));

  const statusColorMap: Record<string, string> = {
    active: "var(--theme-sage)",
    resolved: "var(--theme-text-muted)",
    inactive: "var(--theme-text-dim)",
    recurrence: "var(--theme-ochre)",
    remission: "var(--theme-text-dim)",
  };

  const badgeColor = statusColorMap[clinicalStatus.toLowerCase()] ?? "var(--theme-bg-deep)";

  return (
    <div className="space-y-2">
      {name && (
        <p
          className="text-sm font-semibold"
          style={{ color: "var(--theme-text)", fontFamily: "var(--font-body)" }}
        >
          {name}
        </p>
      )}
      {clinicalStatus && (
        <div>
          <span
            className="inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-md"
            style={{
              backgroundColor: badgeColor,
              color: clinicalStatus.toLowerCase() === "active" ? "#0d0b08" : "var(--theme-text)",
            }}
          >
            {clinicalStatus}
          </span>
        </div>
      )}
      <DetailRow label="Onset" value={onset} />
      <DetailRow label="Resolved" value={abatement} />
      <DetailRow label="Category" value={categoryText} />
      {notes && (
        <>
          <SectionDivider />
          <p className="text-xs" style={{ color: "var(--theme-text-dim)" }}>
            {notes}
          </p>
        </>
      )}
    </div>
  );
}

function EncounterRenderer({ r }: { r: Record<string, unknown> }) {
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

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        {periodStart && (
          <span className="text-xs" style={{ color: "var(--theme-text-muted)" }}>
            {periodStart}
            {periodEnd && periodEnd !== periodStart ? ` - ${periodEnd}` : ""}
          </span>
        )}
        {encounterType && (
          <span
            className="text-sm font-semibold"
            style={{ color: "var(--theme-text)", fontFamily: "var(--font-body)" }}
          >
            {encounterType}
          </span>
        )}
      </div>
      {status && (
        <div className="pt-1">
          <StatusBadge label={status} />
        </div>
      )}
      <DetailRow label="Department" value={department} />
      <DetailRow label="Provider" value={provider} />
      <DetailRow label="Reason" value={reason} />
    </div>
  );
}

function ObservationLabRenderer({ r }: { r: Record<string, unknown> }) {
  const valueQuantity = obj(r.valueQuantity);
  const valueNum = str(valueQuantity.value);
  const valueUnit = str(valueQuantity.unit);
  const valueString = str(r.valueString);
  const displayValue = valueNum ? `${valueNum}` : valueString;
  const displayUnit = valueUnit || "";

  const refRangeArr = arr(r.referenceRange);
  const refRange = obj(refRangeArr[0]);
  const refLow = str(nested(refRange, "low", "value"));
  const refHigh = str(nested(refRange, "high", "value"));
  const refUnit = str(nested(refRange, "low", "unit")) || str(nested(refRange, "high", "unit"));
  const refText = str(refRange.text) || (refLow || refHigh ? `${refLow || "?"} - ${refHigh || "?"} ${refUnit}` : "");

  const interpretationCode =
    str(nested(r, "interpretation", "0", "coding", "0", "code")) ||
    str(nested(r, "interpretation", "0", "text")) ||
    "";
  const interpUpper = interpretationCode.toUpperCase();

  let interpColor = "var(--theme-text-dim)";
  let interpLabel = interpretationCode;
  if (interpUpper === "H" || interpUpper === "HH" || interpUpper === "HIGH") {
    interpColor = "var(--theme-terracotta)";
    interpLabel = interpUpper === "HH" ? "Critical High" : "High";
  } else if (interpUpper === "L" || interpUpper === "LL" || interpUpper === "LOW") {
    interpColor = "var(--record-procedure-text)";
    interpLabel = interpUpper === "LL" ? "Critical Low" : "Low";
  } else if (interpUpper === "N" || interpUpper === "NORMAL") {
    interpColor = "var(--theme-text-dim)";
    interpLabel = "Normal";
  }

  return (
    <div className="space-y-2">
      {displayValue && (
        <div className="flex items-baseline gap-2">
          <span
            style={{
              fontFamily: "VT323, monospace",
              fontSize: "24px",
              lineHeight: 1,
              color: "var(--theme-amber)",
            }}
          >
            {displayValue}
          </span>
          {displayUnit && (
            <span
              className="text-xs"
              style={{ color: "var(--theme-text-muted)" }}
            >
              {displayUnit}
            </span>
          )}
          {interpretationCode && (
            <span
              className="text-xs font-semibold ml-1"
              style={{ color: interpColor }}
            >
              {interpLabel}
            </span>
          )}
        </div>
      )}
      {refText && <DetailRow label="Reference" value={refText} mono />}
    </div>
  );
}

function ObservationVitalRenderer({ r }: { r: Record<string, unknown> }) {
  const name =
    str(nested(r, "code", "text")) ||
    str(nested(r, "code", "coding", "0", "display")) ||
    "";
  const valueQuantity = obj(r.valueQuantity);
  const valueNum = str(valueQuantity.value);
  const valueUnit = str(valueQuantity.unit);
  const valueString = str(r.valueString);
  const displayValue = valueNum || valueString;
  const effectiveDate = formatDate(r.effectiveDateTime);

  return (
    <div className="space-y-2">
      {name && (
        <p className="text-xs font-medium" style={{ color: "var(--theme-text-muted)" }}>
          {name}
        </p>
      )}
      {displayValue && (
        <div className="flex items-baseline gap-2">
          <span
            style={{
              fontFamily: "VT323, monospace",
              fontSize: "24px",
              lineHeight: 1,
              color: "var(--theme-amber)",
            }}
          >
            {displayValue}
          </span>
          {valueUnit && (
            <span
              className="text-xs"
              style={{ color: "var(--theme-text-muted)" }}
            >
              {valueUnit}
            </span>
          )}
        </div>
      )}
      <DetailRow label="Date" value={effectiveDate} />
    </div>
  );
}

function DocumentRenderer({ r }: { r: Record<string, unknown> }) {
  const docType =
    str(nested(r, "type", "text")) ||
    str(nested(r, "type", "coding", "0", "display")) ||
    "";
  const description = str(r.description);
  const date = formatDate(r.date);
  const author = str(nested(r, "author", "0", "display"));
  const categoryArr = arr(r.category);
  const categoryTexts = categoryArr.map((c) => str(obj(c).text) || str(nested(obj(c), "coding", "0", "display"))).filter(Boolean);
  const isScanned = categoryTexts.some((t) => t.toLowerCase().includes("scanned"));

  return (
    <div className="space-y-2">
      {docType && (
        <p
          className="text-sm font-semibold"
          style={{ color: "var(--theme-text)", fontFamily: "var(--font-body)" }}
        >
          {docType}
        </p>
      )}
      {isScanned && (
        <div>
          <StatusBadge label="Scanned" color="var(--theme-sienna)" />
        </div>
      )}
      <DetailRow label="Description" value={description} />
      <DetailRow label="Date" value={date} />
      <DetailRow label="Author" value={author} />
    </div>
  );
}

function ImmunizationRenderer({ r }: { r: Record<string, unknown> }) {
  const name =
    str(nested(r, "vaccineCode", "text")) ||
    str(nested(r, "code", "text")) ||
    str(nested(r, "vaccineCode", "coding", "0", "display")) ||
    "";
  const date = formatDate(r.occurrenceDateTime ?? r.date);
  const dose = str(nested(r, "doseQuantity", "value"));
  const route = str(nested(r, "route", "text")) || str(nested(r, "route", "coding", "0", "display"));
  const site = str(nested(r, "site", "text")) || str(nested(r, "site", "coding", "0", "display"));
  const manufacturer = str(nested(r, "manufacturer", "display"));
  const lotNumber = str(r.lotNumber);
  const status = str(r.status);

  return (
    <div className="space-y-2">
      {name && (
        <p
          className="text-sm font-semibold"
          style={{ color: "var(--theme-text)", fontFamily: "var(--font-body)" }}
        >
          {name}
        </p>
      )}
      <DetailRow label="Date" value={date} />
      <BarRow
        items={[
          { label: "Dose", value: dose },
          { label: "Route", value: route },
          { label: "Site", value: site },
        ]}
      />
      <DetailRow label="Manufacturer" value={manufacturer} />
      <DetailRow label="Lot #" value={lotNumber} mono />
      {status && (
        <div className="pt-1">
          <StatusBadge label={status} />
        </div>
      )}
    </div>
  );
}

function AllergyRenderer({ r }: { r: Record<string, unknown> }) {
  const allergen =
    str(nested(r, "code", "text")) ||
    str(nested(r, "code", "coding", "0", "display")) ||
    "";
  const reaction = str(nested(r, "reaction", "0", "manifestation", "0", "text")) ||
    str(nested(r, "reaction", "0", "manifestation", "0", "coding", "0", "display"));
  const severity =
    str(nested(r, "reaction", "0", "severity")) ||
    str(r.criticality) ||
    "";
  const status =
    str(nested(r, "clinicalStatus", "coding", "0", "code")) ||
    str(nested(r, "clinicalStatus", "text")) ||
    "";
  const date = formatDate(r.onsetDateTime ?? r.recordedDate);

  const severityLower = severity.toLowerCase();
  let severityColor = "var(--theme-sage)";
  if (severityLower === "high" || severityLower === "severe") {
    severityColor = "var(--theme-terracotta)";
  } else if (severityLower === "moderate") {
    severityColor = "var(--theme-ochre)";
  } else if (severityLower === "low" || severityLower === "mild") {
    severityColor = "var(--theme-sage)";
  }

  return (
    <div className="space-y-2">
      {allergen && (
        <p
          className="text-sm font-semibold"
          style={{ color: "var(--theme-terracotta)", fontFamily: "var(--font-body)" }}
        >
          {allergen}
        </p>
      )}
      <DetailRow label="Reaction" value={reaction} />
      {severity && (
        <div>
          <span
            className="inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-md"
            style={{
              backgroundColor: severityColor,
              color: severityLower === "low" || severityLower === "mild" ? "#0d0b08" : "var(--theme-text)",
            }}
          >
            {severity}
          </span>
        </div>
      )}
      <DetailRow label="Status" value={status} />
      <DetailRow label="Date" value={date} />
    </div>
  );
}

function ProcedureRenderer({ r }: { r: Record<string, unknown> }) {
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
    <div className="space-y-2">
      {name && (
        <p
          className="text-sm font-semibold"
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
      {codeValue && (
        <DetailRow label="Code" value={`${codeValue}${codeSystem ? ` (${codeSystem})` : ""}`} mono />
      )}
    </div>
  );
}

function ServiceRequestRenderer({ r }: { r: Record<string, unknown> }) {
  const reason =
    str(nested(r, "reasonCode", "0", "text")) ||
    str(nested(r, "reasonCode", "0", "coding", "0", "display")) ||
    str(nested(r, "code", "text")) ||
    str(nested(r, "code", "coding", "0", "display")) ||
    "";
  const referringProvider = str(nested(r, "requester", "display"));
  const referralProvider =
    str(nested(r, "performer", "0", "display")) ||
    str(nested(r, "performer", "display")) ||
    "";
  const status = str(r.status);
  const authoredOn = formatDate(r.authoredOn);
  const periodStart = formatDate(nested(r, "occurrencePeriod", "start"));
  const periodEnd = formatDate(nested(r, "occurrencePeriod", "end"));

  return (
    <div className="space-y-2">
      {reason && (
        <p
          className="text-sm font-semibold"
          style={{ color: "var(--theme-text)", fontFamily: "var(--font-body)" }}
        >
          {reason}
        </p>
      )}
      <DetailRow label="Referring Provider" value={referringProvider} />
      <DetailRow label="Referral Provider" value={referralProvider} />
      {status && (
        <div className="pt-1">
          <StatusBadge label={status} />
        </div>
      )}
      <DetailRow label="Authored" value={authoredOn} />
      {(periodStart || periodEnd) && (
        <DetailRow
          label="Period"
          value={`${periodStart || "?"}${periodEnd ? ` - ${periodEnd}` : ""}`}
        />
      )}
    </div>
  );
}

function GenericRenderer({ r }: { r: Record<string, unknown> }) {
  const keys = Object.keys(r).filter(
    (k) => !k.startsWith("_") && k !== "resourceType" && k !== "id" && k !== "meta"
  );

  return (
    <div className="space-y-1">
      {keys.map((key) => {
        const val = r[key];
        let display: string;
        if (val === null || val === undefined) return null;
        if (typeof val === "string" || typeof val === "number" || typeof val === "boolean") {
          display = String(val);
        } else {
          try {
            display = JSON.stringify(val);
            if (display.length > 120) display = display.slice(0, 117) + "...";
          } catch {
            display = "[complex]";
          }
        }
        return <DetailRow key={key} label={key} value={display} mono />;
      })}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Observation category detection
// ---------------------------------------------------------------------------

function getObservationCategory(r: Record<string, unknown>): string {
  const categories = arr(r.category);
  for (const cat of categories) {
    const codings = arr(obj(cat).coding);
    for (const coding of codings) {
      const code = str(obj(coding).code).toLowerCase();
      if (code === "vital-signs") return "vital-signs";
      if (code === "laboratory") return "laboratory";
    }
    const text = str(obj(cat).text).toLowerCase();
    if (text.includes("vital")) return "vital-signs";
    if (text.includes("lab")) return "laboratory";
  }
  return "laboratory";
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export function FhirResourceRenderer({
  recordType,
  fhirResource,
}: FhirResourceRendererProps) {
  const r = fhirResource;
  const type = recordType.toLowerCase();

  switch (type) {
    case "medication":
      return <MedicationRenderer r={r} />;

    case "condition":
      return <ConditionRenderer r={r} />;

    case "encounter":
      return <EncounterRenderer r={r} />;

    case "observation": {
      const category = getObservationCategory(r);
      if (category === "vital-signs") {
        return <ObservationVitalRenderer r={r} />;
      }
      return <ObservationLabRenderer r={r} />;
    }

    case "document":
      return <DocumentRenderer r={r} />;

    case "immunization":
      return <ImmunizationRenderer r={r} />;

    case "allergy":
      return <AllergyRenderer r={r} />;

    case "procedure":
      return <ProcedureRenderer r={r} />;

    case "service_request":
      return <ServiceRequestRenderer r={r} />;

    default:
      return <GenericRenderer r={r} />;
  }
}
