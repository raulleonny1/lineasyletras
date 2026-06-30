import SendaDeLuz from "@/components/senda-de-luz/senda-de-luz";

type Props = {
  params: Promise<{ tag: string }>;
};

export async function generateMetadata({ params }: Props) {
  const { tag } = await params;
  const label = decodeURIComponent(tag);
  return {
    title: `#${label} — Líneas y Letras`,
    description: `Historias y lecciones etiquetadas con ${label}`,
  };
}

export default async function EtiquetaPage({ params }: Props) {
  const { tag } = await params;
  const initialTag = decodeURIComponent(tag);

  return <SendaDeLuz initialTag={initialTag} />;
}
