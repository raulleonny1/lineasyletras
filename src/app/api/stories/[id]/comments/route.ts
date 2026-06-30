import { NextRequest, NextResponse } from "next/server";
import { fetchComments, addComment } from "@/lib/firebase/comments";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const comments = await fetchComments(id);
  return NextResponse.json({ comments });
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();
  const authorName = String(body.authorName ?? "").trim();
  const text = String(body.text ?? "").trim();

  if (authorName.length < 2 || authorName.length > 60) {
    return NextResponse.json({ error: "Escribe tu nombre (2-60 caracteres)." }, { status: 400 });
  }
  if (text.length < 3 || text.length > 800) {
    return NextResponse.json({ error: "El comentario debe tener entre 3 y 800 caracteres." }, { status: 400 });
  }

  const comment = await addComment(id, authorName, text);
  if (!comment) {
    return NextResponse.json(
      { error: "No se pudo guardar el comentario. Verifica Firebase." },
      { status: 500 }
    );
  }

  return NextResponse.json({ comment }, { status: 201 });
}
