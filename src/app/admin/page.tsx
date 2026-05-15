import { AdminPanel } from "@/components/admin/admin-panel";
import { requireStaffProfile } from "@/lib/auth/guards";
import { listCharacters } from "@/lib/data/characters";
import { listAdminRecords } from "@/lib/data/records";
import { listUsers } from "@/lib/data/users";

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{ edit?: string }>;
}) {
  const profile = await requireStaffProfile();
  const params = await searchParams;
  const [records, characters] = await Promise.all([
    listAdminRecords(),
    listCharacters({ includeUnpublished: true }),
  ]);
  const users = profile.role === "superuser" ? await listUsers() : [];

  return (
    <section className="px-4 py-16 sm:px-6 sm:py-20">
      <div className="mx-auto max-w-7xl">
        <p className="text-xs uppercase tracking-[0.35em] text-bone/45">Control</p>
        <h1 className="mt-3 font-heading text-4xl text-bone sm:text-5xl">Administración</h1>
        <p className="mt-4 max-w-2xl text-bone/65">
          Crea cada capítulo con su temporada y episodio. Arriba del formulario define el nombre de la
          novela; debajo, el título de la temporada y el del capítulo. Déjalo en borrador hasta que
          quieras liberarlo; revisa los borradores en Listado de relatos y publícalos desde ahí o en
          el formulario. El archivo y el lector solo muestran episodios publicados. La portada del
          relato va entre slug y etiquetas; las fotos de personaje, en Personajes de la temporada.
        </p>
        <AdminPanel
          records={records}
          characters={characters}
          users={users}
          canManageRoles={profile.role === "superuser"}
          initialEditingId={params.edit ?? null}
        />
      </div>
    </section>
  );
}
