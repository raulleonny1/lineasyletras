import { ImageResponse } from "next/og";
import { getPublicStory } from "@/lib/stories/get-public-story";
import { getCoverImageBuffer } from "@/lib/firebase/storage";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const alt = "Líneas y Letras";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function OgImage({ params }: Props) {
  const { id } = await params;
  const story = await getPublicStory(id);
  const coverBuffer = await getCoverImageBuffer(id);

  const title = story?.title ?? "Historia inspiradora";
  const summary =
    story?.summary?.slice(0, 140) ??
    "Literatura, fe y palabras que inspiran en Líneas y Letras.";
  const category = story?.category ?? "Líneas y Letras";

  if (coverBuffer) {
    const coverSrc = `data:image/jpeg;base64,${coverBuffer.toString("base64")}`;

    return new ImageResponse(
      (
        <div
          style={{
            width: "100%",
            height: "100%",
            display: "flex",
            position: "relative",
            background: "#0f172a",
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={coverSrc}
            alt=""
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
            }}
          />
          <div
            style={{
              position: "absolute",
              bottom: 0,
              left: 0,
              right: 0,
              display: "flex",
              flexDirection: "column",
              gap: 8,
              padding: "48px 56px",
              background: "linear-gradient(transparent, rgba(15,23,42,0.92))",
              color: "white",
              fontFamily: "Georgia, serif",
            }}
          >
            <div
              style={{
                fontSize: 20,
                fontWeight: 700,
                letterSpacing: 2,
                textTransform: "uppercase",
                opacity: 0.9,
              }}
            >
              {category}
            </div>
            <div style={{ fontSize: 48, fontWeight: 700, lineHeight: 1.15, maxWidth: 1050 }}>
              {title}
            </div>
            <div style={{ fontSize: 24, fontWeight: 700, letterSpacing: 1, opacity: 0.95 }}>
              Líneas y Letras
            </div>
          </div>
        </div>
      ),
      { ...size }
    );
  }

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: 64,
          background: "linear-gradient(135deg, #312e81 0%, #4f46e5 45%, #0ea5e9 100%)",
          color: "white",
          fontFamily: "Georgia, serif",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div
            style={{
              fontSize: 22,
              fontWeight: 700,
              letterSpacing: 2,
              textTransform: "uppercase",
              opacity: 0.9,
            }}
          >
            {category}
          </div>
          <div style={{ fontSize: 56, fontWeight: 700, lineHeight: 1.15, maxWidth: 1000 }}>
            {title}
          </div>
          <div style={{ fontSize: 28, lineHeight: 1.4, opacity: 0.92, maxWidth: 980 }}>
            {summary}
          </div>
        </div>
        <div style={{ fontSize: 30, fontWeight: 700, letterSpacing: 1 }}>
          Líneas y Letras
        </div>
      </div>
    ),
    { ...size }
  );
}
