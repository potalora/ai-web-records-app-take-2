"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { api } from "@/lib/api";
import type { HealthRecord } from "@/types/api";
import { RECORD_TYPE_ICONS, getObservationIcon } from "@/lib/record-icons";
import { RECORD_TYPE_COLORS, DEFAULT_RECORD_COLOR } from "@/lib/constants";
import { GlowText } from "@/components/retro/GlowText";
import { RetroBadge } from "@/components/retro/RetroBadge";
import { RetroCard, RetroCardContent } from "@/components/retro/RetroCard";
import { RetroLoadingState } from "@/components/retro/RetroLoadingState";
import { FhirResourceRenderer } from "@/components/retro/FhirResourceRenderer";
import { AIExtractionBadge, AdvancedSection } from "@/components/retro/renderers/shared";

export default function RecordDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const [record, setRecord] = useState<HealthRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    api
      .get<HealthRecord>(`/records/${id}`)
      .then(setRecord)
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load record"))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <RetroLoadingState text="Loading record" />;

  if (error || !record) {
    return (
      <div className="space-y-4">
        <Link
          href="/admin?tab=all"
          className="text-xs font-medium inline-flex items-center gap-1"
          style={{ color: "var(--theme-amber-dim)" }}
        >
          <ChevronLeft size={14} />
          Back to records
        </Link>
        <div className="py-12 text-center">
          <p className="text-xs" style={{ color: "var(--theme-text-muted)" }}>
            {error || "Record not found"}
          </p>
        </div>
      </div>
    );
  }

  const type = record.record_type.toLowerCase();
  const IconComponent = type === "observation"
    ? getObservationIcon(record.fhir_resource)
    : RECORD_TYPE_ICONS[type];
  const colors = RECORD_TYPE_COLORS[type] ?? DEFAULT_RECORD_COLOR;

  return (
    <div className="space-y-6 retro-stagger">
      {/* Breadcrumb */}
      <Link
        href="/admin?tab=all"
        className="text-xs font-medium inline-flex items-center gap-1"
        style={{ color: "var(--theme-amber-dim)" }}
      >
        <ChevronLeft size={14} />
        Back to records
      </Link>

      {/* Page header: icon + title + badge */}
      <div className="flex items-start gap-3">
        {IconComponent && (
          <div
            className="flex items-center justify-center w-10 h-10 rounded-md shrink-0 mt-1"
            style={{ backgroundColor: colors.bg, color: colors.text }}
          >
            <IconComponent size={20} />
          </div>
        )}
        <div className="min-w-0 flex-1">
          <GlowText as="h1">{record.display_text}</GlowText>
          <div className="flex items-center gap-2 mt-1">
            <RetroBadge recordType={record.record_type} />
            {record.status && (
              <span className="text-xs" style={{ color: "var(--theme-text-dim)" }}>
                {record.status}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Primary card: rich type-specific renderer */}
      <RetroCard accentTop>
        <RetroCardContent>
          <FhirResourceRenderer
            recordType={record.record_type}
            fhirResource={record.fhir_resource}
          />
        </RetroCardContent>
      </RetroCard>

      {/* AI metadata card (conditional) */}
      {record.ai_extracted && (
        <RetroCard>
          <RetroCardContent>
            <AIExtractionBadge
              aiExtracted={record.ai_extracted}
              confidenceScore={record.confidence_score}
            />
            <p className="text-xs mt-2" style={{ color: "var(--theme-text-muted)" }}>
              This record was extracted from an unstructured document using AI.
            </p>
          </RetroCardContent>
        </RetroCard>
      )}

      {/* Compact metadata card */}
      <RetroCard>
        <RetroCardContent>
          <dl className="space-y-1">
            <MetadataRow
              label="Effective date"
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
            <MetadataRow label="Source format" value={record.source_format} />
            <MetadataRow label="FHIR type" value={record.fhir_resource_type} />
            {record.code_value && (
              <MetadataRow
                label="Code"
                value={`${record.code_value}${record.code_system ? ` (${record.code_system})` : ""}`}
                mono
              />
            )}
            {record.code_display && (
              <MetadataRow label="Code display" value={record.code_display} />
            )}
            {record.category && record.category.length > 0 && (
              <MetadataRow label="Categories" value={record.category.join(", ")} />
            )}
            <MetadataRow
              label="Created"
              value={new Date(record.created_at).toLocaleDateString("en-US", {
                year: "numeric",
                month: "short",
                day: "numeric",
              })}
            />
          </dl>
        </RetroCardContent>
      </RetroCard>

      {/* Advanced section card for FHIR JSON */}
      <RetroCard>
        <RetroCardContent>
          <AdvancedSection fhirResource={record.fhir_resource} />
        </RetroCardContent>
      </RetroCard>
    </div>
  );
}

function MetadataRow({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div
      className="flex justify-between gap-4 py-1 border-b"
      style={{ borderColor: "var(--theme-border)" }}
    >
      <dt className="text-xs font-medium shrink-0" style={{ color: "var(--theme-text-muted)" }}>
        {label}
      </dt>
      <dd
        className={`text-xs break-words ${mono ? "font-mono" : ""}`}
        style={{ color: "var(--theme-text)" }}
      >
        {value}
      </dd>
    </div>
  );
}
