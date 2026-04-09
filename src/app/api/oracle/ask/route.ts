import { NextResponse } from "next/server";
import { askOracle } from "@/lib/integrations/oracle";

export async function POST(req: Request) {
  try {
    const { question, context, agent_id } = await req.json();
    if (!question) return NextResponse.json({ ok: false, error: "question is required" }, { status: 400 });
    const data = await askOracle(question, context, agent_id);
    return NextResponse.json(data);
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}
