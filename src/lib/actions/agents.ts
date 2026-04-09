"use server";

import { prisma } from "../prisma";
import { OPENCLAW_AGENTS } from "../config/agents";
import { serializePrisma } from "../utils/serialization";
import { revalidatePath } from "next/cache";

/**
 * Busca todos os agentes cadastrados no banco de dados.
 */
export async function getAllAgents() {
  try {
    const agents = await prisma.agent.findMany({
      orderBy: { displayName: "asc" },
      include: {
        owningTeam: true,
        primaryFunction: true,
      },
    });
    return serializePrisma(agents);
  } catch (error) {
    console.error("Failed to fetch agents:", error);
    return [];
  }
}

/**
 * Sincroniza a lista de agentes do banco com a configuração OPENCLAW_AGENTS.
 */
export async function syncAgentsAction() {
  try {
    const results: { code: string; action: "created" | "skipped" }[] = [];

    for (const agentData of OPENCLAW_AGENTS) {
      const existing = await prisma.agent.findUnique({ where: { code: agentData.code } });

      if (!existing) {
        await prisma.agent.create({
          data: {
            code: agentData.code,
            displayName: agentData.displayName,
            status: "active",
            metadata: { 
              source: "openclaw_sync_action", 
              syncedAt: new Date().toISOString() 
            },
          }
        });
        results.push({ code: agentData.code, action: "created" });
      } else {
        results.push({ code: agentData.code, action: "skipped" });
      }
    }

    revalidatePath("/agents");
    revalidatePath("/rankings");
    
    return {
      ok: true,
      created: results.filter(r => r.action === "created").length,
      skipped: results.filter(r => r.action === "skipped").length,
    };
  } catch (error) {
    console.error("Sync failed:", error);
    return { ok: false, error: "Falha na sincronização com o banco de dados." };
  }
}
