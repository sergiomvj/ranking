"use server";

import { prisma } from "../../lib/prisma";
import { revalidatePath } from "next/cache";
import { serializePrisma } from "../../lib/utils/serialization";

export async function getAllAgentsWithSessions() {
  const agents = await prisma.agent.findMany({
    orderBy: { displayName: "asc" },
    include: {
      sessions: {
        orderBy: { clockInAt: "desc" },
        take: 1
      }
    }
  });
  return serializePrisma(agents);
}

export async function updateManagerNotesAction(agentId: string, notes: string) {
  await prisma.agent.update({
    where: { id: agentId },
    data: { managerNotes: notes }
  });
  revalidatePath("/timeclock");
}
