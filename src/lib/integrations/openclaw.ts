import { prisma } from "../prisma";

interface OpenClawTaskPayload {
    agent: string;
    action: string;
}

interface OpenClawSprintPayload {
    sprintName: string;
    context?: string;
    tasks: OpenClawTaskPayload[];
}

export async function dispatchToOpenClawSprint(projectId: string) {
    const apiKey = process.env.OPENCLAW_API_KEY;
    const baseUrl = process.env.OPENCLAW_BASE_URL || "https://dashboard.fbrapps.com";

    if (!apiKey) {
        console.warn("[OpenClaw Hub] API Key não detectada. Pulando o Hook de Integração de Sprint.");
        return;
    }

    const project = await prisma.project.findUnique({
        where: { id: projectId },
        include: {
            tasks: {
                include: { assignedAgent: true },
                orderBy: { sequence: "asc" }
            }
        }
    });

    if (!project) return;

    // Filter ONLY tasks that have an Explicit Agent defined, as per OpenClaw PRD.
    const assignedTasks = project.tasks.filter(t => t.assignedAgent !== null);

    if (assignedTasks.length === 0) {
        console.warn("[OpenClaw Hub] Projeto não possui tarefas vinculadas a agentes explícitos. Ignorando dispatch via Push (cairão na Caçamba de Pull).");
        return;
    }

    const payload: OpenClawSprintPayload = {
        sprintName: project.name,
        context: project.documentation || "",
        tasks: assignedTasks.map(t => ({
            agent: t.assignedAgent!.code, // Agent SLUG or CODE
            action: t.title
        }))
    };

    console.log(`[OpenClaw Hub] Disparando Sprint Push POST -> ${baseUrl}/api/sprint`);

    try {
        const response = await fetch(`${baseUrl}/api/sprint`, {
            method: "POST",
            headers: {
                "Authorization": `ApiKey ${apiKey}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify(payload)
        });

        const json = await response.json().catch(() => null);

        if (!response.ok) {
            console.error(`[OpenClaw Hub] Erro da API do OpenClaw. Status: ${response.status}`, json);
        } else {
            console.log(`[OpenClaw Hub] Sucesso no Push do Projeto ${project.code}. Tarefas criadas no Workspace:`, json?.summary?.created);
        }
    } catch (e) {
         console.error("[OpenClaw Hub] Falha Crítica ao contatar Servidor Master do OpenClaw:", e);
    }
}

/**
 * Busca a lista de agentes dinamicamente da API do OpenClaw.
 */
export async function fetchOpenClawAgents() {
    const apiKey = process.env.OPENCLAW_API_KEY;
    const baseUrl = process.env.OPENCLAW_BASE_URL || "https://dashboard.fbrapps.com";

    if (!apiKey) {
        console.warn("[OpenClaw Hub] API Key não detectada para busca de agentes.");
        return null;
    }

    try {
        const response = await fetch(`${baseUrl}/api/agents`, {
            headers: {
                "Authorization": `ApiKey ${apiKey}`,
                "Accept": "application/json"
            }
        });

        if (!response.ok) {
            const errorBody = await response.text().catch(() => "Sem corpo de erro");
            console.error(`[OpenClaw Hub] Erro ao buscar agentes. Status: ${response.status}`, {
                url: `${baseUrl}/api/agents`,
                response: errorBody
            });
            return null;
        }

        const data = await response.json();
        console.log("[OpenClaw Hub] Resposta bruta da API:", JSON.stringify(data).substring(0, 200));

        // Tenta encontrar o array de agentes em diferentes formatos
        const agents = Array.isArray(data) ? data : (data.agents || data.data || data.list || null);
        
        if (!agents) {
            console.warn("[OpenClaw Hub] Nenhum array de agentes encontrado na resposta da API.");
        } else {
            console.log(`[OpenClaw Hub] Sucesso: ${agents.length} agentes detectados na API.`);
        }

        return agents;
    } catch (e) {
        console.error("[OpenClaw Hub] Falha Crítica ao conectar para buscar lista de agentes:", e);
        return null;
    }
}
