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
      if (expr?.field === "period_score" && evaluateCondition(expr, card.scoreValue)) {
        
        // Evita duplicatas
        const existingInfo = await prisma.consequenceEvent.findFirst({
          where: { periodId: period.id, agentId: card.agentId, consequenceRuleId: rule.id }
        });

        if (!existingInfo) {
          await prisma.consequenceEvent.create({
            data: {
              periodId: period.id,
              agentId: card.agentId,
              consequenceRuleId: rule.id,
              status: rule.requiresHumanConfirmation ? ConsequenceStatus.pending_review : ConsequenceStatus.applied,
              generatedAt: new Date(),
              metadata: { sourceScore: card.scoreValue },
            }
          });
          consequencesGenerated++;
        }
      }
    }

    // 2. Avalia Meritocracia e Badges
    for (const bRule of badgeRules) {
      const expr = bRule.ruleExpression as any;
      
      if (expr?.type === "score_threshold" && expr?.field === "period_score" && evaluateCondition(expr, card.scoreValue)) {
        
        const existingBadge = await prisma.badgeAward.findFirst({
          where: { awardedPeriodId: period.id, agentId: card.agentId, badgeId: bRule.badgeId }
        });

        if (!existingBadge) {
          await prisma.badgeAward.create({
            data: {
              agentId: card.agentId,
              badgeId: bRule.badgeId,
              awardedPeriodId: period.id,
              status: bRule.badge.isManualValidationRequired ? BadgeAwardStatus.pending_validation : BadgeAwardStatus.granted,
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
