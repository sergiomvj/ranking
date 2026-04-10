"use server";

import { prisma } from "../prisma";
import { OPENCLAW_AGENTS } from "../config/agents";
import { fetchOpenClawAgents, updateOpenClawAgent } from "../integrations/openclaw";
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
 * Busca metadados operacionais (Squads e Funções) cadastrados no banco.
 */
export async function getOperationalMetadata() {
  try {
    const [teams, functions] = await Promise.all([
      prisma.team.findMany({ where: { isActive: true }, orderBy: { name: "asc" } }),
      prisma.functionCatalog.findMany({ where: { isActive: true }, orderBy: { name: "asc" } }),
    ]);

    return {
      teams: serializePrisma(teams),
      functions: serializePrisma(functions),
    };
  } catch (error) {
    console.error("Failed to fetch metadata:", error);
    return { teams: [], functions: [] };
  }
}

/**
 * Atualiza os dados de um agente manualmente.
 */
export async function updateAgentAction(agentId: string, data: {
  displayName?: string;
  owningTeamId?: string | null;
  primaryFunctionId?: string | null;
  status?: any;
  skills?: string;
  career?: string;
  managerNotes?: string;
}) {
  try {
    const updated = await prisma.agent.update({
      where: { id: agentId },
      data: {
        ...data,
        updatedAt: new Date(),
      },
    });

    // Se houver alteração de carreira, tentamos sincronizar com o OpenClaw Master
    if (data.career) {
      console.log(`[Sync Push] Enviando atualização de carreira para o OpenClaw: ${updated.code}`);
      await updateOpenClawAgent(updated.code, { career: data.career });
    }

    revalidatePath("/agents");
    revalidatePath(`/agents/${updated.code}`);
    revalidatePath("/rankings");
    revalidatePath("/");

    return { ok: true, agent: serializePrisma(updated) };
  } catch (error: any) {
    console.error("Failed to update agent:", error);
    return { ok: false, error: error.message };
  }
}

/**
 * Sincroniza a lista de agentes do banco com a configuração OPENCLAW_AGENTS.
 */
export async function syncAgentsAction() {
  console.log("[Sync] Iniciando sincronização dinâmica de agentes...");
  try {
    const results: { code: string; action: "created" | "skipped" }[] = [];

    // Tenta buscar da API
    const apiAgents = await fetchOpenClawAgents();
    
    // Agora o sistema é puramente dinâmico. Se a API falhar e não houver agentes no banco, ele avisará.
    const sourceAgents = apiAgents || [];
    
    if (sourceAgents.length === 0 && !apiAgents) {
       return { ok: false, error: "Não foi possível conectar à API e não há lista de fallback." };
    }
    
    console.log(`[Sync] Sincronizando ${sourceAgents.length} agentes encontrados via API.`);

    for (const agentData of sourceAgents) {
      const normalizedCode = agentData.code.toLowerCase();
      // ... restante da lógica continua igual
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
