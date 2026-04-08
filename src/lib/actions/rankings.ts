"use server";
import { prisma } from "../prisma";

export async function getPeriodRankings(periodCode: string) {
  const period = await prisma.evaluationPeriod.findUnique({ where: { code: periodCode } });
  if (!period) return { period: null, rankings: [] };

  const scorecards = await prisma.periodScorecard.findMany({
    where: { periodId: period.id },
    orderBy: { rankPosition: "asc" },
    include: {
      agent: {
        include: { owningTeam: true, primaryFunction: true },
      },
    },
  });

  return { period, rankings: scorecards };
}

export async function getAgentProfile(agentCode: string, periodCode?: string) {
  const agent = await prisma.agent.findUnique({
    where: { code: agentCode },
    include: {
      owningTeam: true,
      primaryFunction: true,
      badgesAwarded: {
        include: { badge: true },
        where: { status: "granted" },
      },
      consequenceEvents: {
        include: { rule: true },
        orderBy: { generatedAt: "desc" },
        take: 5
      }
    },
  });

  if (!agent) return null;

  let scorecard = null;
  if (periodCode) {
    const p = await prisma.evaluationPeriod.findUnique({ where: { code: periodCode } });
    if (p) {
      scorecard = await prisma.periodScorecard.findFirst({
        where: { agentId: agent.id, periodId: p.id },
        include: { period: true },
      });
    }
  } else {
    scorecard = await prisma.periodScorecard.findFirst({
      where: { agentId: agent.id },
      orderBy: { period: { endsAt: "desc" } },
      include: { period: true },
    });
  }

  const recentExecutions = await prisma.taskExecution.findMany({
    where: { agentId: agent.id },
    orderBy: { startedAt: "desc" },
    take: 15,
    include: { taskType: true },
  });

  return { agent, scorecard, recentExecutions };
}
