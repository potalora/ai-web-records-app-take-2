"use client";

import { useEffect, useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { api } from "@/lib/api";
import type { HealthRecord } from "@/types/api";
import { RetroBadge } from "./RetroBadge";
import { RetroLoadingState } from "./RetroLoadingState";

interface RecordDetailSheetProps {
  recordId: string | null;
  open: boolean;
  onClose: () => void;
}

export function RecordDetailSheet({ recordId, open, onClose }: RecordDetailSheetProps) {
  const [record, setRecord] = useState<HealthRecord | null>(null);
  const [loading, setLoading] = useState(false);
  const [showFhir, setShowFhir] = useState(false);

  useEffect(() => {
    if (!recordId || !open) {
      setRecord(null);
      setShowFhir(false);
      return;
    }

    setLoading(true);
    api
      .get<HealthRecord>(`/records/${recordId}`)
      .then(setRecord)
      .catch(() => setRecord(null))
      .finally(() => setLoading(false));
  }, [recordId, open]);

  return (
    <Sheet open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <SheetContent
        className="w-full sm:max-w-lg overflow-auto border-l"
        style={{
          backgroundColor: "var(--retro-bg-surface)",
          borderColor: "var(--retro-border)",
        }}
      >
        <SheetHeader>
          <SheetTitle
            className="text-xs uppercase tracking-widest"
            style={{
              color: "var(--retro-amber)",
              fontFamily: "var(--font-display)",
            }}
          >
            DATA READOUT
          </SheetTitle>
        </SheetHeader>

        {loading ? (
          <RetroLoadingState text="LOADING RECORD" />
        ) : !record ? (
          <div className="py-8 text-center">
            <span
              className="text-xs tracking-wider"
              style={{ color: "var(--retro-text-muted)" }}
            >
              RECORD NOT FOUND
            </span>
          </div>
        ) : (
          <div className="space-y-4 mt-4">
            <div className="flex items-center gap-2">
              <RetroBadge recordType={record.record_type} />
              {record.status && (
                <span
                  className="text-xs uppercase tracking-wider"
                  style={{ color: "var(--retro-text-dim)" }}
                >
                  {record.status}
                </span>
              )}
            </div>

            <p
              className="text-sm font-medium"
              style={{ color: "var(--retro-text)" }}
            >
              {record.display_text}
            </p>

            <div
              className="border-t pt-3 space-y-2"
              style={{ borderColor: "var(--retro-border)" }}
            >
              <DetailRow label="TYPE" value={record.record_type} />
              <DetailRow label="FHIR" value={record.fhir_resource_type} />
              <DetailRow
                label="DATE"
                value={
                  record.effective_date
                    ? new Date(record.effective_date).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })
                    : "Not specified"
                }
              />
              <DetailRow label="SOURCE" value={record.source_format} />
              {record.code_system && (
                <DetailRow label="CODE SYSTEM" value={record.code_system} mono />
              )}
              {record.code_value && (
                <DetailRow label="CODE" value={record.code_value} mono />
              )}
              {record.code_display && (
                <DetailRow label="CODE DISPLAY" value={record.code_display} />
              )}
              {record.category && record.category.length > 0 && (
                <DetailRow label="CATEGORIES" value={record.category.join(", ")} />
              )}
              <DetailRow
                label="CREATED"
                value={new Date(record.created_at).toLocaleString()}
              />
            </div>

            {/* FHIR JSON toggle */}
            <div
              className="border-t pt-3"
              style={{ borderColor: "var(--retro-border)" }}
            >
              <button
                onClick={() => setShowFhir(!showFhir)}
                className="text-xs uppercase tracking-wider cursor-pointer transition-colors"
                style={{ color: "var(--retro-amber-dim)" }}
                onMouseEnter={(e) => (e.currentTarget.style.color = "var(--retro-amber)")}
                onMouseLeave={(e) => (e.currentTarget.style.color = "var(--retro-amber-dim)")}
              >
                {showFhir ? "[-] HIDE" : "[+] SHOW"} RAW FHIR
              </button>
              {showFhir && (
                <pre
                  className="mt-2 p-3 text-xs overflow-auto max-h-80"
                  style={{
                    backgroundColor: "var(--retro-bg-deep)",
                    color: "var(--retro-text-dim)",
                    borderRadius: "4px",
                    border: "1px solid var(--retro-border)",
                  }}
                >
                  {JSON.stringify(record.fhir_resource, null, 2)}
                </pre>
              )}
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}

function DetailRow({
  label,
  value,
  mono,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="flex items-baseline justify-between gap-3 py-1">
      <span
        className="text-xs uppercase tracking-wider shrink-0"
        style={{ color: "var(--retro-text-muted)" }}
      >
        {label}
      </span>
      <span
        className={`text-xs text-right truncate ${mono ? "font-mono" : ""}`}
        style={{ color: "var(--retro-text)" }}
      >
        {value}
      </span>
    </div>
  );
}
