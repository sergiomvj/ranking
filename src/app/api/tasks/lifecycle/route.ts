import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { taskId, agentCode, action, notes } = body;

    if (!taskId || !agentCode || !action) {
      return NextResponse.json({ error: "taskId, agentCode, and action are required" }, { status: 400 });
    }

    const agent = await prisma.agent.findUnique({ where: { code: agentCode } });
    if (!agent) {
       return NextResponse.json({ error: "Agent not found" }, { status: 404 });
    }

    let nextStatus = "in_progress";
    let eventType = "accepted_by_agent";

    if (action === "ACCEPT") {
       nextStatus = "in_progress";
       eventType = "accepted_by_agent";
    } else if (action === "ISSUE") {
       nextStatus = "blocked";
       eventType = "issue_reported";
    } else if (action === "FINISH") {
       nextStatus = "completed";
       eventType = "finished";
       
       // IDEAL: Se tiver Integração com o Agente Efficiency Hub,
       // poderiamos disparar processTaskIngestion() daqui!
    } else {
       return NextResponse.json({ error: "Invalid action type (ACCEPT|ISSUE|FINISH)" }, { status: 400 });
    }

    const updatedTask = await prisma.projectTask.update({
      where: { id: taskId },
      data: { status: nextStatus }
    });

    await prisma.taskLifecycleEvent.create({
      data: {
        taskId: taskId,
        agentId: agent.id,
        eventType,
        notes: notes || `Action ${action} executed by agent.`
      }
    });

    return NextResponse.json({ message: "Task updated", task: updatedTask }, { status: 200 });

  } catch (err: any) {
    console.error("Task Lifecycle Error:", err);
    return NextResponse.json({ error: "Internal Error" }, { status: 500 });
  }
}
