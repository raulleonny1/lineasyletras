import SendaDeLuz from "@/components/senda-de-luz/senda-de-luz";

type Props = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({ params }: Props) {
  const { id } = await params;
  try {
    const base = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
    const res = await fetch(`${base}/api/stories/${id}`, { cache: "no-store" });
    if (res.ok) {
      const { story } = await res.json();
      const metadata: Record<string, unknown> = {
        title: `${story.title} — Líneas y Letras`,
        description: story.summary,
        openGraph: {
          title: `${story.title} — Líneas y Letras`,
          description: story.summary,
          type: "article",
          url: `${base}/historia/${id}`,
        },
      };
      if (story.coverImageUrl) {
        metadata.openGraph = {
          ...(metadata.openGraph as object),
          images: [{ url: story.coverImageUrl, width: 800, height: 420, alt: story.title }],
        };
      }
      return metadata;
    }
  } catch {
    /* fallback */
  }
  return { title: "Historia — Líneas y Letras" };
}

export default async function HistoriaPage({ params }: Props) {
  const { id } = await params;
  return <SendaDeLuz initialStoryId={id} />;
}
