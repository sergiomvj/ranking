import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";
import { OPENCLAW_AGENTS } from "../../../../lib/config/agents";

export async function POST(req: Request) {
  // Proteção básica por secret
  const { searchParams } = new URL(req.url);
  const secret = searchParams.get("secret") || req.headers.get("x-sync-secret");
  
  if (secret !== process.env.INGESTION_SECRET && process.env.NODE_ENV !== "development") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const results: { code: string; action: "created" | "skipped" }[] = [];

  for (const agentData of OPENCLAW_AGENTS) {
    const existing = await prisma.agent.findUnique({ where: { code: agentData.code } });

    if (!existing) {
      await prisma.agent.create({
        data: {
          code:        agentData.code,
          displayName: agentData.displayName,
          status:      "active",
          metadata:    { source: "openclaw_sync_api", syncedAt: new Date().toISOString() },
        }
      });
      results.push({ code: agentData.code, action: "created" });
    } else {
      results.push({ code: agentData.code, action: "skipped" });
    }
  }

  const created = results.filter(r => r.action === "created").length;
  const skipped = results.filter(r => r.action === "skipped").length;

  return NextResponse.json({
    ok: true,
    message: `Sync via API concluído: ${created} agente(s) criado(s), ${skipped} já existente(s).`,
    created,
    skipped,
  });
}
