import { NextRequest, NextResponse } from "next/server";
import type { AiAssistantMode } from "@/types/story";

const GEMINI_MODEL = "gemini-2.0-flash";

async function fetchWithRetry(
  url: string,
  options: RequestInit,
  retries = 5,
  delay = 1000
): Promise<Response> {
  try {
    const response = await fetch(url, options);
    if (!response.ok) {
      if (retries > 0) {
        await new Promise((resolve) => setTimeout(resolve, delay));
        return fetchWithRetry(url, options, retries - 1, delay * 2);
      }
      throw new Error(`Error en la API: ${response.statusText}`);
    }
    return response;
  } catch (error) {
    if (retries > 0) {
      await new Promise((resolve) => setTimeout(resolve, delay));
      return fetchWithRetry(url, options, retries - 1, delay * 2);
    }
    throw error;
  }
}

async function callGemini(promptText: string, systemPrompt = ""): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY no configurada");
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`;
  const payload = {
    contents: [{ parts: [{ text: promptText }] }],
    systemInstruction: systemPrompt
      ? { parts: [{ text: systemPrompt }] }
      : undefined,
  };

  const response = await fetchWithRetry(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const responseData = await response.json();
  return (
    responseData.candidates?.[0]?.content?.parts?.[0]?.text ||
    "No se pudo obtener una respuesta."
  );
}

function buildPrompt(mode: AiAssistantMode, aiPrompt: string): string {
  if (mode === "bosquejo") {
    return `Genera un bosquejo detallado y una idea estructurada para una historia o lección sobre: "${aiPrompt}". Incluye:
      1. Un título sugerido que llame la atención.
      2. El valor o lección moral/espiritual principal.
      3. Estructura narrativa breve (Inicio, Conflicto, Desenlace).
      4. Una cita bíblica o frase de sabiduría que encaje perfectamente.`;
  }
  if (mode === "pulir") {
    return `Actúa como un editor literario profesional de alto nivel. Toma el siguiente texto borrador escrito por el usuario, mantén su mensaje esencial sobre la fe o la vida, pero reescríbelo con una prosa hermosa, metáforas conmovedoras y una fluidez excepcional. Dale un acabado profesional que inspire al leerlo.\n\nBorrador del usuario:\n"${aiPrompt}"`;
  }
  return `Crea un devocional cristiano o lección de vida inspiradora basada en: "${aiPrompt}". Debe contener un título inspirador, un pasaje de reflexión espiritual profunda, una aplicación práctica para la vida cotidiana de hoy en día, y una oración final de entrega y gratitud. Haz que sea muy conmovedor y profesional.`;
}

const SYSTEM_PROMPT =
  "Eres un refinado escritor de literatura, historias inspiradoras, lecciones de vida edificantes y reflexiones cristianas profundas. Tu tono es poético, compasivo, sabio y motivador. Escribe siempre en un español fluido, poético y elegante.";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { prompt, mode } = body as { prompt: string; mode: AiAssistantMode };

    if (!prompt?.trim()) {
      return NextResponse.json(
        { error: "El prompt no puede estar vacío." },
        { status: 400 }
      );
    }

    const finalPrompt = buildPrompt(mode, prompt);
    const text = await callGemini(finalPrompt, SYSTEM_PROMPT);

    return NextResponse.json({ text });
  } catch (error) {
    console.error("Error en API Gemini:", error);
    return NextResponse.json(
      {
        error:
          "Hubo un error de conexión al generar la inspiración de la IA. Por favor, vuelve a intentarlo en unos instantes.",
      },
      { status: 500 }
    );
  }
}
