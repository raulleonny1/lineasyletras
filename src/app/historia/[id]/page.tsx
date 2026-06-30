import type { Metadata } from "next";
import SendaDeLuz from "@/components/senda-de-luz/senda-de-luz";
import { absoluteUrl } from "@/lib/site-url";
import { absoluteCoverImageUrl, storyOgImageUrl } from "@/lib/firebase/storage-url";
import { getPublicStory } from "@/lib/stories/get-public-story";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const story = await getPublicStory(id);
  const pageUrl = absoluteUrl(`/historia/${id}`);

  const hasCover = Boolean(story?.coverImageUrl);
  const ogImage = hasCover ? absoluteCoverImageUrl(id) : storyOgImageUrl(id);
  const ogWidth = hasCover ? 800 : 1200;
  const ogHeight = hasCover ? 420 : 630;
  const ogType = hasCover ? "image/jpeg" : "image/png";

  if (!story) {
    return {
      title: "Historia — Líneas y Letras",
      description: "Literatura, fe y palabras que inspiran.",
      openGraph: {
        title: "Líneas y Letras",
        description: "Literatura, fe y palabras que inspiran.",
        url: pageUrl,
        siteName: "Líneas y Letras",
        type: "article",
        images: [{ url: ogImage, width: ogWidth, height: ogHeight, type: ogType }],
      },
    };
  }

  const title = `${story.title} — Líneas y Letras`;
  const description = story.summary || story.content.slice(0, 160);

  return {
    title,
    description,
    openGraph: {
      title: story.title,
      description,
      url: pageUrl,
      siteName: "Líneas y Letras",
      type: "article",
      locale: "es_ES",
      images: [
        {
          url: ogImage,
          secureUrl: ogImage,
          width: ogWidth,
          height: ogHeight,
          type: ogType,
          alt: story.title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: story.title,
      description,
      images: [ogImage],
    },
  };
}

export default async function HistoriaPage({ params }: Props) {
  const { id } = await params;
  return <SendaDeLuz initialStoryId={id} />;
}
