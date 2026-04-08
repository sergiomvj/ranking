"use server";

import { prisma } from "../prisma";

export async function getDashboardOverview(periodCode: string) {
  try {
    const period = await prisma.evaluationPeriod.findUnique({
    where: { code: periodCode },
  });

  if (!period) return null;

  // 1. Contagem de Agentes ativos no período (Que possuem um scorecard)
  const agentCount = await prisma.periodScorecard.count({
    where: { periodId: period.id },
  });

  // 2. Total de execuções processadas no período
  const totalExecutions = await prisma.taskExecution.count({
    where: {
      startedAt: { gte: period.startsAt, lte: period.endsAt },
    },
  });

  // 3. Distribuição por Banda Operacional (Green, Yellow, Orange, Red)
  const bandsDistributionRaw = await prisma.periodScorecard.groupBy({
    by: ["operationalBand"],
    where: { periodId: period.id },
    _count: { agentId: true },
  });

  const bandsDistribution = {
    green: bandsDistributionRaw.find((b) => b.operationalBand === "green")?._count.agentId || 0,
    yellow: bandsDistributionRaw.find((b) => b.operationalBand === "yellow")?._count.agentId || 0,
    orange: bandsDistributionRaw.find((b) => b.operationalBand === "orange")?._count.agentId || 0,
    red: bandsDistributionRaw.find((b) => b.operationalBand === "red")?._count.agentId || 0,
  };

  // 4. Top 5 Agents no Ranking
  const topAgentsScorecards = await prisma.periodScorecard.findMany({
    where: { periodId: period.id },
    orderBy: { rankPosition: "asc" },
    take: 5,
    include: { agent: true },
  });

  const topAgents = topAgentsScorecards.map((sc) => ({
    id: sc.agentId,
    code: sc.agent?.code || "",
    displayName: sc.agent?.displayName || "",
    score: sc.scoreValue,
    rank: sc.rankPosition,
    band: sc.operationalBand,
  }));

  // 5. Bottom 5 Agents (Needs Attention)
  const bottomAgentsScorecards = await prisma.periodScorecard.findMany({
    where: { periodId: period.id },
    orderBy: { rankPosition: "desc" },
    take: 5,
    include: { agent: true },
  });
  
  const bottomAgents = bottomAgentsScorecards.map((sc) => ({
    id: sc.agentId,
    code: sc.agent?.code || "",
    displayName: sc.agent?.displayName || "",
    score: sc.scoreValue,
    rank: sc.rankPosition,
    band: sc.operationalBand,
  })).reverse(); // Reverse para o pior ficar no final ou manter ordenado? Depende da UI.

  return {
    period: {
      code: period.code,
      type: period.periodType,
      isClosed: period.isClosed,
    },
    agentCount,
    totalExecutions,
    bandsDistribution,
    topAgents,
    bottomAgents,
  };
  } catch (error) {
    console.error("Database connection failed:", error);
    return null;
  }
}
