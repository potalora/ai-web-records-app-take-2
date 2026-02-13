"use client";

import { GlowText } from "@/components/retro/GlowText";
import { RetroCard, RetroCardContent } from "@/components/retro/RetroCard";

export default function SummariesPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-8">
      {/* Terminal frame */}
      <div
        className="w-full max-w-2xl border p-8 text-center space-y-6"
        style={{
          backgroundColor: "var(--retro-bg-card)",
          borderColor: "var(--retro-border)",
          borderRadius: "2px",
        }}
      >
        {/* Top border decoration */}
        <div className="flex items-center gap-2 justify-center">
          <div
            className="flex-1 h-px"
            style={{ backgroundColor: "var(--retro-border-active)" }}
          />
          <span
            className="text-xs tracking-widest"
            style={{
              color: "var(--retro-amber-dim)",
              fontFamily: "var(--font-display)",
            }}
          >
            MODULE STATUS
          </span>
          <div
            className="flex-1 h-px"
            style={{ backgroundColor: "var(--retro-border-active)" }}
          />
        </div>

        <div className="space-y-4">
          <GlowText as="h1" className="crt-glow-strong text-3xl">
            SUMMARIZE MODULE
          </GlowText>

          <p
            className="text-sm tracking-wider"
            style={{
              color: "var(--retro-ochre)",
              fontFamily: "var(--font-display)",
            }}
          >
            STATUS: STANDBY — AWAITING INTEGRATION
          </p>

          {/* Blinking cursor */}
          <div className="flex justify-center">
            <span className="blink-cursor text-sm" />
          </div>
        </div>

        <div
          className="pt-4 border-t space-y-3"
          style={{ borderColor: "var(--retro-border)" }}
        >
          <p
            className="text-xs leading-relaxed"
            style={{ color: "var(--retro-text-dim)" }}
          >
            This module will construct de-identified prompts from your health
            records, formatted for Gemini 3 Flash. No external API calls are
            made by this application — you review the prompt and execute it
            yourself.
          </p>
          <p
            className="text-xs leading-relaxed"
            style={{ color: "var(--retro-text-dim)" }}
          >
            Summary types: Full health summary, Category-focused,
            Date range, Single record.
          </p>
        </div>

        {/* Bottom decoration */}
        <div className="flex items-center gap-2 justify-center">
          <div
            className="flex-1 h-px"
            style={{ backgroundColor: "var(--retro-border-active)" }}
          />
          <span
            className="text-xs tracking-wider"
            style={{ color: "var(--retro-text-muted)" }}
          >
            END TRANSMISSION
          </span>
          <div
            className="flex-1 h-px"
            style={{ backgroundColor: "var(--retro-border-active)" }}
          />
        </div>
      </div>

      {/* AI Disclaimer */}
      <RetroCard className="w-full max-w-2xl">
        <RetroCardContent>
          <div className="flex items-start gap-3">
            <span
              className="text-xs font-bold shrink-0 px-2 py-0.5"
              style={{
                backgroundColor: "var(--retro-terracotta)",
                color: "var(--retro-text)",
                borderRadius: "2px",
                fontFamily: "var(--font-display)",
              }}
            >
              WARNING
            </span>
            <p
              className="text-xs leading-relaxed"
              style={{ color: "var(--retro-text-dim)" }}
            >
              AI summaries are for personal reference only and do not constitute
              medical advice, diagnoses, or treatment recommendations. This
              application does not make any external API calls. All health data
              in prompts is de-identified before display.
            </p>
          </div>
        </RetroCardContent>
      </RetroCard>
    </div>
  );
}
