"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function ImmunizationsPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/admin?tab=immun");
  }, [router]);
  return null;
}
