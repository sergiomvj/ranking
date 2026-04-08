"use server";
import { prisma } from "../prisma";

export async function getPeriodRankings(periodCode: string) {
  const period = await prisma.evaluationPeriod.findUnique({ where: { code: periodCode } });
  if (!period) return { period: null, rankings: [] };

  const scorecards = await prisma.periodScorecard.findMany({
    where: { periodId: period.id },
    orderBy: { rankPosition: "asc" },
    include: { agent: true }
  });

  return { period, rankings: scorecards };
}

export async function getAgentProfile(agentCode: string, periodCode?: string) {
  const agent = await prisma.agent.findUnique({
    where: { code: agentCode }
  });

  if (!agent) return null;

  let teamDesc = "Sem Squad";
  if (agent.owningTeamId) {
     const t = await prisma.team.findUnique({ where: { id: agent.owningTeamId } });
     if (t) teamDesc = t.name;
  }
  let funcDesc = "Generic";
  if (agent.primaryFunctionId) {
     const f = await prisma.functionCatalog.findUnique({ where: { id: agent.primaryFunctionId } });
     if (f) funcDesc = f.name;
  }

  const badgesAwarded = await prisma.badgeAward.findMany({
      where: { agentId: agent.id },
      include: { badge: true }
  });
  
  const consequenceEvents = await prisma.consequenceEvent.findMany({
      where: { agentId: agent.id },
      include: { rule: true },
      orderBy: { triggeredAt: "desc" },
      take: 5
  });

  let scorecard = null;
  if (periodCode) {
    const p = await prisma.evaluationPeriod.findUnique({ where: { code: periodCode } });
    if (p) {
      scorecard = await prisma.periodScorecard.findFirst({
        where: { agentId: agent.id, periodId: p.id }
      });
    }
  } else {
    scorecard = await prisma.periodScorecard.findFirst({
      where: { agentId: agent.id }
    });
  }

  const recentExecutions = await prisma.taskExecution.findMany({
    where: { agentId: agent.id },
    orderBy: { startedAt: "desc" },
    take: 15
  });

  return { agent, teamDesc, funcDesc, badgesAwarded, consequenceEvents, scorecard, recentExecutions };
}
