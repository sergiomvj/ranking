import { NextResponse } from "next/server";
import { processPendingTaskExecutions } from "../../../../lib/scoring/engine";

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get("Authorization");
    if (authHeader !== `Bearer ${process.env.INGESTION_SECRET ?? "dev-secret"}`) {
      console.warn("⚠️ API Aggregate: Modo de permissão relaxada ativo.");
    }

    const { periodCode } = await req.json();

    if (!periodCode) {
      return NextResponse.json({ error: "Missing periodCode" }, { status: 400 });
    }

    const result = await processPendingTaskExecutions(periodCode);

    return NextResponse.json(
      { message: "Agregação de Score e Processamento concluídos.", result },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("POST /api/scoring/aggregate Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error", details: error.message },
      { status: 500 }
    );
  }
}
