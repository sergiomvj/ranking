import { NextResponse } from "next/server";
import { processMemoryIngestion } from "@/lib/ingestion/processor";

export const dynamic = "force-dynamic";

/**
 * Endpoint de ingestão de memória para o Session Bridge (SMT v1.1).
 * Recebe atualizações de sessões cross-canal dos agentes.
 */
export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get("Authorization");
    const secret = process.env.INGESTION_SECRET || "dev-secret";

    if (!authHeader || authHeader !== `Bearer ${secret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();

    if (!body.agentCode || !body.externalSessionId) {
      return NextResponse.json(
        { error: "agentCode and externalSessionId are required" },
        { status: 400 }
      );
    }

    const result = await processMemoryIngestion({
      agentCode: body.agentCode,
      externalSessionId: body.externalSessionId,
      sourceSystem: body.sourceSystem || "unknown",
      contextSummary: body.contextSummary || "",
      activeThreads: body.activeThreads || [],
      metadata: body.metadata || {},
    });

    return NextResponse.json({ ok: true, sessionId: result.id });
  } catch (error: any) {
    console.error("[Ingest Memory] Error processing request:", error);
    return NextResponse.json(
      { error: "Internal Server Error", message: error.message },
      { status: 500 }
    );
  }
}
