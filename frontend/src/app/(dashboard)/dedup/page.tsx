"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function DedupPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/admin?tab=dedup");
  }, [router]);
  return null;
}
