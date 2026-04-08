import { prisma } from "../prisma";
import crypto from "crypto";

export interface ParsedTask {
  title: string;
  isCompleted: boolean;
  assignedAgentCode?: string;
  assignedTeamCode?: string;
  phase?: string; // Título do Header (## Phase 1) se aplicável
}

/**
 * Lê o texto Markdown do TASKLIST e extrai tarefas do tipo checklist (- [ ] task)
 */
export function parseTaskListMarkdown(markdown: string): ParsedTask[] {
  const lines = markdown.split("\n");
  const tasks: ParsedTask[] = [];
  let currentPhase = "General";

  for (const line of lines) {
    const trimmed = line.trim();
    
    // Detecta Cabeçalhos (Fases)
    if (trimmed.startsWith("#")) {
      currentPhase = trimmed.replace(/^#+\s/, "");
      continue;
    }

    // Detecta Tarefas de CheckList
    const isTaskItem = trimmed.match(/^- \[([ xX])\] (.*)/);
    if (isTaskItem) {
      const isCompleted = isTaskItem[1].toLowerCase() === "x";
      let title = isTaskItem[2];

      // Detecta @AgentCode (Exemplo: "Finalizar copy @MILA-01")
      let assignedAgentCode = undefined;
      const agentMatch = title.match(/@([A-Z0-9-]+)/);
      if (agentMatch) {
        assignedAgentCode = agentMatch[1];
        // Remove a tag do título
        title = title.replace(agentMatch[0], "").trim();
      }

      tasks.push({
        title,
        isCompleted,
        assignedAgentCode,
        phase: currentPhase,
      });
    }
  }

  return tasks;
}

/**
 * Pega as tarefas em string markdown e as injeta diretamente no Projeto no DB.
 */
export async function injectTasksIntoProject(projectId: string, markdown: string) {
  const parsedTasks = parseTaskListMarkdown(markdown);
  if (parsedTasks.length === 0) return { count: 0 };

  // Buscar cache de agentes para resolver os IDs
  const activeAgents = await prisma.agent.findMany({ select: { id: true, code: true } });
  const getAgentId = (code?: string) => activeAgents.find(a => a.code === code)?.id;

  let injectedCount = 0;

  for (const t of parsedTasks) {
    await prisma.projectTask.create({
      data: {
        projectId,
        title: `[${t.phase}] ${t.title}`,
        status: t.isCompleted ? "completed" : "backlog",
        assignedAgentId: getAgentId(t.assignedAgentCode) || null,
        // Criticalidade e complexidade por padrão para tarefas inferidas
        criticality: "medium",
        complexity: "standard",
      }
    });
    injectedCount++;
  }

  return { count: injectedCount, tasks: parsedTasks };
}
