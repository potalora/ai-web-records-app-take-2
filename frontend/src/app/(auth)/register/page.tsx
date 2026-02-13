"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { api } from "@/lib/api";
import type { UserResponse } from "@/types/api";
import { CRTOverlay } from "@/components/retro/CRTOverlay";
import { GlowText } from "@/components/retro/GlowText";
import { RetroInput } from "@/components/retro/RetroInput";
import { RetroButton } from "@/components/retro/RetroButton";

export default function RegisterPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await api.post<UserResponse>("/auth/register", {
        email,
        password,
        display_name: displayName || undefined,
      });
      router.push("/login");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="flex min-h-screen items-center justify-center"
      style={{ backgroundColor: "var(--retro-bg-deep)" }}
    >
      <CRTOverlay />
      <div
        className="w-full max-w-sm border p-8 space-y-6"
        style={{
          backgroundColor: "var(--retro-bg-card)",
          borderColor: "var(--retro-border)",
          borderRadius: "2px",
        }}
      >
        {/* Header */}
        <div className="text-center space-y-2">
          <GlowText as="h1" className="text-xl">
            MEDTIMELINE
          </GlowText>
          <p
            className="text-xs tracking-widest uppercase"
            style={{
              color: "var(--retro-text-dim)",
              fontFamily: "var(--font-display)",
            }}
          >
            CREATE NEW ACCESS CREDENTIALS
          </p>
          <div
            className="mx-auto w-32 h-px"
            style={{ backgroundColor: "var(--retro-amber-dim)" }}
          />
        </div>

        {/* Error */}
        {error && (
          <div
            className="p-3 border text-xs"
            style={{
              backgroundColor: "#301414",
              borderColor: "var(--retro-terracotta)",
              color: "var(--retro-terracotta)",
              borderRadius: "2px",
            }}
          >
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <RetroInput
            id="displayName"
            label="DISPLAY NAME"
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            autoComplete="name"
          />
          <RetroInput
            id="email"
            label="EMAIL"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
          />
          <RetroInput
            id="password"
            label="PASSWORD"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={8}
            autoComplete="new-password"
          />
          <RetroButton
            type="submit"
            className="w-full"
            disabled={loading}
          >
            {loading ? "CREATING ACCOUNT..." : "CREATE ACCOUNT"}
          </RetroButton>
        </form>

        <p
          className="text-center text-xs"
          style={{ color: "var(--retro-text-muted)" }}
        >
          Already have an account?{" "}
          <Link
            href="/login"
            className="underline transition-colors"
            style={{ color: "var(--retro-amber-dim)" }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "var(--retro-amber)")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "var(--retro-amber-dim)")}
          >
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
