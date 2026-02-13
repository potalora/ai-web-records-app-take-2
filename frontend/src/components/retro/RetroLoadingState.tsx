"use client";

import { useEffect, useState } from "react";

interface RetroLoadingStateProps {
  text?: string;
}

export function RetroLoadingState({ text = "LOADING DATA" }: RetroLoadingStateProps) {
  const [dots, setDots] = useState("");

  useEffect(() => {
    const interval = setInterval(() => {
      setDots((prev) => (prev.length >= 3 ? "" : prev + "."));
    }, 400);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex items-center justify-center py-16">
      <span
        className="text-sm tracking-wider"
        style={{
          color: "var(--retro-text-dim)",
          fontFamily: "var(--font-display)",
        }}
      >
        {text}
        <span className="inline-block w-6 text-left">{dots}</span>
        <span
          className="ml-1 inline-block"
          style={{
            animation: "cursor-blink 1s step-end infinite",
            color: "var(--retro-amber)",
          }}
        >
          &#x2588;
        </span>
      </span>
    </div>
  );
}
