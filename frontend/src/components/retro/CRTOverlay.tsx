"use client";

export function CRTOverlay() {
  return (
    <div
      className="pointer-events-none fixed inset-0 z-50"
      aria-hidden="true"
    >
      {/* Scanlines */}
      <div className="absolute inset-0 crt-scanlines" />
      {/* Vignette */}
      <div className="absolute inset-0 crt-vignette" />
    </div>
  );
}
