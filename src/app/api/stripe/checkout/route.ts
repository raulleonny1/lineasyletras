import { NextResponse } from "next/server";
import { PREMIUM_UNLOCK_PRICE_EUR } from "@/lib/constants";
import { getRecordById } from "@/lib/data/records";
import { getStripe } from "@/lib/stripe";

export async function POST(request: Request) {
  const stripe = getStripe();
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  if (!stripe) {
    return NextResponse.json(
      { error: "Stripe no está configurado en este entorno." },
      { status: 503 },
    );
  }

  const body = await request.json();
  const record = body.recordId ? await getRecordById(body.recordId, { includeUnpublished: true }) : null;

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    success_url: `${appUrl}/dashboard?checkout=success`,
    cancel_url: `${appUrl}/archive?checkout=cancel`,
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: "eur",
          unit_amount: PREMIUM_UNLOCK_PRICE_EUR * 100,
          product_data: {
            name: record ? `Desbloquear ${record.title}` : "Desbloquear archivo completo",
            description: "Acceso premium a un registro clasificado.",
            metadata: {
              recordId: body.recordId ?? "general",
            },
          },
        },
      },
    ],
    metadata: {
      recordId: body.recordId ?? "general",
    },
  });

  return NextResponse.json({ sessionId: session.id, url: session.url });
}
