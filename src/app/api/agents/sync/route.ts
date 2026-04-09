import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";

// Agentes conhecidos do OpenClaw — fonte: briefing-dev-sprint-api.md
// Novos agentes são adicionados aqui conforme o time cresce
const OPENCLAW_AGENTS = [
  { code: "bia",       displayName: "Bia" },
  { code: "chiara",    displayName: "Chiara" },
  { code: "david",     displayName: "David" },
  { code: "lia",       displayName: "Lia" },
  { code: "mila",      displayName: "Mila" },
  { code: "leon",      displayName: "Leon" },
  { code: "maia",      displayName: "Maia" },
  { code: "secretary", displayName: "Secretary" },
];

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
          metadata:    { source: "openclaw_sync", syncedAt: new Date().toISOString() },
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
    message: `Sync concluído: ${created} agente(s) criado(s), ${skipped} já existente(s).`,
    created,
    skipped,
    details: results,
  });
}
