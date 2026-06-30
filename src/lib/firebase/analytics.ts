"use client";

import { getAnalytics, isSupported, type Analytics } from "firebase/analytics";
import { getFirebaseApp } from "./config";

let analytics: Analytics | null = null;

export async function initAnalytics(): Promise<Analytics | null> {
  if (analytics) return analytics;
  if (typeof window === "undefined") return null;

  const app = getFirebaseApp();
  if (!app) return null;

  const supported = await isSupported();
  if (!supported) return null;

  analytics = getAnalytics(app);
  return analytics;
}
