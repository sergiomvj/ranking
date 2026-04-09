"use server";

import { prisma } from "../prisma";
import { OPENCLAW_AGENTS } from "../config/agents";
import { fetchOpenClawAgents } from "../integrations/openclaw";
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
  console.log("[Sync] Iniciando sincronização dinâmica de agentes...");
  try {
    const results: { code: string; action: "created" | "skipped" }[] = [];

    // Tenta buscar da API, mas mantém o static como fallback de segurança
    const apiAgents = await fetchOpenClawAgents();
    const sourceAgents = apiAgents || OPENCLAW_AGENTS;

    console.log(`[Sync] Fonte de dados: ${apiAgents ? "API Dinâmica" : "Lista Estática (Fallback)"}`);

    for (const agentData of sourceAgents) {
      const normalizedCode = agentData.code.toLowerCase();
      // Busca case-insensitive simulada garantindo o match correto no banco
      const existing = await prisma.agent.findFirst({ 
        where: { 
          code: { equals: normalizedCode, mode: 'insensitive' } 
        } 
      });

      if (!existing) {
        console.log(`[Sync] Criando novo agente: ${normalizedCode}`);
        await prisma.agent.create({
          data: {
            code: normalizedCode,
            displayName: agentData.displayName,
            status: "active",
            metadata: { 
              source: "openclaw_sync_action", 
              syncedAt: new Date().toISOString() 
            },
          }
        });
        results.push({ code: normalizedCode, action: "created" });
      } else {
        console.log(`[Sync] Agente já existe: ${normalizedCode} (ID: ${existing.id})`);
        results.push({ code: normalizedCode, action: "skipped" });
      }
    }

    console.log(`[Sync] Resultado: ${results.filter(r => r.action === "created").length} criados, ${results.filter(r => r.action === "skipped").length} ignorados.`);

    revalidatePath("/agents");
    revalidatePath("/rankings");
    revalidatePath("/");
    
    return {
      ok: true,
      created: results.filter(r => r.action === "created").length,
      skipped: results.filter(r => r.action === "skipped").length,
    };
  } catch (error: any) {
    console.error("[Sync] Erro crítico na sincronização:", error);
    return { 
      ok: false, 
      error: `Falha técnica: ${error.message || "Erro desconhecido no banco de dados"}` 
    };
  }
}
