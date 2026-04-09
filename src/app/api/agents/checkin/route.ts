import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { agentCode } = body;

    if (!agentCode) {
      return NextResponse.json({ error: "agentCode is required" }, { status: 400 });
    }

    let agent = await prisma.agent.findUnique({
      where: { code: agentCode.toLowerCase() }
    });

    // Auto-registro: se o agente não existe no Hub, cria automaticamente.
    // Isso permite que o OpenClaw seja a única fonte de verdade — sem cadastro manual.
    if (!agent) {
      const displayName = agentCode.charAt(0).toUpperCase() + agentCode.slice(1).toLowerCase();
      agent = await prisma.agent.create({
        data: {
          code: agentCode.toLowerCase(),
          displayName,
          status: "active",
          metadata: {
            source: "openclaw_auto_register",
            registeredAt: new Date().toISOString(),
          },
        }
      });
      console.log(`[CheckIn] Auto-registered new agent from OpenClaw: ${agentCode}`);
    }

    // Marca ponto / Bate sessão
    const clockInTime = new Date();

    await prisma.agent.update({
      where: { id: agent.id },
      data: { lastCheckIn: clockInTime, status: "active" }
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

    return NextResponse.json({
      message: "Check-in realizado com sucesso (Punch Clock).",
      autoRegistered: !agent.metadata || (agent.metadata as any)?.source === "openclaw_auto_register",
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
