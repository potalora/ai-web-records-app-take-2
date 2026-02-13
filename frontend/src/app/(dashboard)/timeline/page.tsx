"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import type { TimelineResponse, TimelineEvent } from "@/types/api";
import { RECORD_TYPE_COLORS, RECORD_TYPE_SHORT, DEFAULT_RECORD_COLOR } from "@/lib/constants";
import { GlowText } from "@/components/retro/GlowText";
import { RetroBadge } from "@/components/retro/RetroBadge";
import { RetroLoadingState } from "@/components/retro/RetroLoadingState";
import { RecordDetailSheet } from "@/components/retro/RecordDetailSheet";

const FILTER_TYPES = [
  { value: "", label: "ALL" },
  { value: "condition", label: "COND" },
  { value: "observation", label: "OBS" },
  { value: "medication", label: "MED" },
  { value: "encounter", label: "ENC" },
  { value: "immunization", label: "IMMUN" },
  { value: "procedure", label: "PROC" },
  { value: "document", label: "DOC" },
  { value: "imaging", label: "IMG" },
  { value: "allergy", label: "ALRG" },
];

function groupByMonth(events: TimelineEvent[]): { label: string; events: TimelineEvent[] }[] {
  const groups: Map<string, TimelineEvent[]> = new Map();
  for (const event of events) {
    const key = event.effective_date
      ? (() => {
          const d = new Date(event.effective_date);
          return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
        })()
      : "undated";
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(event);
  }
  const sorted = Array.from(groups.entries()).sort((a, b) => {
    if (a[0] === "undated") return 1;
    if (b[0] === "undated") return -1;
    return b[0].localeCompare(a[0]);
  });
  return sorted.map(([key, events]) => {
    if (key === "undated") return { label: "UNDATED", events };
    const [y, m] = key.split("-");
    const months = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
    return { label: `${months[parseInt(m) - 1]} ${y}`, events };
  });
}

