import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { finalizeVerifiedPaystackPayment, isValidPaystackSignature, verifyPaystackReference } from "@/lib/paystack";

export async function GET(req: Request) {
  try {
    const reference = new URL(req.url).searchParams.get("reference");
    if (!reference) throw new Error("Missing payment reference.");

    const json = await verifyPaystackReference(reference);
    const result = await finalizeVerifiedPaystackPayment({
      reference,
      amount: json.data?.amount ?? 0,
      currency: json.data?.currency ?? "",
      channel: json.data?.channel ?? null,
      gatewayResponse: json.data?.gateway_response ?? null,
      paidAt: json.data?.paid_at ?? null,
    });

    return NextResponse.json({ verified: true, ...result });
  } catch (error) {
    console.error("Paystack callback verification failed:", error instanceof Error ? error.message : error);
    return NextResponse.json({ error: error instanceof Error ? error.message : "Verification failed" }, { status: 400 });
  }
}

export async function POST(req: Request) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get("x-paystack-signature");
    if (!isValidPaystackSignature(rawBody, signature)) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    const event = JSON.parse(rawBody) as {
      event?: string;
      data?: {
        id?: number;
        reference?: string;
        status?: string;
        amount?: number;
        currency?: string;
        channel?: string;
        gateway_response?: string;
        paid_at?: string;
      };
    };

    const reference = event.data?.reference;
    const supabase = createAdminClient();
    if (!supabase) throw new Error("Supabase is not configured.");

    const eventId = event.data?.id ? String(event.data.id) : `${event.event ?? "unknown"}:${reference ?? crypto.randomUUID()}`;
    const { error: eventError } = await supabase.from("payment_events").insert({
      provider: "paystack",
      event_id: eventId,
      provider_reference: reference ?? null,
      event_type: event.event ?? "unknown",
      payload: event,
    });

    if (eventError) {
      return NextResponse.json({ received: true, duplicate: true });
    }

    if (event.event === "charge.success" && reference && event.data?.status === "success") {
      await finalizeVerifiedPaystackPayment({
        reference,
        amount: event.data.amount ?? 0,
        currency: event.data.currency ?? "",
        channel: event.data.channel ?? null,
        gatewayResponse: event.data.gateway_response ?? null,
        paidAt: event.data.paid_at ?? null,
      });
    }

    await supabase.from("payment_events").update({ processed_at: new Date().toISOString() }).eq("provider", "paystack").eq("event_id", eventId);

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Paystack webhook failed:", error instanceof Error ? error.message : error);
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 400 });
  }
}
