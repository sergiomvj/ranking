import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { agentCode } = body;

    if (!agentCode) {
      return NextResponse.json({ error: "agentCode is required" }, { status: 400 });
    }

    const agent = await prisma.agent.findUnique({
       where: { code: agentCode }
    });

    if (!agent) {
       return NextResponse.json({ error: "Agent not found" }, { status: 404 });
    }

    // Marca ponto / Bate sessão
    const clockInTime = new Date();
    
    await prisma.agent.update({
        where: { id: agent.id },
        data: { lastCheckIn: clockInTime }
    });

    await prisma.agentSession.create({
        data: {
            agentId: agent.id,
            clockInAt: clockInTime,
            status: "active",
            notes: agent.managerNotes
        }
    });

    // Pega TODAS as tarefas que estão no radar desse Agente
    const activeTasks = await prisma.projectTask.findMany({
        where: {
            status: { in: ["backlog", "assigned", "in_progress", "blocked"] },
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
        orderBy: { sequence: "asc" },
        include: {
           project: { select: { code: true, name: true, documentation: true } }
        }
    });

    // Auto-tranca as do Backlog e Assigned para 'in_progress' se for puxá-las todas? 
    // Pro MVP de Shift, devolvemos a lista para o bot priorizar. O Bot pode dar ACCEPT em 1 de cada vez se a inteligência dele for seqüencial.

    return NextResponse.json({ 
        message: "Check-in realizado com sucesso (Punch Clock).",
        agent: {
            code: agent.code,
            displayName: agent.displayName,
            directivesOfTheDay: agent.managerNotes,
            shiftStart: clockInTime
        },
        pendingTasks: activeTasks.map(t => ({
            taskId: t.id,
            title: t.title,
            status: t.status,
            projectContext: t.project.documentation,
            projectName: t.project.name
        }))
    }, { status: 200 });

  } catch (err: any) {
    console.error("Agent Checkin Error:", err);
    return NextResponse.json({ error: "Internal Error" }, { status: 500 });
  }
}
