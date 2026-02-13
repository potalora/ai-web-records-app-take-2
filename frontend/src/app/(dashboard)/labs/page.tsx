"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function LabsPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/admin?tab=labs");
  }, [router]);
  return null;
}
