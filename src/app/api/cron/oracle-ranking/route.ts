import { NextResponse } from "next/server";
import { generateRanking } from "@/lib/integrations/oracle";

export async function GET(request: Request) {
  const secret = new URL(request.url).searchParams.get("secret");
  if (secret !== process.env.INGESTION_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    console.log("[Cron Oracle Ranking] Iniciando geração de ranking semanal...");
    const data = await generateRanking(7, "Cron semanal automatizado pelo Hub — toda segunda-feira às 09:00");

    return NextResponse.json({
      ok: true,
      agents_ranked: data.ranking?.length ?? 0,
      best_performer: data.team_insights?.best_performer,
      executive_summary: data.executive_summary,
    });
  } catch (err: any) {
    console.error("[Cron Oracle Ranking] Erro:", err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
