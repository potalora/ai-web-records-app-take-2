"use client";

import { AlertTriangle } from "lucide-react";

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
  variant?: "destructive" | "default";
  showDontAskAgain?: boolean;
  dontAskAgainChecked?: boolean;
  onDontAskAgainChange?: (checked: boolean) => void;
}

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  onConfirm,
  onCancel,
  variant = "default",
  showDontAskAgain = false,
  dontAskAgainChecked = false,
  onDontAskAgainChange,
}: ConfirmDialogProps) {
  if (!open) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 50,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "rgba(0,0,0,0.5)",
        backdropFilter: "blur(2px)",
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onCancel();
      }}
    >
      <div
        style={{
          maxWidth: "28rem",
          width: "100%",
          margin: "0 1rem",
          backgroundColor: "var(--theme-bg-surface)",
          border: "1px solid var(--theme-border)",
          borderRadius: "0.5rem",
          padding: "1.5rem",
          fontFamily: "var(--font-body)",
        }}
      >
        {/* Header */}
        <div style={{ display: "flex", alignItems: "flex-start", gap: "0.75rem" }}>
          {variant === "destructive" && (
            <div style={{ flexShrink: 0, paddingTop: "1px" }}>
              <AlertTriangle
                size={24}
                style={{ color: "var(--theme-terracotta)" }}
              />
            </div>
          )}
          <div style={{ flex: 1 }}>
            <h3
              style={{
                fontSize: "0.875rem",
                fontWeight: 600,
                color: "var(--theme-text)",
                margin: 0,
                fontFamily: "var(--font-body)",
              }}
            >
              {title}
            </h3>
            <p
              style={{
                fontSize: "0.75rem",
                color: "var(--theme-text-dim)",
                marginTop: "0.5rem",
                marginBottom: 0,
                lineHeight: 1.5,
                fontFamily: "var(--font-body)",
              }}
            >
              {description}
            </p>
          </div>
        </div>

        {/* Don't ask again checkbox */}
        {showDontAskAgain && (
          <label
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              marginTop: "1rem",
              cursor: "pointer",
              fontSize: "0.75rem",
              color: "var(--theme-text-dim)",
              fontFamily: "var(--font-body)",
            }}
          >
            <input
              type="checkbox"
              checked={dontAskAgainChecked}
              onChange={(e) => onDontAskAgainChange?.(e.target.checked)}
              style={{
                accentColor: "var(--theme-amber)",
                cursor: "pointer",
              }}
            />
            Don&apos;t ask again this session
          </label>
        )}

        {/* Actions */}
        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            gap: "0.5rem",
            marginTop: "1.25rem",
          }}
        >
          <button
            onClick={onCancel}
            style={{
              padding: "0.5rem 1rem",
              fontSize: "0.75rem",
              fontWeight: 500,
              fontFamily: "var(--font-body)",
              backgroundColor: "transparent",
              color: "var(--theme-amber)",
              border: "1px solid var(--theme-border)",
              borderRadius: "0.375rem",
              cursor: "pointer",
              transition: "all 200ms",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = "var(--theme-bg-card-hover)";
              e.currentTarget.style.borderColor = "var(--theme-border-active)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "transparent";
              e.currentTarget.style.borderColor = "var(--theme-border)";
            }}
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            style={{
              padding: "0.5rem 1rem",
              fontSize: "0.75rem",
              fontWeight: 500,
              fontFamily: "var(--font-body)",
              backgroundColor:
                variant === "destructive"
                  ? "var(--theme-terracotta)"
                  : "var(--theme-amber)",
              color: "#ffffff",
              border: "none",
              borderRadius: "0.375rem",
              cursor: "pointer",
              transition: "all 200ms",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.filter = "brightness(1.1)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.filter = "none";
            }}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
