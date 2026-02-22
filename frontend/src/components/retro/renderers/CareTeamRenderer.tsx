"use client";

import React from "react";
import { StatusBadge, str, arr, obj, nested, formatDate } from "./shared";

export function CareTeamRenderer({ r }: { r: Record<string, unknown> }) {
  const name = str(r.name);
  const status = str(r.status);

  const members = arr(r.participant ?? r.member);
  const memberEntries: Array<{ name: string; role: string }> = [];
  for (const m of members) {
    const mObj = obj(m);
    const memberName = str(nested(mObj, "member", "display")) || str(nested(mObj, "actor", "display"));
    const role =
      str(nested(mObj, "role", "0", "text")) ||
      str(nested(mObj, "role", "0", "coding", "0", "display")) ||
      "";
    if (memberName) memberEntries.push({ name: memberName, role });
  }

  const periodStart = formatDate(nested(r, "period", "start"));

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

      <div className="flex items-center gap-2">
        {status && <StatusBadge label={status} />}
        {periodStart && (
          <span className="text-xs" style={{ color: "var(--theme-text-muted)" }}>
            Since {periodStart}
          </span>
        )}
      </div>

      {/* Members list */}
      {memberEntries.length > 0 && (
        <div
          className="rounded-md overflow-hidden"
          style={{ border: "1px solid var(--theme-border)" }}
        >
          {memberEntries.map((member, i) => (
            <div
              key={i}
              className="flex items-center justify-between px-3 py-2 text-xs"
              style={{
                borderBottom: i < memberEntries.length - 1 ? "1px solid var(--theme-border)" : "none",
              }}
            >
              <span style={{ color: "var(--theme-text)" }}>{member.name}</span>
              {member.role && (
                <span
                  className="text-[10px] px-1.5 py-0.5 rounded"
                  style={{
                    backgroundColor: "var(--record-care_team-bg)",
                    color: "var(--record-care_team-text)",
                  }}
                >
                  {member.role}
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
