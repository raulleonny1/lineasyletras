import type { DocumentData } from "firebase/firestore";
import { FieldValue } from "firebase-admin/firestore";
import type { UserGender, UserProfile, UserRegistrationInput } from "@/types/user";
import { hashPin, pinLookupKey, verifyPin } from "@/lib/auth/pin";
import { normalizeEmail, normalizeMobile } from "@/lib/auth/user-validation";
import { getAdminFirestore } from "./admin";

const COLLECTION = "users";

function mapUserDoc(id: string, data: DocumentData): UserProfile {
  return {
    id,
    firstName: data.firstName as string,
    lastName: data.lastName as string,
    email: data.email as string,
    mobile: data.mobile as string,
    birthDate: data.birthDate as string,
    country: data.country as string,
    gender: data.gender as UserGender,
    createdAt: data.createdAt?.toDate?.()?.toISOString?.() ?? undefined,
  };
}

export async function getUserByPin(pin: string): Promise<(UserProfile & { pinHash: string }) | null> {
  const adminDb = getAdminFirestore();
  if (!adminDb) return null;

  const lookup = pinLookupKey(pin);
  const snapshot = await adminDb.collection(COLLECTION).where("pinLookupKey", "==", lookup).limit(1).get();

  if (!snapshot.empty) {
    const doc = snapshot.docs[0];
    const data = doc.data();
    if (verifyPin(pin, data.pinHash as string)) {
      return { ...mapUserDoc(doc.id, data), pinHash: data.pinHash as string };
    }
    return null;
  }

  // Cuentas creadas antes de pinLookupKey (migración automática)
  const legacySnap = await adminDb.collection(COLLECTION).limit(500).get();
  for (const doc of legacySnap.docs) {
    const data = doc.data();
    if (data.pinLookupKey) continue;
    if (!verifyPin(pin, data.pinHash as string)) continue;
    await doc.ref.update({
      pinLookupKey: lookup,
      updatedAt: FieldValue.serverTimestamp(),
    });
    return { ...mapUserDoc(doc.id, data), pinHash: data.pinHash as string };
  }

  return null;
}

export async function isPinTaken(pin: string): Promise<boolean> {
  const user = await getUserByPin(pin);
  return Boolean(user);
}

export async function getUserByMobile(mobile: string): Promise<(UserProfile & { pinHash: string }) | null> {
  const adminDb = getAdminFirestore();
  if (!adminDb) return null;

  const normalized = normalizeMobile(mobile);
  const snapshot = await adminDb.collection(COLLECTION).where("mobile", "==", normalized).limit(1).get();
  if (snapshot.empty) return null;

  const doc = snapshot.docs[0];
  const data = doc.data();
  return { ...mapUserDoc(doc.id, data), pinHash: data.pinHash as string };
}

export async function getUserByEmail(email: string): Promise<UserProfile | null> {
  const adminDb = getAdminFirestore();
  if (!adminDb) return null;

  const normalized = normalizeEmail(email);
  const snapshot = await adminDb.collection(COLLECTION).where("email", "==", normalized).limit(1).get();
  if (snapshot.empty) return null;
  return mapUserDoc(snapshot.docs[0].id, snapshot.docs[0].data());
}

export async function getUserById(id: string): Promise<UserProfile | null> {
  const adminDb = getAdminFirestore();
  if (!adminDb) return null;

  const snap = await adminDb.collection(COLLECTION).doc(id).get();
  if (!snap.exists) return null;
  return mapUserDoc(snap.id, snap.data() ?? {});
}

export async function createUser(input: UserRegistrationInput): Promise<UserProfile | null> {
  const adminDb = getAdminFirestore();
  if (!adminDb) return null;

  const mobile = normalizeMobile(input.mobile);
  const email = normalizeEmail(input.email);

  const existingMobile = await getUserByMobile(mobile);
  if (existingMobile) {
    throw new Error("MOBILE_EXISTS");
  }

  const existingEmail = await getUserByEmail(email);
  if (existingEmail) {
    throw new Error("EMAIL_EXISTS");
  }

  if (await isPinTaken(input.pin)) {
    throw new Error("PIN_EXISTS");
  }

  const payload = {
    firstName: input.firstName.trim(),
    lastName: input.lastName.trim(),
    email,
    mobile,
    birthDate: input.birthDate,
    country: input.country.trim(),
    gender: input.gender,
    pinHash: hashPin(input.pin),
    pinLookupKey: pinLookupKey(input.pin),
    privacyAcceptedAt: FieldValue.serverTimestamp(),
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  };

  const docRef = await adminDb.collection(COLLECTION).add(payload);
  return getUserById(docRef.id);
}
