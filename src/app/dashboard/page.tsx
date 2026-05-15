import Link from "next/link";
import { redirect } from "next/navigation";
import { isStaffRole, ROLE_LABELS } from "@/lib/auth/roles";
import { Progress } from "@/components/ui/progress";
import { getRecordById, listRecords } from "@/lib/data/records";
import { recordReadPath } from "@/lib/reader-path";
import { getCurrentUserProfile, listUserProgress } from "@/lib/data/users";

export default async function DashboardPage() {
  const profile = await getCurrentUserProfile();

  if (!profile) {
    redirect("/login");
  }

  const progress = await listUserProgress(profile.id);
  const records = await listRecords();
  const progressItems = await Promise.all(
    progress.map(async (item) => ({
      item,
      record: await getRecordById(item.record_id),
    })),
  );

  return (
    <section className="px-4 py-16 sm:px-6 sm:py-20">
      <div className="mx-auto max-w-5xl">
        <p className="text-xs uppercase tracking-[0.35em] text-bone/45">Expediente</p>
        <h1 className="mt-3 font-heading text-4xl text-bone sm:text-5xl">Dashboard</h1>
        <p className="mt-4 break-words text-sm text-bone/65 sm:text-base">
          {profile.email} · membresía {profile.membership_level} · rol {ROLE_LABELS[profile.role]}
        </p>

        {isStaffRole(profile.role) ? (
          <div className="mt-8 rounded-[1.5rem] border border-white/10 bg-white/5 p-6">
            <p className="text-sm leading-relaxed text-bone/70">
              El dashboard muestra tu progreso y el catálogo publicado. Para crear, editar y publicar
              registros nuevos, usa el panel de administración.
            </p>
            <Link
              href="/admin"
              className="mt-4 inline-flex items-center justify-center rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition hover:opacity-90"
            >
              Administrar registros
            </Link>
          </div>
        ) : (
          <div className="mt-8 rounded-[1.5rem] border border-white/10 bg-white/5 p-6 text-sm leading-relaxed text-bone/70">
            Este panel es para leer y continuar historias. La creación de registros la gestionan
            cuentas de escritor o superusuario.
          </div>
        )}

        <div className="mt-10 space-y-4">
          {progressItems.length === 0 ? (
            <div className="glass-panel rounded-[1.5rem] p-6 text-bone/65">
              Aún no hay progreso guardado.{" "}
              <Link href="/archive" className="text-bone hover:text-white">
                Explorar registros
              </Link>
            </div>
          ) : (
            progressItems.map(({ item, record }) => {
              if (!record) return null;

              return (
                <article
                  key={`${item.user_id}-${item.record_id}`}
                  className="rounded-[1.25rem] border border-white/10 bg-white/5 p-5"
                >
                  <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div>
                      <h2 className="font-heading text-2xl text-bone sm:text-3xl">{record.title}</h2>
                      <p className="mt-2 text-sm text-bone/65">
                        Temporada {record.season} · Episodio {record.episode}
                      </p>
                    </div>
                    <Link
                      href={recordReadPath(record.id)}
                      className="text-sm text-bone hover:text-white"
                    >
                      Continuar
                    </Link>
                  </div>
                  <Progress value={item.progress_percent} className="mt-4 h-2" />
                </article>
              );
            })
          )}
        </div>

        <div className="mt-12">
          <h2 className="font-heading text-2xl text-bone sm:text-3xl">Registros disponibles</h2>
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {records.map((record) => (
              <Link
                key={record.id}
                href={`/record/${record.id}`}
                className="rounded-[1.25rem] border border-white/10 bg-white/5 p-5 hover:border-white/20"
              >
                <p className="font-heading text-2xl text-bone">{record.title}</p>
                <p className="mt-2 text-sm text-bone/65">{record.synopsis}</p>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
