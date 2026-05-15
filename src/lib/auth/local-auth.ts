import { createClient } from "@supabase/supabase-js";
import { createClient as createServerSupabaseClient } from "@/lib/supabase/server";
import { isConfiguredSuperuserEmail, readSuperuserEmail } from "@/lib/auth/superuser";
import { createServiceClient } from "@/lib/supabase/service";

async function ensureSuperuserProfile(userId: string, email: string) {
  const service = createServiceClient();
  if (!service) return;

  const { error } = await service.from("users").upsert(
    {
      id: userId,
      email,
      name: "Raul Leon",
      role: "superuser",
      membership_level: "premium",
    },
    { onConflict: "id" },
  );

  if (error) {
    throw new Error(error.message);
  }
}

async function findAuthUserByEmail(email: string) {
  const service = createServiceClient();
  if (!service) return null;

  const { data, error } = await service.auth.admin.listUsers();
  if (error) {
    throw new Error(error.message);
  }

  const normalized = email.trim().toLowerCase();
  return data.users.find((user) => user.email?.toLowerCase() === normalized) ?? null;
}

async function confirmExistingAccount(email: string, password: string) {
  const service = createServiceClient();
  if (!service) return false;

  const existing = await findAuthUserByEmail(email);
  if (!existing) return false;

  const { error } = await service.auth.admin.updateUserById(existing.id, {
    password,
    email_confirm: true,
  });

  if (error) {
    throw new Error(error.message);
  }

  return true;
}

export async function provisionSuperuserAccount(email: string, password: string) {
  const service = createServiceClient();
  if (!service || email.trim().toLowerCase() !== readSuperuserEmail().toLowerCase()) {
    return { ok: false as const, reason: "missing-service-role" as const };
  }

  const existing = await findAuthUserByEmail(email);
  let userId = existing?.id;

  if (!userId) {
    const { data, error } = await service.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        name: "Raul Leon",
      },
    });

    if (error) {
      throw new Error(error.message);
    }

    userId = data.user.id;
  } else {
    const { error } = await service.auth.admin.updateUserById(userId, {
      password,
      email_confirm: true,
    });

    if (error) {
      throw new Error(error.message);
    }
  }

  await ensureSuperuserProfile(userId, email);
  return { ok: true as const, userId };
}

async function activateUnconfirmedAccount(email: string, password: string) {
  if (email.trim().toLowerCase() === readSuperuserEmail().toLowerCase()) {
    const provisioned = await provisionSuperuserAccount(email, password);
    return provisioned.ok;
  }

  return confirmExistingAccount(email, password);
}

export async function signInWithPassword(email: string, password: string) {
  const supabase = await createServerSupabaseClient();
  if (!supabase) {
    throw new Error("Supabase no está configurado.");
  }

  let { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error?.message.toLowerCase().includes("email not confirmed")) {
    const activated = await activateUnconfirmedAccount(email, password);
    if (!activated) {
      throw new Error(
        "La cuenta existe pero no está activa. En local, configura SUPABASE_SERVICE_ROLE_KEY y vuelve a intentar.",
      );
    }

    ({ error } = await supabase.auth.signInWithPassword({ email, password }));
  }

  if (error) {
    throw new Error(error.message);
  }

  if (isConfiguredSuperuserEmail(email)) {
    await provisionSuperuserAccount(email, password);
  }

  return { ok: true as const };
}

export async function registerWithPassword(name: string, email: string, password: string) {
  const supabase = await createServerSupabaseClient();
  if (!supabase) {
    throw new Error("Supabase no está configurado.");
  }

  if (email.trim().toLowerCase() === readSuperuserEmail().toLowerCase()) {
    await provisionSuperuserAccount(email, password);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      throw new Error(error.message);
    }
    return { ok: true as const, created: true as const };
  }

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        name,
      },
      emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/auth/callback?next=/dashboard`,
    },
  });

  if (error) {
    throw new Error(error.message);
  }

  if (!data.session) {
    await activateUnconfirmedAccount(email, password);
    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
    if (signInError) {
      throw new Error(signInError.message);
    }
  }

  return { ok: true as const, created: true as const };
}

export async function activateAccountWithoutEmail(email: string, password: string) {
  const activated = await activateUnconfirmedAccount(email, password);
  if (!activated) {
    throw new Error("No se pudo activar la cuenta sin correo.");
  }

  return signInWithPassword(email, password);
}

export async function resendConfirmationEmail(email: string) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    throw new Error("Supabase no está configurado.");
  }

  const supabase = createClient(url, key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  const { error } = await supabase.auth.resend({
    type: "signup",
    email,
    options: {
      emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/auth/callback?next=/dashboard`,
    },
  });

  if (error) {
    throw new Error(error.message);
  }
}
