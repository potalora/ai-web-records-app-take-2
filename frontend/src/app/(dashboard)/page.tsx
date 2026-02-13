"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import type { DashboardOverview } from "@/types/api";
import { RECORD_TYPE_COLORS, RECORD_TYPE_LABELS, DEFAULT_RECORD_COLOR } from "@/lib/constants";
import { GlowText } from "@/components/retro/GlowText";
import { RetroCard, RetroCardHeader, RetroCardContent } from "@/components/retro/RetroCard";
import { StatusReadout } from "@/components/retro/StatusReadout";
import { RetroButton } from "@/components/retro/RetroButton";
import { RetroLoadingState } from "@/components/retro/RetroLoadingState";
import { TerminalLog } from "@/components/retro/TerminalLog";
import { RecordDetailSheet } from "@/components/retro/RecordDetailSheet";

export default function DashboardPage() {
  const [data, setData] = useState<DashboardOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedRecord, setSelectedRecord] = useState<string | null>(null);

  useEffect(() => {
    api
      .get<DashboardOverview>("/dashboard/overview")
      .then(setData)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <RetroLoadingState text="LOADING DASHBOARD" />;
  }

  const overview = data || {
    total_records: 0,
    total_patients: 0,
    total_uploads: 0,
    records_by_type: {},
    recent_records: [],
    date_range_start: null,
    date_range_end: null,
  };

  const dateRange =
    overview.date_range_start && overview.date_range_end
      ? `${new Date(overview.date_range_start).getFullYear()}\u2013${new Date(overview.date_range_end).getFullYear()}`
      : "N/A";

  const logEntries = overview.recent_records.map((r) => ({
    id: r.id,
    timestamp: r.effective_date || r.created_at,
    recordType: r.record_type,
    text: r.display_text,
  }));

  return (
    <div className="space-y-6 retro-stagger">
      <GlowText as="h1">SYSTEM STATUS</GlowText>

      <StatusReadout
        items={[
          { label: "RECORDS", value: overview.total_records },
          { label: "PATIENTS", value: overview.total_patients },
          { label: "UPLOADS", value: overview.total_uploads },
          { label: "RANGE", value: dateRange },
        ]}
      />

      {/* Records by Category */}
      {Object.keys(overview.records_by_type).length > 0 && (
        <RetroCard>
          <RetroCardHeader>
            <GlowText as="h3" glow={false}>RECORDS BY CATEGORY</GlowText>
          </RetroCardHeader>
          <RetroCardContent>
            <div className="flex flex-wrap gap-2">
              {Object.entries(overview.records_by_type)
                .sort(([, a], [, b]) => b - a)
                .map(([type, count]) => {
                  const colors = RECORD_TYPE_COLORS[type] || DEFAULT_RECORD_COLOR;
                  return (
                    <span
                      key={type}
                      className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-medium uppercase tracking-wider"
                      style={{
                        backgroundColor: colors.bg,
                        color: colors.text,
                        borderRadius: "2px",
                      }}
                    >
                      {RECORD_TYPE_LABELS[type] || type}: {count}
                    </span>
                  );
                })}
            </div>
          </RetroCardContent>
        </RetroCard>
      )}

      {/* Recent Records Feed */}
      <RetroCard>
        <RetroCardHeader>
          <GlowText as="h3" glow={false}>RECENT ACTIVITY LOG</GlowText>
        </RetroCardHeader>
        <RetroCardContent>
          {overview.recent_records.length === 0 ? (
            <div className="py-8 text-center">
              <p
                className="text-xs tracking-wider mb-3"
                style={{ color: "var(--retro-text-muted)" }}
              >
                NO RECORDS IN DATABASE
              </p>
              <Link href="/admin?tab=upload">
                <RetroButton variant="ghost">UPLOAD FIRST RECORDS</RetroButton>
              </Link>
            </div>
          ) : (
            <TerminalLog
              entries={logEntries}
              onClickEntry={(id) => setSelectedRecord(id)}
            />
          )}
        </RetroCardContent>
      </RetroCard>

      {/* CREATE SUMMARY CTA */}
      <div className="flex justify-center pt-2">
        <Link href="/summaries">
          <RetroButton variant="large">CREATE SUMMARY</RetroButton>
        </Link>
      </div>

      <RecordDetailSheet
        recordId={selectedRecord}
        open={!!selectedRecord}
        onClose={() => setSelectedRecord(null)}
      />
    </div>
  );
}
