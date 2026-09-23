import { NextRequest, NextResponse } from "next/server";
import { getAllCouponsAdmin, saveCoupon, deleteCoupon } from "@/lib/coupons";
import { requireAdmin } from "@/lib/auth";

export async function GET() {
  try {
    await requireAdmin();
    const coupons = await getAllCouponsAdmin();
    return NextResponse.json({ coupons });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to load coupon codes" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireAdmin();
    const body = await request.json();

    if (!body.code || !body.type || body.value === undefined) {
      return NextResponse.json({ error: "Code, discount type, and value are required." }, { status: 400 });
    }

    const coupon = await saveCoupon(body);
    return NextResponse.json({ coupon });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to save coupon code" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    await requireAdmin();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "Missing coupon ID" }, { status: 400 });

    await deleteCoupon(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to delete coupon" },
      { status: 500 }
    );
  }
}
