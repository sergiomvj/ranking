import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";

// GET /api/tasks/poll?agent=MILA-01
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const agentCode = searchParams.get("agent");

    if (!agentCode) {
      return NextResponse.json({ error: "agent parameter is required" }, { status: 400 });
    }

    // Identificar o Agente no sistema
    const agent = await prisma.agent.findUnique({
      where: { code: agentCode }
    });

    if (!agent) {
      return NextResponse.json({ error: "Agent not found" }, { status: 404 });
    }

    // Busca a 1ª tarefa mais urgente/antiga no Backlog Designada para ele
    // Para simplificar, pegamos a mais antiga em status 'backlog' (FIFO)
    let task = await prisma.projectTask.findFirst({
      where: {
        status: "backlog",
        OR: [
          { assignedAgentId: agent.id },
          { 
            assignedAgentId: null, 
            project: {
              members: {
                some: { id: agent.id }
              }
            }
          }
        ]
      },
      orderBy: { createdAt: "asc" },
      include: {
        project: { select: { documentation: true, name: true, code: true } }
      }
    });

    // Se houver uma tarefa, faz o Lock automático para 'assigned'
    if (task) {
      task = await prisma.projectTask.update({
         where: { id: task.id },
         data: { status: "assigned" },
         include: { project: { select: { documentation: true, name: true, code: true } } }
      });

      // Cria registro de ciclo de vida
      await prisma.taskLifecycleEvent.create({
        data: {
          taskId: task.id,
          agentId: agent.id,
          eventType: "assigned",
          notes: "Task polled and auto-assigned by chron."
        }
      });

      return NextResponse.json({
        message: "New task assigned",
        task: {
          id: task.id,
          title: task.title,
          projectCode: task.project.code,
          projectName: task.project.name,
          documentation: task.project.documentation // Anexo Contextual pra I.A
        }
      }, { status: 200 });
    }

    return NextResponse.json({ message: "No tasks available" }, { status: 200 });

  } catch (err: any) {
    console.error("Task Poll Error:", err);
    return NextResponse.json({ error: "Internal Error" }, { status: 500 });
  }
}
