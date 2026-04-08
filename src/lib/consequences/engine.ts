import { prisma } from "../prisma";
import { BadgeAwardStatus, ConsequenceStatus } from "@prisma/client";

function evaluateCondition(expression: any, score: number): boolean {
  if (!expression || !expression.operator || expression.value === undefined) return false;
  const val = Number(expression.value);

  switch (expression.operator) {
    case "gte": return score >= val;
    case "lte": return score <= val;
    case "gt": return score > val;
    case "lt": return score < val;
    case "eq": return score === val;
    default: return false;
  }
}

/**
 * Processo assíncrono varre os Scorecards de um período e aplica regras de
 * Consequências (Alertas, Suspensões) e Regras de Concessão de Badges (Ouro, Diamante, etc).
 */
export async function processPeriodConsequences(periodCode: string) {
  const period = await prisma.evaluationPeriod.findUnique({ where: { code: periodCode } });
  if (!period) throw new Error("Período não encontrado");

  // Busca do BD
  const scorecards = await prisma.periodScorecard.findMany({
    where: { periodId: period.id }
  });

  const consequenceRules = await prisma.consequenceRule.findMany({
    where: { isActive: true }
  });

  const badgeRules = await prisma.badgeRule.findMany({
    include: { badge: true }
  });

  let consequencesGenerated = 0;
  let badgesAwarded = 0;

  for (const card of scorecards) {
    // 1. Avalia Consequências Disciplinares ou de Promoção
    for (const rule of consequenceRules) {
      const expr = rule.triggerExpression as any;
      if (expr?.field === "period_score" && evaluateCondition(expr, Number(card.scoreValue))) {
        
        // Evita duplicatas
        const existingInfo = await prisma.consequenceEvent.findFirst({
          where: { periodId: period.id, agentId: card.agentId, ruleId: rule.id }
        });

        if (!existingInfo) {
          await prisma.consequenceEvent.create({
            data: {
              periodId: period.id,
              agentId: card.agentId,
              ruleId: rule.id,
              status: rule.requiresHumanConfirmation ? ConsequenceStatus.suggested : ConsequenceStatus.applied,
              triggeredAt: new Date(),
              payload: { sourceScore: Number(card.scoreValue) },
            } as any
          });
          consequencesGenerated++;
        }
      }
    }

    // 2. Avalia Meritocracia e Badges
    for (const bRule of badgeRules) {
      const expr = bRule.ruleExpression as any;
      
      if (expr?.type === "score_threshold" && expr?.field === "period_score" && evaluateCondition(expr, Number(card.scoreValue))) {
        
        const existingBadge = await prisma.badgeAward.findFirst({
          where: { periodId: period.id, agentId: card.agentId, badgeId: bRule.badgeId }
        });

        if (!existingBadge) {
          await prisma.badgeAward.create({
            data: {
              agentId: card.agentId,
              badgeId: bRule.badgeId,
              periodId: period.id,
              awardStatus: BadgeAwardStatus.active,
              awardedAt: new Date(),
            }
          });
          badgesAwarded++;
        }
      }
    }
  }

  return { period: periodCode, consequencesGenerated, badgesAwarded };
}
