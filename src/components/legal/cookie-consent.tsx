"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";

const STORAGE_KEY = "lyl_cookie_consent";

export type CookieConsentStatus = "pending" | "accepted" | "rejected";

type CookieConsentContextValue = {
  status: CookieConsentStatus;
  accepted: boolean;
  ready: boolean;
  accept: () => void;
  reject: () => void;
};

const CookieConsentContext = createContext<CookieConsentContextValue>({
  status: "pending",
  accepted: false,
  ready: false,
  accept: () => {},
  reject: () => {},
});

export function useCookieConsent() {
  return useContext(CookieConsentContext);
}

function readStoredConsent(): CookieConsentStatus {
  if (typeof window === "undefined") return "pending";
  const raw = localStorage.getItem(STORAGE_KEY);
  if (raw === "accepted" || raw === "1") return "accepted";
  if (raw === "rejected") return "rejected";
  return "pending";
}

function CookieBanner({
  onAccept,
  onReject,
}: {
  onAccept: () => void;
  onReject: () => void;
}) {
  return (
    <div
      role="dialog"
      aria-labelledby="cookie-banner-title"
      className="fixed bottom-0 inset-x-0 z-50 p-4 sm:p-5 pointer-events-none"
    >
      <div className="max-w-3xl mx-auto pointer-events-auto bg-white border border-slate-200 rounded-2xl shadow-xl shadow-slate-900/10 p-4 sm:p-5 space-y-4">
        <div className="space-y-1">
          <p id="cookie-banner-title" className="text-sm font-bold text-slate-900">
            Privacidad y cookies
          </p>
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
            Usamos cookies técnicas necesarias para el funcionamiento del sitio. Con tu
            consentimiento, también usamos cookies de análisis (Firebase) y publicidad (
            <strong>Google AdSense</strong>) para mejorar el servicio y mostrar anuncios
            relevantes. Puedes aceptar todas o continuar solo con las necesarias.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 sm:justify-end">
          <button
            type="button"
            onClick={onReject}
            className="w-full sm:w-auto border border-slate-200 text-slate-700 font-semibold text-sm px-5 py-2.5 rounded-xl hover:bg-slate-50 transition-colors"
          >
            Solo necesarias
          </button>
          <button
            type="button"
            onClick={onAccept}
            className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm px-5 py-2.5 rounded-xl transition-colors"
          >
            Aceptar todas
          </button>
        </div>
      </div>
    </div>
  );
}

export function CookieConsentProvider({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<CookieConsentStatus>("pending");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setStatus(readStoredConsent());
    setReady(true);
  }, []);

  const accept = useCallback(() => {
    localStorage.setItem(STORAGE_KEY, "accepted");
    setStatus("accepted");
  }, []);

  const reject = useCallback(() => {
    localStorage.setItem(STORAGE_KEY, "rejected");
    setStatus("rejected");
  }, []);

  return (
    <CookieConsentContext.Provider
      value={{
        status,
        accepted: status === "accepted",
        ready,
        accept,
        reject,
      }}
    >
      {children}
      {ready && status === "pending" && (
        <CookieBanner onAccept={accept} onReject={reject} />
      )}
    </CookieConsentContext.Provider>
  );
}
