import { readFileSync } from "fs";
import { resolve } from "path";
import { initializeApp, getApps, cert, type App, type ServiceAccount } from "firebase-admin/app";
import { getFirestore, type Firestore } from "firebase-admin/firestore";

let adminApp: App | undefined;
let adminDb: Firestore | undefined;

function loadServiceAccount(): ServiceAccount | null {
  const inline = process.env.FIREBASE_SERVICE_ACCOUNT_KEY?.trim();
  if (inline) {
    return JSON.parse(inline) as ServiceAccount;
  }

  const credPath = process.env.GOOGLE_APPLICATION_CREDENTIALS?.trim();
  if (credPath) {
    const absolute = resolve(process.cwd(), credPath);
    const raw = readFileSync(absolute, "utf8");
    return JSON.parse(raw) as ServiceAccount;
  }

  return null;
}

export function isAdminSdkConfigured(): boolean {
  return Boolean(
    process.env.FIREBASE_SERVICE_ACCOUNT_KEY?.trim() ||
      process.env.GOOGLE_APPLICATION_CREDENTIALS?.trim()
  );
}

export function getAdminFirestore(): Firestore | null {
  try {
    if (adminDb) return adminDb;

    if (getApps().length === 0) {
      const serviceAccount = loadServiceAccount();
      if (serviceAccount) {
        adminApp = initializeApp({
          credential: cert(serviceAccount),
          projectId: serviceAccount.projectId ?? process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
        });
      } else {
        return null;
      }
    } else {
      adminApp = getApps()[0];
    }

    adminDb = getFirestore(adminApp);
    return adminDb;
  } catch (error) {
    console.error("Error al inicializar Firebase Admin:", error);
    return null;
  }
}
