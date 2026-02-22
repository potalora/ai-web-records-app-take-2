"use client";

import React from "react";
import { DetailRow, StatusBadge, str, arr, obj, nested, formatDate } from "./shared";

export function CommunicationRenderer({ r }: { r: Record<string, unknown> }) {
  const status = str(r.status);
  const sent = formatDate(r.sent);
  const received = formatDate(r.received);

  // Payload content
  const payloads = arr(r.payload);
  const payloadTexts: string[] = [];
  for (const p of payloads) {
    const text = str(obj(p).contentString);
    if (text) payloadTexts.push(text);
  }

  // Category badges
  const categories = arr(r.category);
  const categoryTexts: string[] = [];
  for (const cat of categories) {
    const text = str(obj(cat).text) || str(nested(obj(cat), "coding", "0", "display"));
    if (text) categoryTexts.push(text);
  }

  return (
    <div className="space-y-3">
      {/* Category badges */}
      {categoryTexts.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {categoryTexts.map((cat) => (
            <span
              key={cat}
              className="px-2 py-0.5 text-[11px] font-medium rounded"
              style={{
                backgroundColor: "var(--record-communication-bg)",
                color: "var(--record-communication-text)",
              }}
            >
              {cat}
            </span>
          ))}
        </div>
      )}

      {/* Message bubbles */}
      {payloadTexts.map((text, i) => (
        <div
          key={i}
          className="px-3 py-2 rounded-lg text-xs"
          style={{
            backgroundColor: "var(--theme-bg-deep)",
            color: "var(--theme-text)",
            borderLeft: "2px solid var(--record-communication-dot)",
          }}
        >
          {text}
        </div>
      ))}

      {payloadTexts.length === 0 && (
        <p className="text-xs" style={{ color: "var(--theme-text-muted)" }}>
          No message content
        </p>
      )}

      <div className="flex items-center gap-3">
        {status && <StatusBadge label={status} />}
      </div>

      <DetailRow label="Sent" value={sent} />
      <DetailRow label="Received" value={received} />
    </div>
  );
}
