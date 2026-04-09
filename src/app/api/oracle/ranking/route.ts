import { NextResponse } from "next/server";
import { generateRanking } from "@/lib/integrations/oracle";

export async function POST() {
  try {
    const data = await generateRanking(7);
    return NextResponse.json(data);
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}
