import "dotenv/config";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Iniciando seed do banco de dados...");

  // -----------------------------------------------------------
  // 1. Métricas padrão (10 critérios do PRD)
  // -----------------------------------------------------------
  const metrics = [
    { code: "completion",   name: "Conclusão da Tarefa",       defaultWeight: 0.20 },
    { code: "adherence",    name: "Aderência às Instruções",   defaultWeight: 0.15 },
    { code: "quality",      name: "Qualidade da Saída",        defaultWeight: 0.15 },
    { code: "precision",    name: "Precisão / Confiabilidade", defaultWeight: 0.20 },
    { code: "deadline",     name: "Cumprimento de Prazo",      defaultWeight: 0.10 },
    { code: "efficiency",   name: "Eficiência de Recursos",    defaultWeight: 0.05 },
    { code: "autonomy",     name: "Autonomia",                 defaultWeight: 0.05 },
    { code: "consistency",  name: "Consistência Histórica",    defaultWeight: 0.05 },
    { code: "handoff",      name: "Qualidade do Handoff",      defaultWeight: 0.03 },
    { code: "evolution",    name: "Evolução Contínua",         defaultWeight: 0.02 },
  ];

  for (const m of metrics) {
    await prisma.metricCatalog.upsert({
      where: { code: m.code },
      update: {},
      create: {
        code: m.code,
        name: m.name,
        defaultWeight: m.defaultWeight,
        description: `Critério: ${m.name}`,
        minValue: 0,
        maxValue: 100,
        scoreDirection: "higher_is_better",
        isActive: true,
      },
    });
  }
  console.log(`  ✅ ${metrics.length} métricas criadas`);

  // -----------------------------------------------------------
  // 2. Tipos de tarefa padrão
  // -----------------------------------------------------------
  const taskTypes = [
    { code: "generic",    name: "Tarefa Genérica",    defaultCriticality: "medium" as const, defaultComplexity: "standard" as const },
    { code: "analysis",   name: "Análise",            defaultCriticality: "high" as const,   defaultComplexity: "complex" as const   },
    { code: "development",name: "Desenvolvimento",    defaultCriticality: "high" as const,   defaultComplexity: "complex" as const   },
    { code: "review",     name: "Revisão",            defaultCriticality: "medium" as const, defaultComplexity: "standard" as const  },
    { code: "support",    name: "Suporte",            defaultCriticality: "medium" as const, defaultComplexity: "simple" as const    },
    { code: "strategy",   name: "Estratégia",         defaultCriticality: "critical" as const, defaultComplexity: "exceptional" as const },
  ];

  for (const tt of taskTypes) {
    await prisma.taskType.upsert({
      where: { code: tt.code },
      update: {},
      create: {
        code: tt.code,
        name: tt.name,
        defaultCriticality: tt.defaultCriticality,
        defaultComplexity: tt.defaultComplexity,
        isActive: true,
      },
    });
  }
  console.log(`  ✅ ${taskTypes.length} tipos de tarefa criados`);

  // -----------------------------------------------------------
  // 3. Política padrão v1 com pesos do PRD
  // -----------------------------------------------------------
  const policy = await prisma.scoringPolicy.upsert({
    where: { code: "default-v1" },
    update: {},
    create: {
      code: "default-v1",
      name: "Política Padrão v1",
      description: "Política oficial baseada nos critérios do PRD – Agent Efficiency Hub",
      isActive: true,
    },
  });

  const policyVersion = await prisma.scoringPolicyVersion.upsert({
    where: { policyId_versionNumber: { policyId: policy.id, versionNumber: 1 } },
    update: {},
    create: {
      policyId: policy.id,
      versionNumber: 1,
      status: "published",
      validFrom: new Date(),
      rationale: "Versão inicial publicada no seed",
      publishedAt: new Date(),
    },
  });

  // Associar pesos às métricas na policy version
  const metricRecords = await prisma.metricCatalog.findMany();
  for (const metric of metricRecords) {
    const m = metrics.find((x) => x.code === metric.code);
    if (!m) continue;
    const existingWeight = await prisma.scoringPolicyMetricWeight.findFirst({
      where: { policyVersionId: policyVersion.id, metricId: metric.id, functionId: null },
    });
    if (!existingWeight) {
      await prisma.scoringPolicyMetricWeight.create({
        data: {
          policyVersionId: policyVersion.id,
          metricId: metric.id,
          weight: m.defaultWeight,
          isRequired: true,
        },
      });
    }
  }

  // Thresholds por faixa de badge
  const thresholds = [
    { code: "bronze_min",   value: 65, description: "Score mínimo para badge Bronze" },
    { code: "silver_min",   value: 75, description: "Score mínimo para badge Silver" },
    { code: "gold_min",     value: 85, description: "Score mínimo para badge Gold" },
    { code: "platinum_min", value: 92, description: "Score mínimo para badge Platinum" },
    { code: "diamond_min",  value: 97, description: "Score mínimo para badge Diamond" },
    { code: "min_sample",   value: 5,  description: "Volume mínimo de tarefas para entrar no ranking" },
    { code: "red_band_max", value: 50, description: "Score abaixo disso vai para faixa vermelha" },
    { code: "orange_band_max", value: 65, description: "Score abaixo disso vai para faixa laranja" },
    { code: "yellow_band_max", value: 80, description: "Score abaixo disso vai para faixa amarela" },
  ];

  for (const t of thresholds) {
    await prisma.scoringPolicyThreshold.upsert({
      where: { policyVersionId_thresholdCode: { policyVersionId: policyVersion.id, thresholdCode: t.code } },
      update: {},
      create: {
        policyVersionId: policyVersion.id,
        thresholdCode: t.code,
        thresholdValue: t.value,
        description: t.description,
      },
    });
  }
  console.log("  ✅ Política v1 publicada com pesos e thresholds");

  // -----------------------------------------------------------
  // 4. Badges (Bronze→Diamond + 8 especiais)
  // -----------------------------------------------------------
  const badges = [
    // Faixas de score
    { code: "bronze",    name: "Bronze",               badgeCategory: "tier",    description: "Score entre 65 e 74",              isManualValidationRequired: false },
    { code: "silver",    name: "Silver",               badgeCategory: "tier",    description: "Score entre 75 e 84",              isManualValidationRequired: false },
    { code: "gold",      name: "Gold",                 badgeCategory: "tier",    description: "Score entre 85 e 91",              isManualValidationRequired: false },
    { code: "platinum",  name: "Platinum",             badgeCategory: "tier",    description: "Score entre 92 e 96",              isManualValidationRequired: false },
    { code: "diamond",   name: "Diamond",              badgeCategory: "tier",    description: "Score 97 ou mais",                 isManualValidationRequired: false },
    // Badges especiais
    { code: "zero_abandonment",   name: "Zero Abandonment",   badgeCategory: "special", description: "Nenhuma tarefa abandonada no período", isManualValidationRequired: false },
    { code: "precision_master",   name: "Precision Master",   badgeCategory: "special", description: "Score de precisão 95+ no período",     isManualValidationRequired: false },
    { code: "first_pass_approved",name: "First Pass Approved",badgeCategory: "special", description: "90%+ das tarefas aprovadas de primeira",isManualValidationRequired: false },
    { code: "fast_finisher",      name: "Fast Finisher",      badgeCategory: "special", description: "Prazo cumprido em 95%+ das tarefas",   isManualValidationRequired: false },
    { code: "critical_ops",       name: "Critical Ops",       badgeCategory: "special", description: "Alta performance em tarefas críticas",  isManualValidationRequired: false },
    { code: "best_handoff",       name: "Best Handoff",       badgeCategory: "special", description: "Score de handoff 95+ no período",       isManualValidationRequired: false },
    { code: "most_improved",      name: "Most Improved",      badgeCategory: "special", description: "Maior evolução de score no período",     isManualValidationRequired: true  },
    { code: "trusted_performer",  name: "Trusted Performer",  badgeCategory: "special", description: "3+ ciclos consecutivos acima de 85",    isManualValidationRequired: false },
  ];

  for (const b of badges) {
    const badge = await prisma.badgeCatalog.upsert({
      where: { code: b.code },
      update: {},
      create: {
        code: b.code,
        name: b.name,
        description: b.description,
        badgeCategory: b.badgeCategory,
        isManualValidationRequired: b.isManualValidationRequired,
        isActive: true,
        visibility: b.badgeCategory === "tier" ? "internal_wide" : "internal_wide",
      },
    });

    // Regra de badge apontando para a policy version
    if (b.badgeCategory === "tier") {
      const minThreshold = thresholds.find((t) => t.code === `${b.code}_min`);
      if (minThreshold) {
        const existingRule = await prisma.badgeRule.findFirst({
          where: { badgeId: badge.id, policyVersionId: policyVersion.id },
        });
        if (!existingRule) {
          await prisma.badgeRule.create({
            data: {
              badgeId: badge.id,
              policyVersionId: policyVersion.id,
              ruleExpression: {
                type: "score_threshold",
                field: "period_score",
                operator: "gte",
                value: minThreshold.value,
              },
              validFrom: new Date(),
            },
          });
        }
      }
    }
  }
  console.log(`  ✅ ${badges.length} badges criadas`);

  // -----------------------------------------------------------
  // 5. Teams e Funções Reais (Base FBR / ARVA)
  // -----------------------------------------------------------
  const teams = [
    { code: "MARKETING",   name: "Marketing",               description: "Equipe de Marketing e Growth" },
    { code: "TECH",        name: "Tecnologia & Dev",        description: "Engenharia e Orquestração" },
    { code: "EXEC",        name: "Diretoria & Estratégia",  description: "Inteligência Estratégica" },
    { code: "FBR_SUPPORT", name: "Suporte FBR",             description: "Atendimento e Secretariado FBR" },
    { code: "FBR_SALES",   name: "FBR Sales",               description: "Vendas e Comercial" },
    { code: "FBR_RJ",      name: "FBR - Rio de Janeiro",    description: "Operações Locais RJ" },
    { code: "ARVA",        name: "ARVA Hub",                description: "Agentes do Ecossistema ARVA" },
  ];

  for (const t of teams) {
    await prisma.team.upsert({
      where: { code: t.code },
      update: {},
      create: t,
    });
  }
  console.log(`  ✅ ${teams.length} equipes reais criadas`);

  const functions = [
    { code: "MKT_MANAGER",    name: "Marketing Manager",          description: "Gestão de Marketing" },
    { code: "ORCHESTRATOR",   name: "Orquestradora",              description: "Coordena fluxos de agentes" },
    { code: "SENIOR_DEV",     name: "Programador Sênior",         description: "Desenvolvimento avançado" },
    { code: "FRONTEND_SPEC",  name: "Frontend Specialist",        description: "Especialista em UI/UX e Frontend" },
    { code: "EXEC_ASSISTANT", name: "Executive Assistant & SI",   description: "Assistência e Inteligência Estratégica" },
    { code: "SECRETARY",      name: "Secretary",                  description: "Secretariado e Suporte" },
    { code: "SALES_MANAGER",  name: "Sales Manager",              description: "Gestão de Vendas" },
    { code: "AGENTE",         name: "Agente",                     description: "Operações de Agente Base" },
  ];

  for (const f of functions) {
    await prisma.functionCatalog.upsert({
      where: { code: f.code },
      update: {},
      create: f,
    });
  }
  console.log(`  ✅ ${functions.length} funções criadas`);

  // -----------------------------------------------------------
  // 6. Agentes da Corporação (Cadastrados na Engine)
  // -----------------------------------------------------------
  const getTeam = await prisma.team.findMany();
  const getFn = await prisma.functionCatalog.findMany();

  const tid = (code: string) => getTeam.find(t => t.code === code)?.id;
  const fid = (code: string) => getFn.find(f => f.code === code)?.id;

  const agents = [
    { code: "MILA-01",    displayName: "Mila Castro",       teamId: tid("MARKETING"),   functionId: fid("MKT_MANAGER"),    status: "active" as const },
    { code: "CHIARA-01",  displayName: "Chiara Garcia",     teamId: tid("TECH"),        functionId: fid("ORCHESTRATOR"),   status: "active" as const },
    { code: "DAVID-01",   displayName: "David Novaes",      teamId: tid("TECH"),        functionId: fid("SENIOR_DEV"),     status: "active" as const },
    { code: "LIA-01",     displayName: "Lia Salazar",       teamId: tid("TECH"),        functionId: fid("FRONTEND_SPEC"),  status: "active" as const },
    { code: "ANAB-01",    displayName: "Ana Beatriz",       teamId: tid("EXEC"),        functionId: fid("EXEC_ASSISTANT"), status: "active" as const },
    { code: "PRIS-01",    displayName: "Priscila",          teamId: tid("FBR_SUPPORT"), functionId: fid("SECRETARY"),      status: "active" as const },
    { code: "MAIA-01",    displayName: "Maia Mendes",       teamId: tid("FBR_SALES"),   functionId: fid("SALES_MANAGER"),  status: "active" as const },
    { code: "LEON-01",    displayName: "Leon Guavamango",   teamId: tid("FBR_RJ"),      functionId: fid("AGENTE"),         status: "active" as const },
    { code: "CINTHIA-01", displayName: "Cinthia Yamamatsu", teamId: tid("ARVA"),        functionId: fid("AGENTE"),         status: "active" as const },
    { code: "MARIA-01",   displayName: "Maria Rodrigues",   teamId: tid("ARVA"),        functionId: fid("AGENTE"),         status: "active" as const },
    { code: "ERICK-01",   displayName: "Erick Moraes",      teamId: tid("ARVA"),        functionId: fid("AGENTE"),         status: "active" as const },
  ];

  for (const a of agents) {
    await prisma.agent.upsert({
      where: { code: a.code },
      update: {},
      create: {
        code: a.code,
        displayName: a.displayName,
        status: a.status,
        owningTeamId: a.teamId,
        primaryFunctionId: a.functionId,
        startedAt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000), // 90 dias atrás
      },
    });
  }
  console.log(`  ✅ ${agents.length} agentes de demonstração criados`);

  // -----------------------------------------------------------
  // 7. Período de avaliação demo (mês atual)
  // -----------------------------------------------------------
  const now = new Date();
  const periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
  const periodCode = `monthly-${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

  await prisma.evaluationPeriod.upsert({
    where: { code: periodCode },
    update: {},
    create: {
      code: periodCode,
      periodType: "monthly",
      startsAt: periodStart,
      endsAt: periodEnd,
      isClosed: false,
    },
  });
  console.log(`  ✅ Período ${periodCode} criado`);

  // -----------------------------------------------------------
  // 8. Scorecards demo para visualização no dashboard
  // -----------------------------------------------------------
  const period = await prisma.evaluationPeriod.findUnique({ where: { code: periodCode } });
  const agentRecords = await prisma.agent.findMany();

  const demoScores: Record<string, number> = {
    "CHIARA-01": 96.5,
    "MILA-01":   92.2,
    "DAVID-01":  88.0,
    "ANAB-01":   91.8,
    "MAIA-01":   85.3,
    "LIA-01":    90.1,
    "PRIS-01":   79.5,
    "LEON-01":   68.4,
    "CINTHIA-01": 84.1,
    "MARIA-01":   76.5,
    "ERICK-01":   89.0,
  };

  const getBand = (score: number): string => {
    if (score >= 80) return "green";
    if (score >= 65) return "yellow";
    if (score >= 50) return "orange";
    return "red";
  };

  const sortedAgents = agentRecords.sort(
    (a: { code: string }, b: { code: string }) =>
      (demoScores[b.code] ?? 0) - (demoScores[a.code] ?? 0)
  );

  for (let i = 0; i < sortedAgents.length; i++) {
    const agent = sortedAgents[i];
    const score = demoScores[agent.code] ?? 70;

    const existingCard = await prisma.periodScorecard.findFirst({
      where: { periodId: period!.id, agentId: agent.id, publicationVersion: 1 },
    });

    if (!existingCard) {
      await prisma.periodScorecard.create({
        data: {
          periodId: period!.id,
          agentId: agent.id,
          policyVersionId: policyVersion.id,
          scoreValue: score,
          scoreStatus: "published",
          sampleSize: Math.floor(Math.random() * 20) + 10,
          eligibleTaskCount: Math.floor(Math.random() * 18) + 8,
          confidenceIndex: 1.0,
          rankPosition: i + 1,
          operationalBand: getBand(score),
          trendDelta: parseFloat((Math.random() * 10 - 3).toFixed(2)),
          publicationVersion: 1,
          publishedAt: new Date(),
        },
      });
    }
  }
  console.log(`  ✅ ${agentRecords.length} scorecards demo criados`);

  // -----------------------------------------------------------
  // 9. Regras de consequência padrão
  // -----------------------------------------------------------
  const consequenceRules = [
    {
      code: "low_score_alert",
      name: "Alerta de Score Baixo",
      actionType: "require_human_review" as const,
      triggerExpression: { field: "period_score", operator: "lt", value: 50 },
      requiresHumanConfirmation: true,
      description: "Ativa quando score do agente cai abaixo de 50",
    },
    {
      code: "high_score_promote",
      name: "Promoção por Alta Performance",
      actionType: "increase_autonomy" as const,
      triggerExpression: { field: "period_score", operator: "gte", value: 92 },
      requiresHumanConfirmation: false,
      description: "Ampliar autonomia quando score supera 92",
    },
    {
      code: "monitoring_intensified",
      name: "Intensificar Monitoramento",
      actionType: "monitoring_intensified" as const,
      triggerExpression: { field: "period_score", operator: "lt", value: 65 },
      requiresHumanConfirmation: false,
      description: "Intensificar revisão quando score cai abaixo de 65",
    },
  ];

  for (const r of consequenceRules) {
    await prisma.consequenceRule.upsert({
      where: { code: r.code },
      update: {},
      create: {
        code: r.code,
        name: r.name,
        description: r.description,
        actionType: r.actionType,
        triggerExpression: r.triggerExpression,
        requiresHumanConfirmation: r.requiresHumanConfirmation,
        isActive: true,
      },
    });
  }
  console.log(`  ✅ ${consequenceRules.length} regras de consequência criadas`);

  console.log("\n🎉 Seed concluído com sucesso!");
}

main()
  .catch((e) => {
    console.error("❌ Erro no seed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
