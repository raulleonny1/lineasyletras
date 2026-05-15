import Link from "next/link";
import { DraftStoriesPanel } from "@/components/admin/draft-stories-panel";
import { listDraftChapters } from "@/lib/admin/draft-stories";
import { requireStaffProfile } from "@/lib/auth/guards";
import { listAdminRecords } from "@/lib/data/records";

export const dynamic = "force-dynamic";

export default async function AdminDraftStoriesPage() {
  await requireStaffProfile();
  const records = await listAdminRecords();
  const draftChapters = listDraftChapters(records);

  return (
    <section className="px-4 py-16 sm:px-6 sm:py-20">
      <div className="mx-auto max-w-7xl">
        <Link href="/admin" className="text-sm text-bone/60 transition hover:text-bone">
          Volver a administración
        </Link>
        <p className="mt-6 text-xs uppercase tracking-[0.35em] text-bone/45">Control</p>
        <h1 className="mt-3 font-heading text-4xl text-bone sm:text-5xl">Listado de relatos</h1>
        <p className="mt-4 max-w-2xl text-bone/65">
          {draftChapters.length === 0
            ? "No hay capítulos en borrador. Los publicados solo aparecen en Administración."
            : `${draftChapters.length} capítulo${draftChapters.length === 1 ? "" : "s"} en borrador. Cada tarjeta muestra la temporada, el episodio y el autor.`}
        </p>
        <div className="mt-10">
          <DraftStoriesPanel records={records} />
        </div>
      </div>
    </section>
  );
}
