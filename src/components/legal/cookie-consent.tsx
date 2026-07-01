"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";

const STORAGE_KEY = "lyl_cookie_consent";

type CookieConsentContextValue = {
  accepted: boolean;
  ready: boolean;
  accept: () => void;
};

const CookieConsentContext = createContext<CookieConsentContextValue>({
  accepted: false,
  ready: false,
  accept: () => {},
});

export function useCookieConsent() {
  return useContext(CookieConsentContext);
}

function CookieBanner({ onAccept }: { onAccept: () => void }) {
  return (
    <div
      role="dialog"
      aria-labelledby="cookie-banner-title"
      className="fixed bottom-0 inset-x-0 z-50 p-4 sm:p-5 pointer-events-none"
    >
      <div className="max-w-3xl mx-auto pointer-events-auto bg-white border border-slate-200 rounded-2xl shadow-xl shadow-slate-900/10 p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center gap-4">
        <div className="flex-1 min-w-0 space-y-1">
          <p id="cookie-banner-title" className="text-sm font-bold text-slate-900">
            🍪 Usamos cookies
          </p>
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
            Utilizamos cookies técnicas y de análisis para que el sitio funcione correctamente y
            mejorar tu experiencia en Líneas y Letras. Puedes aceptar para continuar navegando.
          </p>
        </div>
        <button
          type="button"
          onClick={onAccept}
          className="shrink-0 w-full sm:w-auto bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm px-6 py-3 rounded-xl transition-colors"
        >
          Aceptar cookies
        </button>
      </div>
    </div>
  );
}

export function CookieConsentProvider({ children }: { children: React.ReactNode }) {
  const [accepted, setAccepted] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setAccepted(localStorage.getItem(STORAGE_KEY) === "1");
    setReady(true);
  }, []);

  const accept = useCallback(() => {
    localStorage.setItem(STORAGE_KEY, "1");
    setAccepted(true);
  }, []);

  return (
    <CookieConsentContext.Provider value={{ accepted, ready, accept }}>
      {children}
      {ready && !accepted && <CookieBanner onAccept={accept} />}
    </CookieConsentContext.Provider>
  );
}