export default function TimelinePage() {
  const [data, setData] = useState<TimelineResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("");
  const [selectedRecord, setSelectedRecord] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    let endpoint = "/timeline?limit=200";
    if (filter) endpoint += `&record_type=${filter}`;

    api
      .get<TimelineResponse>(endpoint)
      .then(setData)
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, [filter]);

  const events: TimelineEvent[] = data?.events || [];
  const sortedEvents = [...events].sort((a, b) => {
    if (!a.effective_date && !b.effective_date) return 0;
    if (!a.effective_date) return 1;
    if (!b.effective_date) return -1;
    return new Date(b.effective_date).getTime() - new Date(a.effective_date).getTime();
  });

  const groups = groupByMonth(sortedEvents);

  return (
    <div className="space-y-6">
      <div className="flex items-baseline justify-between gap-4">
        <GlowText as="h1">TIMELINE</GlowText>
        {data && (
          <span
            className="text-xs tracking-wider"
            style={{ color: "var(--retro-text-dim)" }}
          >
            {data.total} EVENTS
          </span>
        )}
      </div>

      {/* Filter bar */}
      <div className="flex flex-wrap gap-1">
        {FILTER_TYPES.map((ft) => {
          const active = filter === ft.value;
          return (
            <button
              key={ft.value}
              onClick={() => setFilter(ft.value)}
              className="px-3 py-1.5 text-xs font-medium uppercase tracking-wider transition-colors cursor-pointer"
              style={{
                backgroundColor: active ? "var(--retro-amber)" : "var(--retro-bg-card)",
                color: active ? "var(--retro-bg-deep)" : "var(--retro-text-dim)",
                borderRadius: "2px",
                border: `1px solid ${active ? "var(--retro-amber)" : "var(--retro-border)"}`,
                fontFamily: "var(--font-display)",
              }}
              onMouseEnter={(e) => {
                if (!active) {
                  e.currentTarget.style.borderColor = "var(--retro-border-active)";
                  e.currentTarget.style.color = "var(--retro-text)";
                }
              }}
              onMouseLeave={(e) => {
                if (!active) {
                  e.currentTarget.style.borderColor = "var(--retro-border)";
                  e.currentTarget.style.color = "var(--retro-text-dim)";
                }
              }}
            >
              {ft.label}
            </button>
          );
        })}
      </div>

      {loading ? (
        <RetroLoadingState text="LOADING TIMELINE" />
      ) : sortedEvents.length === 0 ? (
        <div className="py-16 text-center">
          <p
            className="text-sm tracking-wider"
            style={{
              color: "var(--retro-text-muted)",
              fontFamily: "var(--font-display)",
            }}
          >
            NO EVENTS IN DATABASE
          </p>
          {filter && (
            <button
              onClick={() => setFilter("")}
              className="mt-3 text-xs uppercase tracking-wider cursor-pointer"
              style={{ color: "var(--retro-amber-dim)" }}
            >
              CLEAR FILTER
            </button>
          )}
        </div>
      ) : (
        <div className="relative pl-6">
          {/* Vertical line */}
          <div
            className="absolute left-2 top-0 bottom-0 w-px"
            style={{ backgroundColor: "var(--retro-amber-dim)" }}
          />

          {groups.map((group) => (
            <div key={group.label} className="mb-6">
              {/* Month/Year divider */}
              <div className="relative flex items-center gap-3 mb-3 -ml-6">
                <div
                  className="w-5 h-px"
                  style={{ backgroundColor: "var(--retro-amber-dim)" }}
                />
                <span
                  className="text-xs font-semibold tracking-widest"
                  style={{
                    color: "var(--retro-amber)",
                    fontFamily: "var(--font-display)",
                  }}
                >
                  {group.label}
                </span>
                <div
                  className="flex-1 h-px"
                  style={{ backgroundColor: "var(--retro-border)" }}
                />
              </div>

              {/* Events */}
              <div className="space-y-2">
                {group.events.map((event) => {
                  const colors = RECORD_TYPE_COLORS[event.record_type] || DEFAULT_RECORD_COLOR;
                  return (
                    <div
                      key={event.id}
                      className="relative flex items-start gap-3 cursor-pointer transition-colors"
                      onClick={() => setSelectedRecord(event.id)}
                      style={{ paddingLeft: "0.5rem" }}
                      onMouseEnter={(e) => {
                        const card = e.currentTarget.querySelector("[data-card]") as HTMLElement;
                        if (card) card.style.borderColor = "var(--retro-border-active)";
                      }}
                      onMouseLeave={(e) => {
                        const card = e.currentTarget.querySelector("[data-card]") as HTMLElement;
                        if (card) card.style.borderColor = "var(--retro-border)";
                      }}
                    >
                      {/* Dot on timeline */}
                      <div
                        className="absolute -left-[1.15rem] top-3 h-2 w-2 shrink-0"
                        style={{
                          backgroundColor: colors.dot,
                          borderRadius: "1px",
                          boxShadow: `0 0 4px ${colors.dot}40`,
                        }}
                      />

                      {/* Event card */}
                      <div
                        data-card
                        className="flex-1 border px-3 py-2 transition-colors"
                        style={{
                          backgroundColor: "var(--retro-bg-card)",
                          borderColor: "var(--retro-border)",
                          borderRadius: "2px",
                        }}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="space-y-0.5 min-w-0">
                            <div className="flex items-center gap-2">
                              <RetroBadge recordType={event.record_type} short />
                              <span
                                className="text-sm truncate"
                                style={{ color: "var(--retro-text)" }}
                              >
                                {event.display_text}
                              </span>
                            </div>
                            {event.code_display && (
                              <p
                                className="text-xs"
                                style={{ color: "var(--retro-text-dim)" }}
                              >
                                {event.code_display}
                              </p>
                            )}
                          </div>
                          <span
                            className="text-xs whitespace-nowrap shrink-0"
                            style={{ color: "var(--retro-text-muted)" }}
                          >
                            {event.effective_date
                              ? new Date(event.effective_date).toLocaleDateString()
                              : ""}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      <RecordDetailSheet
        recordId={selectedRecord}
        open={!!selectedRecord}
        onClose={() => setSelectedRecord(null)}
      />
    </div>
  );
}
