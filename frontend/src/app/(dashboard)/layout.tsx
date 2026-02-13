"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { RetroNav } from "@/components/retro/RetroNav";
import { CRTOverlay } from "@/components/retro/CRTOverlay";
import { useAuthStore, useHasHydrated } from "@/stores/useAuthStore";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();
  const hydrated = useHasHydrated();

  useEffect(() => {
    if (hydrated && !isAuthenticated) {
      router.replace("/login");
    }
  }, [isAuthenticated, hydrated, router]);

  if (!hydrated || !isAuthenticated) {
    return null;
  }

  return (
    <div className="flex h-screen flex-col overflow-hidden">
      <RetroNav />
      {/* Terminal-style separator line */}
      <div
        className="h-px w-full"
        style={{ backgroundColor: "var(--retro-border-active)" }}
      />
      <main className="flex-1 overflow-auto p-6">{children}</main>
      <CRTOverlay />
    </div>
  );
}
