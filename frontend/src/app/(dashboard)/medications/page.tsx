"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function MedicationsPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/admin?tab=meds");
  }, [router]);
  return null;
}
