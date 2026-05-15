import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { isConfiguredSuperuserEmail } from "@/lib/auth/superuser";
import type { ReadingProgress, UserProfile, UserRole } from "@/types";

function mapUserProfile(
  user: { id: string; email?: string | null; created_at: string; user_metadata?: { name?: string } },
  row?: Record<string, unknown> | null,
): UserProfile {
  if (row) {
    return {
      id: String(row.id),
      email: String(row.email ?? user.email ?? ""),
      name: row.name ? String(row.name) : null,
      membership_level: row.membership_level as UserProfile["membership_level"],
      role: row.role as UserRole,
      created_at: String(row.created_at ?? user.created_at),
    };
  }

  return {
    id: user.id,
    email: user.email ?? "",
    name: user.user_metadata?.name ?? null,
    membership_level: "free",
    role: "reader",
    created_at: user.created_at,
  };
}

export async function syncConfiguredSuperuserProfile(user: {
  id: string;
  email?: string | null;
  created_at: string;
  user_metadata?: { name?: string };
}) {
  const service = createServiceClient();
  if (!service || !user.email) return null;

  const { data, error } = await service
    .from("users")
    .upsert(
      {
        id: user.id,
        email: user.email,
        name: user.user_metadata?.name ?? "Raul Leon",
        role: "superuser",
        membership_level: "premium",
      },
      { onConflict: "id" },
    )
    .select("*")
    .single();

  if (error) return null;
  return data;
}

export async function getCurrentUserProfile(): Promise<UserProfile | null> {
  const supabase = await createClient();
  if (!supabase) return null;

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  if (isConfiguredSuperuserEmail(user.email)) {
    const synced = await syncConfiguredSuperuserProfile(user);
    if (synced) {
      return mapUserProfile(user, synced);
    }

    return mapUserProfile(user, {
      id: user.id,
      email: user.email ?? "",
      name: user.user_metadata?.name ?? "Raul Leon",
      membership_level: "premium",
      role: "superuser",
      created_at: user.created_at,
    });
  }

  const { data } = await supabase.from("users").select("*").eq("id", user.id).maybeSingle();
  return mapUserProfile(user, data);
}

export async function listUsers(): Promise<UserProfile[]> {
  const supabase = await createClient();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("users")
    .select("*")
    .order("created_at", { ascending: false });

  if (error || !data) return [];

  return data.map((row) =>
    mapUserProfile(
      {
        id: String(row.id),
        email: String(row.email ?? ""),
        created_at: String(row.created_at ?? new Date().toISOString()),
      },
      row,
    ),
  );
}

export async function updateUserRole(userId: string, role: UserRole) {
  const supabase = await createClient();
  if (!supabase) {
    throw new Error("Supabase no está configurado.");
  }

  const { data, error } = await supabase
    .from("users")
    .update({ role })
    .eq("id", userId)
    .select("*")
    .single();

  if (error) throw error;

  return mapUserProfile(
    {
      id: String(data.id),
      email: String(data.email ?? ""),
      created_at: String(data.created_at ?? new Date().toISOString()),
    },
    data,
  );
}

export async function listUserProgress(userId: string): Promise<ReadingProgress[]> {
  const supabase = await createClient();
  if (!supabase) return [];

  const { data, error } = await supabase.from("progress").select("*").eq("user_id", userId);

  if (error || !data) return [];

  return data.map((row) => ({
    user_id: String(row.user_id),
    record_id: String(row.record_id),
    progress_percent: Number(row.progress_percent ?? 0),
    last_position: Number(row.last_position ?? 0),
  }));
}

export async function upsertUserProgress(progress: ReadingProgress) {
  const supabase = await createClient();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("progress")
    .upsert(progress, { onConflict: "user_id,record_id" })
    .select("*")
    .single();

  if (error) throw error;
  return data;
}
