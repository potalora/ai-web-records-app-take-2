"use client";

import React from "react";
import { DetailRow, StatusBadge, str, obj, arr, nested, formatDate } from "./shared";

export function DocumentRenderer({ r }: { r: Record<string, unknown> }) {
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

  // Content type from attachment
  const contentType = str(nested(r, "content", "0", "attachment", "contentType"));
  const contentLabel = contentType ? contentType.split("/").pop()?.toUpperCase() : "";

  return (
    <div className="space-y-3">
      {docType && (
        <p
          className="text-base font-semibold"
          style={{ color: "var(--theme-text)", fontFamily: "var(--font-body)" }}
        >
          {docType}
        </p>
      )}

      {/* Badge row */}
      <div className="flex items-center gap-2">
        {isScanned && <StatusBadge label="Scanned" color="var(--theme-sienna)" />}
        {contentLabel && (
          <span
            className="px-1.5 py-0.5 text-[10px] font-medium rounded"
            style={{
              backgroundColor: "var(--record-document-bg)",
              color: "var(--record-document-text)",
            }}
          >
            {contentLabel}
          </span>
        )}
      </div>

      {/* Description text area */}
      {description && (
        <div
          className="px-3 py-2 rounded-md text-xs"
          style={{
            backgroundColor: "var(--theme-bg-deep)",
            color: "var(--theme-text-dim)",
          }}
        >
          {description}
        </div>
      )}

      <DetailRow label="Author" value={author} />
      <DetailRow label="Date" value={date} />
    </div>
  );
}
