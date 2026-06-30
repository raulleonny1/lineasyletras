type LogoProps = {
  className?: string;
  showGlow?: boolean;
};

export function LineasYLetrasLogo({ className = "w-11 h-11", showGlow = true }: LogoProps) {
  return (
    <div className={`relative shrink-0 ${showGlow ? "drop-shadow-lg" : ""}`}>
      {showGlow && (
        <div
          className="absolute inset-0 rounded-2xl bg-gradient-to-br from-amber-400/40 via-violet-500/30 to-indigo-600/40 blur-md scale-110"
          aria-hidden
        />
      )}
      <svg
        viewBox="0 0 48 48"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={`relative rounded-2xl ${className}`}
        role="img"
        aria-label="Líneas y Letras"
      >
        <defs>
          <linearGradient id="lyl-bg" x1="4" y1="4" x2="44" y2="44" gradientUnits="userSpaceOnUse">
            <stop stopColor="#312e81" />
            <stop offset="0.45" stopColor="#5b21b6" />
            <stop offset="1" stopColor="#b45309" />
          </linearGradient>
          <linearGradient id="lyl-gold" x1="10" y1="14" x2="38" y2="38" gradientUnits="userSpaceOnUse">
            <stop stopColor="#fde68a" />
            <stop offset="1" stopColor="#f59e0b" />
          </linearGradient>
          <linearGradient id="lyl-line" x1="8" y1="30" x2="40" y2="10" gradientUnits="userSpaceOnUse">
            <stop stopColor="#fef3c7" />
            <stop offset="1" stopColor="#c4b5fd" />
          </linearGradient>
          <filter id="lyl-soft" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="0.6" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        <rect width="48" height="48" rx="14" fill="url(#lyl-bg)" />

        {/* Libro abierto */}
        <path
          d="M24 34.5c-1.2 0-2.4-.35-3.5-1.05L11 28.2V17.8c0-.9.5-1.7 1.3-2.1.8-.4 1.8-.3 2.5.2L24 20.5l9.2-4.6c.7-.5 1.7-.6 2.5-.2.8.4 1.3 1.2 1.3 2.1v10.4l-9.5 5.25c-1.1.7-2.3 1.05-3.5 1.05z"
          fill="#1e1b4b"
          fillOpacity="0.55"
        />
        <path
          d="M11 17.8v10.4l9.5 5.25V23.05L11 17.8z"
          fill="url(#lyl-gold)"
          fillOpacity="0.95"
        />
        <path
          d="M37 17.8v10.4l-9.5 5.25V23.05L37 17.8z"
          fill="url(#lyl-gold)"
          fillOpacity="0.75"
        />
        <path d="M24 20.5v17.75" stroke="#fef3c7" strokeWidth="1.2" strokeLinecap="round" opacity="0.9" />

        {/* Líneas fluidas — escritura en movimiento */}
        <path
          d="M8 14c4-2 8-1.5 12 0s8 2.5 12 0"
          stroke="url(#lyl-line)"
          strokeWidth="2"
          strokeLinecap="round"
          filter="url(#lyl-soft)"
        />
        <path
          d="M10 10.5c3.5-1.8 7.5-1.2 11.5.3s7.5 2.2 11.5.2"
          stroke="#fef3c7"
          strokeWidth="1.5"
          strokeLinecap="round"
          opacity="0.85"
        />
        <path
          d="M12 7.5c2.8-1 6-.6 9.5.8s6.5 2 9.5.4"
          stroke="#ddd6fe"
          strokeWidth="1.2"
          strokeLinecap="round"
          opacity="0.7"
        />

        {/* Letra L estilizada */}
        <path
          d="M15.5 26.5h5.5v2.2h-3.3v4.8h-2.2V26.5z"
          fill="#fff"
          fillOpacity="0.95"
        />
        {/* Letra y estilizada */}
        <path
          d="M28.2 26.5l2.4 4.2 2.4-4.2h2.3l-3.6 6.1v2.4h-2.1v-2.4l-3.6-6.1h2.2z"
          fill="#fde68a"
        />

        {/* Destello */}
        <circle cx="36" cy="11" r="1.5" fill="#fef9c3" opacity="0.95" />
        <circle cx="39" cy="14" r="0.8" fill="#fef9c3" opacity="0.7" />
      </svg>
    </div>
  );
}
