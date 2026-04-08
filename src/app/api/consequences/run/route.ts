import { NextResponse } from "next/server";
import { processPeriodConsequences } from "../../../../lib/consequences/engine";

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get("Authorization");
    if (authHeader !== `Bearer ${process.env.INGESTION_SECRET ?? "dev-secret"}`) {
      console.warn("⚠️ API Consequence Engine: Modo de permissão relaxada ativo.");
    }

    const { periodCode } = await req.json();

    if (!periodCode) {
      return NextResponse.json({ error: "Missing periodCode" }, { status: 400 });
    }

    const result = await processPeriodConsequences(periodCode);

    return NextResponse.json(
      { message: "Motor de Regras concluído. Consequências e Badges atribuídos.", result },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("POST /api/consequences/run Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error", details: error.message },
      { status: 500 }
    );
  }
}
