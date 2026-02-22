"use client";

import React from "react";
import { DetailRow } from "./shared";

export function GenericRenderer({ r }: { r: Record<string, unknown> }) {
  const keys = Object.keys(r).filter(
    (k) => !k.startsWith("_") && k !== "resourceType" && k !== "id" && k !== "meta"
  );

  return (
    <div className="space-y-1">
      {keys.map((key) => {
        const val = r[key];
        let display: string;
        if (val === null || val === undefined) return null;
        if (typeof val === "string" || typeof val === "number" || typeof val === "boolean") {
          display = String(val);
        } else {
          try {
            display = JSON.stringify(val);
            if (display.length > 120) display = display.slice(0, 117) + "...";
          } catch {
            display = "[complex]";
          }
        }
        return <DetailRow key={key} label={key} value={display} mono />;
      })}
    </div>
  );
}
