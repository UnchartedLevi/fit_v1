import { NextRequest, NextResponse } from "next/server";
import { getAllShippingMethodsAdmin, listActiveShippingMethods, saveShippingMethod, deleteShippingMethod } from "@/lib/shipping";
import { requireAdmin } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const all = searchParams.get("all") === "true";

    if (all) {
      const methods = await getAllShippingMethodsAdmin();
      return NextResponse.json({ methods });
    }

    const methods = await listActiveShippingMethods();
    return NextResponse.json({ methods });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to load shipping methods" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireAdmin();
    const body = await request.json();

    if (!body.zone_name || body.price === undefined || !body.eta) {
      return NextResponse.json({ error: "Zone name, price, and ETA are required." }, { status: 400 });
    }

    const method = await saveShippingMethod(body);
    return NextResponse.json({ method });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to save shipping method" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    await requireAdmin();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "Missing shipping method ID" }, { status: 400 });

    await deleteShippingMethod(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to delete shipping method" },
      { status: 500 }
    );
  }
}
