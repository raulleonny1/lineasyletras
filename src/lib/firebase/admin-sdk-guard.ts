import { NextResponse } from "next/server";
import { getAdminFirestore, isAdminSdkConfigured } from "./admin";
import {
  ADMIN_SDK_REQUIRED_MESSAGE,
  ADMIN_SDK_INIT_FAILED_MESSAGE,
} from "./admin-sdk-message";

export function adminSdkGuard() {
  if (!isAdminSdkConfigured()) {
    return NextResponse.json({ error: ADMIN_SDK_REQUIRED_MESSAGE }, { status: 503 });
  }
  if (!getAdminFirestore()) {
    return NextResponse.json({ error: ADMIN_SDK_INIT_FAILED_MESSAGE }, { status: 503 });
  }
  return null;
}
