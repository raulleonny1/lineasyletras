import { redirect } from "next/navigation";
import { getCurrentUserProfile } from "@/lib/data/users";
import { isStaffRole } from "@/lib/auth/roles";
import type { UserProfile } from "@/types";

export { isStaffRole } from "@/lib/auth/roles";

export async function requireUserProfile(): Promise<UserProfile> {
  const profile = await getCurrentUserProfile();
  if (!profile) {
    redirect("/login");
  }
  return profile;
}

export async function requireStaffProfile(): Promise<UserProfile> {
  const profile = await requireUserProfile();
  if (!isStaffRole(profile.role)) {
    redirect("/dashboard");
  }
  return profile;
}

export async function requireSuperuserProfile(): Promise<UserProfile> {
  const profile = await requireUserProfile();
  if (profile.role !== "superuser") {
    redirect("/dashboard");
  }
  return profile;
}
