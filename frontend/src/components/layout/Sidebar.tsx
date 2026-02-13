"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/", label: "Dashboard", icon: "grid" },
  { href: "/timeline", label: "Timeline", icon: "clock" },
  { href: "/records", label: "Records", icon: "file-text" },
  { href: "/labs", label: "Labs", icon: "activity" },
  { href: "/medications", label: "Medications", icon: "pill" },
  { href: "/conditions", label: "Conditions", icon: "heart" },
  { href: "/encounters", label: "Encounters", icon: "calendar" },
  { href: "/immunizations", label: "Immunizations", icon: "shield" },
  { href: "/imaging", label: "Imaging", icon: "image" },
  { href: "/upload", label: "Upload", icon: "upload" },
  { href: "/summaries", label: "Summaries", icon: "sparkles" },
  { href: "/dedup", label: "Duplicates", icon: "copy" },
  { href: "/settings", label: "Settings", icon: "settings" },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex h-full w-64 flex-col border-r bg-card">
      <div className="flex h-14 items-center border-b px-4">
        <Link href="/" className="flex items-center gap-2 font-semibold">
          <span className="text-lg">AI Web Records</span>
        </Link>
      </div>
      <nav className="flex-1 overflow-auto p-2">
        <ul className="space-y-1">
          {navItems.map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
                  pathname === item.href
                    ? "bg-primary/10 text-primary font-medium"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  );
}
