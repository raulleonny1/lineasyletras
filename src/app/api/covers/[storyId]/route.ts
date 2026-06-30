import { NextResponse } from "next/server";
import { getCoverImageBuffer } from "@/lib/firebase/storage";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ storyId: string }> }
) {
  const { storyId } = await params;
  const buffer = await getCoverImageBuffer(storyId);

  if (!buffer) {
    return NextResponse.json({ error: "Imagen no encontrada" }, { status: 404 });
  }

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "image/jpeg",
      "Cache-Control": "public, max-age=86400",
    },
  });
}
