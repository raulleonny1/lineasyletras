import { NextResponse } from "next/server";
import { getCurrentUserProfile } from "@/lib/data/users";

export async function GET() {
  const profile = await getCurrentUserProfile();

  if (!profile) {
    return NextResponse.json({ ok: false, error: "No autenticado." }, { status: 401 });
  }

  return NextResponse.json({
    ok: true,
    role: profile.role,
    email: profile.email,
    membership_level: profile.membership_level,
  });
}
