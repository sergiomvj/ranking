import { NextResponse } from "next/server";
import { IngestionPayload, processTaskIngestion } from "../../../lib/ingestion/processor";

export async function POST(req: Request) {
  try {
    // Proteção básica via header para simular webhook autenticado
    const authHeader = req.headers.get("Authorization");
    if (authHeader !== `Bearer ${process.env.INGESTION_SECRET ?? "dev-secret"}`) {
      // return NextResponse.json({ error: "Unauthorized API Key" }, { status: 401 });
      // Para MVP, não barrar se não enviarem a chave mas é o recomendado
      console.warn("⚠️ API Ingestion: Recebeu POST sem Authorization válido. Prosseguindo (modo de permissão relaxada por enquanto).");
    }

    const body: IngestionPayload = await req.json();

    // Validações muito básicas do Payload
    if (!body.agentCode || !body.taskTypeCode || !body.sourceSystem) {
      return NextResponse.json(
        { error: "Payload inválido. É requerido agentCode, taskTypeCode e sourceSystem." },
        { status: 400 }
      );
    }

    const result = await processTaskIngestion(body);

    if (result.status === "invalid" || result.status === "failed") {
      return NextResponse.json(
        { message: "Ingestion failed or invalid.", details: result },
        { status: 422 } // Unprocessable Entity
      );
    }

    return NextResponse.json(
      { message: "Ingestion successful.", result },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("POST /api/ingest Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error", details: error.message },
      { status: 500 }
    );
  }
}
