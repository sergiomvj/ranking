import { NextResponse } from "next/server";
import { fetchOpenClawAgents } from "@/lib/integrations/openclaw";

/**
 * ROTA DE DEBUG: Inspeciona a resposta da API do OpenClaw.
 * Ajuda a entender por que apenas 8 agentes estão sendo retornados.
 */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const secret = searchParams.get("secret");

  if (secret !== process.env.INGESTION_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const apiKey = process.env.OPENCLAW_API_KEY;
  const baseUrl = process.env.OPENCLAW_BASE_URL || "https://dashboard.fbrapps.com";

  try {
    const response = await fetch(`${baseUrl}/api/agents`, {
      headers: {
        "Authorization": `ApiKey ${apiKey}`,
        "Accept": "application/json"
      }
    });

    const status = response.status;
    const data = await response.json().catch(() => ({ error: "JSON inválido" }));

    return NextResponse.json({
      debug: {
        url: `${baseUrl}/api/agents`,
        status,
        apiKeyMasked: apiKey ? `${apiKey.substring(0, 5)}...` : "não definida"
      },
      rawData: data,
      observation: Array.isArray(data) 
        ? `Recebidos ${data.length} itens diretamente.` 
        : (data.agents ? `Recebidos ${data.agents.length} agentes via propriedade .agents` : "Estrutura não reconhecida")
    });
  } catch (error: any) {
    return NextResponse.json({
      error: error.message,
      stack: error.stack
    }, { status: 500 });
  }
}
