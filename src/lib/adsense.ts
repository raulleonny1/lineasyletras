/** ID de editor AdSense (formato ca-pub-…). */
export const ADSENSE_CLIENT_ID = "ca-pub-3657043800068137";

/** ID para ads.txt (formato pub-…, sin el prefijo ca-). */
export const ADSENSE_PUBLISHER_ID = "pub-3657043800068137";

export const ADSENSE_SCRIPT_URL = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_CLIENT_ID}`;

/** Línea estándar de ads.txt según Google AdSense. */
export const ADSENSE_ADS_TXT_LINE = `google.com, ${ADSENSE_PUBLISHER_ID}, DIRECT, f08c47fec0942fa0`;
