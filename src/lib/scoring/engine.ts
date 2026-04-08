import { prisma } from "../prisma";
import { ScoreStatus } from "@prisma/client";

/**
 * Agrega e "calcula" notas para TaskExecutions pendentes num dado período.
 * Numa implementação real, este motor buscaria o payload LLM, passaria pela ScoringPolicy
 * e geraria N linhas em ExecutionMetricScore. Para o MVP, simula a pontuação.
 */
export async function processPendingTaskExecutions(periodCode: string) {
  const period = await prisma.evaluationPeriod.findUnique({
    where: { code: periodCode },
  });
  if (!period) throw new Error("Período não encontrado");

  // No PRD, a agregação processa execuções
  const pendingExecutions = await prisma.taskExecution.findMany({
    where: {
      startedAt: { gte: period.startsAt, lte: period.endsAt },
      scoreStatus: ScoreStatus.provisional,
    },
  });

  let processedCount = 0;
  for (const exec of pendingExecutions) {
    // Simular processamento (Score de 65 a 100)
    const randomScore = Math.floor(Math.random() * 36) + 65;

    await prisma.taskExecution.update({
      where: { id: exec.id },
      data: {
        scoreStatus: ScoreStatus.published,
      },
    });

    // Simulando que inserimos pelo menos uma nota base de métrica (Ex: "completion")
    const metric = await prisma.metricCatalog.findFirst();
    if (metric) {
      await prisma.executionMetricScore.create({
        data: {
          executionId: exec.id,
          metricId: metric.id,
          rawValue: randomScore,
          normalizedValue: randomScore,
        },
      });
    }

    processedCount++;
  }

  return { period: periodCode, processedCount };
}

/**
 * Fecha um período: Calcula notas agregadas dos agents, cria PeriodScorecards e distribui Tiers/Badges.
 */
export async function closeEvaluationPeriod(periodCode: string) {
  const period = await prisma.evaluationPeriod.findUnique({ where: { code: periodCode } });
  if (!period) throw new Error("Período não encontrado");
  if (period.isClosed) throw new Error("Período já está fechado.");

  // Política padrão ativa v1
  const policyVersion = await prisma.scoringPolicyVersion.findUnique({
    where: { policyId_versionNumber: { policyId: "default-v1", versionNumber: 1 } } // baseamos no construtor do DB
  });
  
  // Nota: se policyVersion for nulo, a migration/seed não rodou ou o ID mudou.
  // Pular verificação complexa para MVP.
  const polVerId = policyVersion?.id ?? "1"; 

  // Puxa execuções calculadas ou aprovadas no período
  const executions = await prisma.taskExecution.findMany({
    where: {
      startedAt: { gte: period.startsAt, lte: period.endsAt },
      scoreStatus: { in: [ScoreStatus.provisional, ScoreStatus.published] },
    },
    include: { metricScores: true },
  });

  // Agrupamento manual básico por Agente
  const agentMap = new Map<string, { totalScore: number, count: number }>();
  
  for (const exec of executions) {
    if (!exec.agentId) continue;
    let sumMetric = 0;
    if (exec.metricScores.length > 0) {
      sumMetric = exec.metricScores.map(m => Number(m.normalizedValue)).reduce((a, b) => a + b, 0) / exec.metricScores.length;
    } else {
      sumMetric = 80; // fallback se não tiver metrics e for calculated
    }
    
    const curr = agentMap.get(exec.agentId) || { totalScore: 0, count: 0 };
    curr.totalScore += sumMetric;
    curr.count += 1;
    agentMap.set(exec.agentId, curr);
  }

  // Atualiza ou cria PeriodScorecards
  const agentArray = Array.from(agentMap.entries());
  // Sorting to determine Rank position
  agentArray.sort((a, b) => (b[1].totalScore / b[1].count) - (a[1].totalScore / a[1].count));

  for (let i = 0; i < agentArray.length; i++) {
    const [agentId, data] = agentArray[i];
    const finalScore = data.totalScore / data.count;

    let band = "red";
    if (finalScore >= 80) band = "green";
    else if (finalScore >= 65) band = "yellow";
    else if (finalScore >= 50) band = "orange";

    await prisma.periodScorecard.upsert({
      where: {
        periodId_agentId_publicationVersion: { periodId: period.id, agentId, publicationVersion: 1 }
      },
      create: {
        periodId: period.id,
        agentId: agentId,
        policyVersionId: policyVersion?.id!, // MVP forces not null
        scoreValue: parseFloat(finalScore.toFixed(2)),
        sampleSize: data.count,
        eligibleTaskCount: data.count,
        scoreStatus: "published",
        publicationVersion: 1,
        rankPosition: i + 1,
        operationalBand: band,
        confidenceIndex: data.count > 5 ? 1.0 : 0.5,
      },
      update: {
        scoreValue: parseFloat(finalScore.toFixed(2)),
        sampleSize: data.count,
        eligibleTaskCount: data.count,
        rankPosition: i + 1,
        operationalBand: band,
      }
    });
  }

  // Fecha o período
  await prisma.evaluationPeriod.update({
    where: { id: period.id },
    data: { isClosed: true }
  });

  return { message: "Período fechado", processedAgents: agentArray.length };
}
