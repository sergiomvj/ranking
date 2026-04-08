"use server";

import { prisma } from "../../lib/prisma";
import { revalidatePath } from "next/cache";

export async function getAllAgentsWithSessions() {
  return await prisma.agent.findMany({
    orderBy: { displayName: "asc" },
    include: {
      sessions: {
        orderBy: { clockInAt: "desc" },
        take: 1
      }
    }
  });
}

export async function updateManagerNotesAction(agentId: string, notes: string) {
  await prisma.agent.update({
    where: { id: agentId },
    data: { managerNotes: notes }
  });
  revalidatePath("/timeclock");
}
