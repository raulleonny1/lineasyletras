"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { updateUserRoleAction } from "@/app/admin/actions";
import { ASSIGNABLE_ROLES, ROLE_LABELS } from "@/lib/auth/roles";
import type { UserProfile, UserRole } from "@/types";

interface UserRolesPanelProps {
  users: UserProfile[];
}

export function UserRolesPanel({ users }: UserRolesPanelProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [items, setItems] = useState(users);

  useEffect(() => {
    setItems(users);
  }, [users]);

  const changeRole = (userId: string, role: UserRole) => {
    startTransition(async () => {
      try {
        const updated = await updateUserRoleAction(userId, role);
        setItems((current) =>
          current.map((user) => (user.id === updated.id ? updated : user)),
        );
        toast.success("Rol actualizado.");
        router.refresh();
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "No se pudo actualizar el rol.");
      }
    });
  };

  return (
    <section id="usuarios-admin" className="mt-12 scroll-mt-24 rounded-[1.5rem] border border-white/10 bg-white/5 p-4 sm:p-6">
      <p className="text-xs uppercase tracking-[0.35em] text-bone/45">Accesos</p>
      <h2 className="mt-3 font-heading text-2xl text-bone sm:text-3xl">Usuarios y roles</h2>
      <p className="mt-3 max-w-2xl text-sm text-bone/65">
        Asigna permisos de lector, escritor o superusuario a las cuentas registradas.
      </p>

      <div className="mt-6 space-y-3">
        {items.length === 0 ? (
          <p className="text-sm text-bone/60">Todavía no hay usuarios registrados.</p>
        ) : (
          items.map((user) => (
            <article
              key={user.id}
              className="flex flex-col gap-4 rounded-[1.25rem] border border-white/10 bg-black/20 p-4 md:flex-row md:items-center md:justify-between"
            >
              <div>
                <p className="break-all font-medium text-bone">{user.email}</p>
                <p className="mt-1 text-sm text-bone/60">
                  {user.name ?? "Sin nombre"} · {ROLE_LABELS[user.role]}
                </p>
              </div>
              <select
                className="w-full rounded-full border border-white/10 bg-black/20 px-4 py-2 text-sm text-bone md:w-56"
                value={user.role}
                onChange={(event) => changeRole(user.id, event.target.value as UserRole)}
                disabled={pending}
              >
                {ASSIGNABLE_ROLES.map((role) => (
                  <option key={role} value={role}>
                    {ROLE_LABELS[role]}
                  </option>
                ))}
              </select>
            </article>
          ))
        )}
      </div>
    </section>
  );
}
