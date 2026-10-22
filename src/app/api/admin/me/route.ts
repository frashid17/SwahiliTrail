import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin/access";

export async function GET() {
  const gate = await requireAdmin();
  if (!gate.ok) {
    return NextResponse.json(
      { isAdmin: false, reason: gate.reason },
      { status: gate.status === 401 ? 401 : 200 },
    );
  }
  return NextResponse.json({ isAdmin: true, email: gate.email });
}
