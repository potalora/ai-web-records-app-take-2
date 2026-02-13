"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function RecordsPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/admin?tab=all");
  }, [router]);
  return null;
}
