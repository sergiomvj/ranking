"use server";
import { prisma } from "../prisma";
import { revalidatePath } from "next/cache";

export async function getPendingConsequences() {
  const events = await prisma.consequenceEvent.findMany({
    where: { status: "suggested" },
    include: {
      agent: true,
      rule: true,
      period: true
    },
    orderBy: { triggeredAt: "desc" }
  });

  return { events };
}

export async function resolveConsequence(eventId: string, approve: boolean) {
  const status = approve ? "adopted" : "dismissed";
  await prisma.consequenceEvent.update({
    where: { id: eventId },
    data: {
      status: status as any, 
      confirmedByUserId: approve ? "uuid-mock-admin-1234" : null,
      confirmedAt: approve ? new Date() : null,
      dismissedByUserId: !approve ? "uuid-mock-admin-1234" : null,
      dismissedAt: !approve ? new Date() : null,
    } as any
  });

  revalidatePath("/audit");
}
