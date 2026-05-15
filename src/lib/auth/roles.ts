import type { UserRole } from "@/types";

export const ROLE_LABELS: Record<UserRole, string> = {
  reader: "Lector",
  writer: "Escritor",
  superuser: "Superusuario",
};

export const ASSIGNABLE_ROLES: UserRole[] = ["reader", "writer", "superuser"];

export function isStaffRole(role: UserRole) {
  return role === "writer" || role === "superuser";
}
