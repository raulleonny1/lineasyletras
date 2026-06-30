"use client";

import { useEffect } from "react";
import { initAnalytics } from "@/lib/firebase/analytics";

export function FirebaseAnalytics() {
  useEffect(() => {
    initAnalytics();
  }, []);

  return null;
}
