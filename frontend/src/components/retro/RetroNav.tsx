"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { Sun, Moon } from "lucide-react";
import { useAuthStore } from "@/stores/useAuthStore";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { key: "F1", label: "HOME", href: "/" },
  { key: "F2", label: "TIMELINE", href: "/timeline" },
  { key: "F3", label: "SUMMARIZE", href: "/summaries" },
  { key: "F4", label: "ADMIN", href: "/admin" },
];

function isActive(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/";
  return pathname.startsWith(href);
}

export function RetroNav() {
  const pathname = usePathname();
  const router = useRouter();
  const { accessToken, clearTokens } = useAuthStore();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "F1") { e.preventDefault(); router.push("/"); }
      if (e.key === "F2") { e.preventDefault(); router.push("/timeline"); }
      if (e.key === "F3") { e.preventDefault(); router.push("/summaries"); }
      if (e.key === "F4") { e.preventDefault(); router.push("/admin"); }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [router]);

  const handleLogout = async () => {
    try {
      await api.post("/auth/logout", undefined, accessToken ?? undefined);
    } catch {
      // Logout even if server call fails
    }
    clearTokens();
    router.push("/login");
  };

  return (
    <nav
      className="flex h-14 items-center justify-between border-b px-4"
      style={{
        backgroundColor: "var(--retro-bg-surface)",
        borderColor: "var(--retro-border)",
      }}
    >
      {/* Logo */}
      <Link
        href="/"
        className="flex items-center gap-2 shrink-0"
        style={{ fontFamily: "var(--font-display)" }}
      >
        <span
          className="crt-glow text-sm font-semibold tracking-wider"
          style={{ color: "var(--retro-amber)" }}
        >
          MEDTIMELINE v1.0
        </span>
      </Link>

      {/* Nav tabs */}
      <div className="flex items-center gap-1">
        {NAV_ITEMS.map((item) => {
          const active = isActive(pathname, item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "relative px-3 py-2 text-xs font-medium tracking-wider transition-colors",
                active
                  ? "crt-glow"
                  : "hover:text-[var(--retro-text)]"
              )}
              style={{
                color: active ? "var(--retro-amber)" : "var(--retro-text-dim)",
                fontFamily: "var(--font-display)",
              }}
            >
              <span className="hidden sm:inline">[{item.key}]</span>
              <span className="sm:hidden">{item.label.charAt(0)}</span>
              <span className="hidden sm:inline ml-1">{item.label}</span>
              {/* Active underline */}
              {active && (
                <span
                  className="absolute bottom-0 left-2 right-2 h-px retro-underline-glow"
                  style={{
                    backgroundColor: "var(--retro-amber)",
                  }}
                />
              )}
            </Link>
          );
        })}
      </div>

      {/* User area */}
      <div className="flex items-center gap-3 shrink-0">
        {/* Theme toggle */}
        {mounted && (
          <button
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="p-1.5 transition-colors cursor-pointer"
            style={{ color: "var(--retro-text-dim)" }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "var(--retro-amber)")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "var(--retro-text-dim)")}
            aria-label="Toggle theme"
          >
            {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
          </button>
        )}
        <button
          onClick={handleLogout}
          className="text-xs tracking-wider transition-colors cursor-pointer"
          style={{
            color: "var(--retro-text-dim)",
            fontFamily: "var(--font-display)",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = "var(--retro-terracotta)")}
          onMouseLeave={(e) => (e.currentTarget.style.color = "var(--retro-text-dim)")}
        >
          SIGN OUT
        </button>
      </div>
    </nav>
  );
}
