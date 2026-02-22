"use client";

import React from "react";
import { ArrowRight } from "lucide-react";
import { DetailRow, StatusBadge, str, nested, formatDate } from "./shared";

export function ServiceRequestRenderer({ r }: { r: Record<string, unknown> }) {
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
    <div className="space-y-3">
      {reason && (
        <p
          className="text-base font-semibold"
          style={{ color: "var(--theme-text)", fontFamily: "var(--font-body)" }}
        >
          {reason}
        </p>
      )}

      {/* Visual referral flow */}
      {(referringProvider || referralProvider) && (
        <div
          className="flex items-center gap-2 px-3 py-2 rounded-md text-xs"
          style={{ backgroundColor: "var(--record-service_request-bg)" }}
        >
          {referringProvider && (
            <span style={{ color: "var(--theme-text)" }}>{referringProvider}</span>
          )}
          {referringProvider && referralProvider && (
            <ArrowRight size={14} style={{ color: "var(--record-service_request-text)" }} />
          )}
          {referralProvider && (
            <span className="font-semibold" style={{ color: "var(--theme-text)" }}>{referralProvider}</span>
          )}
        </div>
      )}

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
