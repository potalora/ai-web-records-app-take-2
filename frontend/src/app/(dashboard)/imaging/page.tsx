"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function ImagingPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/admin?tab=img");
  }, [router]);
  return null;
}
