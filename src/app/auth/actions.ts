"use server";

import {
  activateAccountWithoutEmail,
  provisionSuperuserAccount,
  registerWithPassword,
  resendConfirmationEmail,
  signInWithPassword,
} from "@/lib/auth/local-auth";

export async function provisionSuperuserAccountAction(email: string, password: string) {
  return provisionSuperuserAccount(email, password);
}

export async function signInWithPasswordAction(email: string, password: string) {
  return signInWithPassword(email, password);
}

export async function registerWithPasswordAction(name: string, email: string, password: string) {
  return registerWithPassword(name, email, password);
}

export async function activateAccountWithoutEmailAction(email: string, password: string) {
  return activateAccountWithoutEmail(email, password);
}

export { resendConfirmationEmail };
