export const ADMIN_SDK_REQUIRED_MESSAGE =
  "Firebase Admin no está listo. En Vercel: añade FIREBASE_SERVICE_ACCOUNT_KEY (JSON en una línea) en Settings → Environment Variables y haz Redeploy. En local: pon FIREBASE_SERVICE_ACCOUNT_KEY en .env.local o deja el archivo .json en la raíz con GOOGLE_APPLICATION_CREDENTIALS.";

export const ADMIN_SDK_INIT_FAILED_MESSAGE =
  "Firebase Admin no pudo iniciarse. Revisa que FIREBASE_SERVICE_ACCOUNT_KEY sea el JSON completo en una sola línea (sin saltos de línea rotos) y vuelve a desplegar.";
