"use client";

import React from "react";
import { CheckCircle2, Circle, XCircle } from "lucide-react";
import { StatusBadge, str, arr, obj, nested, formatDate } from "./shared";

const ACTIVITY_STATUS_ICONS: Record<string, React.ReactNode> = {
  completed: <CheckCircle2 size={12} style={{ color: "var(--theme-sage)" }} />,
  "in-progress": <Circle size={12} style={{ color: "var(--theme-ochre)" }} />,
  scheduled: <Circle size={12} style={{ color: "var(--theme-text-dim)" }} />,
  cancelled: <XCircle size={12} style={{ color: "var(--theme-terracotta)" }} />,
  "not-started": <Circle size={12} style={{ color: "var(--theme-text-muted)" }} />,
};

export function CarePlanRenderer({ r }: { r: Record<string, unknown> }) {
  const title = str(r.title) || str(nested(r, "code", "text")) || "";
  const description = str(r.description);
  const status = str(r.status);
  const created = formatDate(r.created);

  const activities = arr(r.activity);

  return (
    <div className="space-y-3">
      {title && (
        <p
          className="text-base font-semibold"
          style={{ color: "var(--theme-text)", fontFamily: "var(--font-body)" }}
        >
          {title}
        </p>
      )}

      {description && (
        <p className="text-xs" style={{ color: "var(--theme-text-dim)" }}>
          {description}
        </p>
      )}

      <div className="flex items-center gap-2">
        {status && <StatusBadge label={status} />}
        {created && (
          <span className="text-xs" style={{ color: "var(--theme-text-muted)" }}>
            Created {created}
          </span>
        )}
      </div>

      {/* Activity checklist */}
      {activities.length > 0 && (
        <div
          className="rounded-md overflow-hidden"
          style={{ border: "1px solid var(--theme-border)" }}
        >
          {activities.map((activity, i) => {
            const detail = obj(obj(activity).detail);
            const activityStatus = str(detail.status);
            const activityDesc = str(nested(detail, "code", "text")) ||
              str(nested(detail, "code", "coding", "0", "display")) ||
              str(detail.description) ||
              `Activity ${i + 1}`;
            const icon = ACTIVITY_STATUS_ICONS[activityStatus] ?? <Circle size={12} style={{ color: "var(--theme-text-muted)" }} />;

            return (
              <div
                key={i}
                className="flex items-center gap-2 px-3 py-2 text-xs"
                style={{
                  borderBottom: i < activities.length - 1 ? "1px solid var(--theme-border)" : "none",
                  backgroundColor: activityStatus === "completed" ? "var(--theme-bg-deep)" : "transparent",
                }}
              >
                {icon}
                <span
                  style={{
                    color: activityStatus === "completed" ? "var(--theme-text-muted)" : "var(--theme-text)",
                    textDecoration: activityStatus === "completed" ? "line-through" : "none",
                  }}
                >
                  {activityDesc}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
