"use client";

import { useEffect, useState } from "react";
import { Trash2 } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { api } from "@/lib/api";
import type { HealthRecord } from "@/types/api";
import { usePreferencesStore } from "@/stores/usePreferencesStore";
import { RECORD_TYPE_ICONS, getObservationIcon } from "@/lib/record-icons";
import { RECORD_TYPE_COLORS, DEFAULT_RECORD_COLOR, RECORD_TYPE_LABELS } from "@/lib/constants";
import { RetroBadge } from "./RetroBadge";
import { RetroLoadingState } from "./RetroLoadingState";
import { FhirResourceRenderer } from "./FhirResourceRenderer";
import { ConfirmDialog } from "./ConfirmDialog";
import { AIExtractionBadge, AdvancedSection } from "./renderers/shared";

interface RecordDetailSheetProps {
  recordId: string | null;
  open: boolean;
  onClose: () => void;
  onDelete?: () => void;
}

export function RecordDetailSheet({ recordId, open, onClose, onDelete }: RecordDetailSheetProps) {
  const [record, setRecord] = useState<HealthRecord | null>(null);
  const [loading, setLoading] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [dontAskChecked, setDontAskChecked] = useState(false);

  const { skipDeleteConfirm, setSkipDeleteConfirm } = usePreferencesStore();

  useEffect(() => {
    if (!recordId || !open) {
      setRecord(null);
      return;
    }

    setLoading(true);
    api
      .get<HealthRecord>(`/records/${recordId}`)
      .then(setRecord)
      .catch(() => setRecord(null))
      .finally(() => setLoading(false));
  }, [recordId, open]);

  function handleDeleteClick() {
    if (skipDeleteConfirm) {
      performDelete();
    } else {
      setDontAskChecked(false);
      setConfirmOpen(true);
    }
  }

  function performDelete() {
    if (!record) return;
    setDeleting(true);
    api
      .delete(`/records/${record.id}`)
      .then(() => {
        if (dontAskChecked) {
          setSkipDeleteConfirm(true);
        }
        setConfirmOpen(false);
        onDelete?.();
        onClose();
      })
      .catch(() => {
        setDeleting(false);
      });
  }

  // Resolve icon and colors for header
  const type = record?.record_type?.toLowerCase() ?? "";
  const IconComponent = type === "observation" && record
    ? getObservationIcon(record.fhir_resource)
    : RECORD_TYPE_ICONS[type];
  const colors = RECORD_TYPE_COLORS[type] ?? DEFAULT_RECORD_COLOR;
  const typeLabel = RECORD_TYPE_LABELS[type] ?? type;

  return (
    <>
      <Sheet open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
        <SheetContent
          className="w-full sm:max-w-xl overflow-auto border-l"
          style={{
            backgroundColor: "var(--theme-bg-surface)",
            borderColor: "var(--theme-border)",
          }}
        >
          <SheetHeader>
            <SheetTitle
              className="text-[11px] font-medium uppercase tracking-widest"
              style={{
                color: "var(--theme-amber)",
                fontFamily: "var(--font-body)",
              }}
            >
              Record Details
            </SheetTitle>
          </SheetHeader>

          {loading ? (
            <RetroLoadingState text="Loading record" />
          ) : !record ? (
            <div className="py-8 text-center">
              <span
                className="text-sm"
                style={{ color: "var(--theme-text-muted)" }}
              >
                Record not found
              </span>
            </div>
          ) : (
            <div className="space-y-5 mt-4 px-4">
              {/* 1. Header: icon + title + badge + status */}
              <div className="flex items-start gap-3">
                {IconComponent && (
                  <div
                    className="flex items-center justify-center w-10 h-10 rounded-md shrink-0 mt-0.5"
                    style={{ backgroundColor: colors.bg, color: colors.text }}
                  >
                    <IconComponent size={20} />
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <p
                    className="text-base font-bold leading-snug"
                    style={{ color: "var(--theme-text)" }}
                  >
                    {record.display_text}
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    <RetroBadge recordType={record.record_type} />
                    {record.status && (
                      <span
                        className="text-xs"
                        style={{ color: "var(--theme-text-dim)" }}
                      >
                        {record.status}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* 2. Primary content: rich type-specific renderer */}
              <div
                className="pt-4"
              >
                <FhirResourceRenderer
                  recordType={record.record_type}
                  fhirResource={record.fhir_resource}
                />
              </div>

              {/* 3. AI extraction info (conditional) */}
              {record.ai_extracted && (
                <div
                  className="border-t pt-4"
                  style={{ borderColor: "var(--theme-border)" }}
                >
                  <AIExtractionBadge
                    aiExtracted={record.ai_extracted}
                    confidenceScore={record.confidence_score}
                  />
                </div>
              )}

              {/* 4. Compact metadata */}
              <div
                className="border-t pt-4 space-y-1"
                style={{ borderColor: "var(--theme-border)" }}
              >
                <p
                  className="text-[11px] uppercase tracking-widest font-medium pb-1"
                  style={{ color: "var(--theme-text-muted)" }}
                >
                  Metadata
                </p>
                <CompactRow
                  label="Date"
                  value={
                    record.effective_date
                      ? new Date(record.effective_date).toLocaleDateString("en-US", {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })
                      : "Not specified"
                  }
                />
                <CompactRow label="Source" value={record.source_format} />
                {record.code_value && (
                  <CompactRow label="Code" value={`${record.code_value}${record.code_system ? ` (${record.code_system})` : ""}`} mono />
                )}
                {record.category && record.category.length > 0 && (
                  <CompactRow label="Categories" value={record.category.join(", ")} />
                )}
                <CompactRow
                  label="Created"
                  value={new Date(record.created_at).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                  })}
                />
              </div>

              {/* 5. Advanced section: collapsible FHIR JSON */}
              <div
                className="border-t pt-5"
                style={{ borderColor: "var(--theme-border)" }}
              >
                <AdvancedSection fhirResource={record.fhir_resource} />
              </div>

              {/* 6. Delete button */}
              <div
                className="border-t pt-5 flex justify-end"
                style={{ borderColor: "var(--theme-border)" }}
              >
                <button
                  onClick={handleDeleteClick}
                  disabled={deleting}
                  className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-md cursor-pointer transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{
                    color: "var(--theme-text-dim)",
                    fontFamily: "var(--font-body)",
                  }}
                  onMouseEnter={(e) => {
                    if (!deleting) e.currentTarget.style.color = "var(--theme-terracotta)";
                  }}
                  onMouseLeave={(e) => {
                    if (!deleting) e.currentTarget.style.color = "var(--theme-text-dim)";
                  }}
                >
                  <Trash2 size={12} />
                  {deleting ? "Deleting..." : "Delete"}
                </button>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>

      {record && (
        <ConfirmDialog
          open={confirmOpen}
          title="Delete record?"
          description={record.display_text}
          confirmLabel="Delete"
          cancelLabel="Cancel"
          variant="destructive"
          onConfirm={performDelete}
          onCancel={() => setConfirmOpen(false)}
          showDontAskAgain
          dontAskAgainChecked={dontAskChecked}
          onDontAskAgainChange={setDontAskChecked}
        />
      )}
    </>
  );
}

function CompactRow({
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
        className="text-[11px] font-medium shrink-0"
        style={{ color: "var(--theme-text-muted)" }}
      >
        {label}
      </span>
      <span
        className={`text-xs text-right max-w-[65%] break-all ${mono ? "font-mono" : ""}`}
        style={{ color: "var(--theme-text-dim)" }}
      >
        {value}
      </span>
    </div>
  );
}
