"use client";

import { useEffect, useRef } from "react";
import { useCookieConsent } from "@/components/legal/cookie-consent";
import { ADSENSE_CLIENT_ID } from "@/lib/adsense";

type AdSenseAdProps = {
  slot: string;
  format?: "auto" | "fluid" | "rectangle";
  className?: string;
};

declare global {
  interface Window {
    adsbygoogle?: Record<string, unknown>[];
  }
}

/**
 * Bloque de anuncio AdSense. Solo se activa tras consentimiento de cookies.
 * Usar cuando AdSense apruebe el sitio y asignes unidades de anuncio.
 */
export function AdSenseAd({ slot, format = "auto", className = "" }: AdSenseAdProps) {
  const { accepted, ready } = useCookieConsent();
  const pushed = useRef(false);

  useEffect(() => {
    if (!ready || !accepted || pushed.current) return;
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
      pushed.current = true;
    } catch {
      /* script aún no cargado */
    }
  }, [ready, accepted]);

  if (!ready || !accepted) return null;

  return (
    <ins
      className={`adsbygoogle block ${className}`}
      style={{ display: "block" }}
      data-ad-client={ADSENSE_CLIENT_ID}
      data-ad-slot={slot}
      data-ad-format={format}
      data-full-width-responsive="true"
    />
  );
}
