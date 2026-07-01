"use client";

import { useEffect } from "react";
import { useCookieConsent } from "@/components/legal/cookie-consent";
import { initAnalytics } from "@/lib/firebase/analytics";

export function FirebaseAnalytics() {
  const { accepted, ready } = useCookieConsent();

  useEffect(() => {
    if (ready && accepted) {
      initAnalytics();
    }
  }, [ready, accepted]);

  return null;
}
