"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function ConditionsPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/admin?tab=cond");
  }, [router]);
  return null;
}
