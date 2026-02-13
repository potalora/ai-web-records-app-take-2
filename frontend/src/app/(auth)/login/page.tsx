"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { api } from "@/lib/api";
import { useAuthStore } from "@/stores/useAuthStore";
import type { TokenResponse } from "@/types/api";
import { CRTOverlay } from "@/components/retro/CRTOverlay";
import { GlowText } from "@/components/retro/GlowText";
import { RetroInput } from "@/components/retro/RetroInput";
import { RetroButton } from "@/components/retro/RetroButton";

export default function LoginPage() {
  const router = useRouter();
  const { setTokens } = useAuthStore();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const data = await api.post<TokenResponse>("/auth/login", {
        email,
        password,
      });
      setTokens(data.access_token, data.refresh_token);
      router.push("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Authentication failed");
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
            ACCESS TERMINAL
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
            autoComplete="current-password"
          />
          <RetroButton
            type="submit"
            className="w-full"
            disabled={loading}
          >
            {loading ? "AUTHENTICATING..." : "AUTHENTICATE"}
          </RetroButton>
        </form>

        <p
          className="text-center text-xs"
          style={{ color: "var(--retro-text-muted)" }}
        >
          No account?{" "}
          <Link
            href="/register"
            className="underline transition-colors"
            style={{ color: "var(--retro-amber-dim)" }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "var(--retro-amber)")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "var(--retro-amber-dim)")}
          >
            Register
          </Link>
        </p>
      </div>
    </div>
  );
}
