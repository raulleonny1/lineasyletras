import { NextResponse } from "next/server";
import { isConfiguredSuperuserEmail } from "@/lib/auth/superuser";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUserProfile, syncConfiguredSuperuserProfile } from "@/lib/data/users";

export async function POST() {
  const supabase = await createClient();
  if (!supabase) {
    return NextResponse.json({ ok: false, error: "Supabase no está configurado." }, { status: 500 });
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ ok: false, error: "No autenticado." }, { status: 401 });
  }

  if (isConfiguredSuperuserEmail(user.email)) {
    await syncConfiguredSuperuserProfile(user);
  }

  const profile = await getCurrentUserProfile();
  if (!profile) {
    return NextResponse.json({ ok: false, error: "No autenticado." }, { status: 401 });
  }

  return NextResponse.json({
    ok: true,
    role: profile.role,
    email: profile.email,
  });
}
