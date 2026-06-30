import { NextRequest, NextResponse } from "next/server";
import { getLikeCount, adjustLikeCount } from "@/lib/firebase/comments";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const likeCount = await getLikeCount(id);
  return NextResponse.json({ likeCount });
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { liked } = (await request.json()) as { liked: boolean };
  const delta = liked ? 1 : -1;
  const likeCount = await adjustLikeCount(id, delta);
  return NextResponse.json({ likeCount });
}
