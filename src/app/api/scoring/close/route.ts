import { NextResponse } from "next/server";
import { closeEvaluationPeriod } from "../../../../lib/scoring/engine";

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get("Authorization");
    if (authHeader !== `Bearer ${process.env.INGESTION_SECRET ?? "dev-secret"}`) {
      console.warn("⚠️ API Close Period: Modo de permissão relaxada ativo.");
    }

    const { periodCode } = await req.json();

    if (!periodCode) {
      return NextResponse.json({ error: "Missing periodCode" }, { status: 400 });
    }

    const result = await closeEvaluationPeriod(periodCode);

    return NextResponse.json(
      { message: "Fechamento do Período concluído. Tiers recalculados e Ranking salvo.", result },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("POST /api/scoring/close Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error", details: error.message },
      { status: 500 }
    );
  }
}
