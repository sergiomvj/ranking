import { NextResponse } from "next/server";
import { reviewRecommendation } from "@/lib/integrations/oracle";

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { status, reviewed_by } = await req.json();
    const data = await reviewRecommendation(Number(id), status, reviewed_by ?? "admin");
    return NextResponse.json(data);
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}
