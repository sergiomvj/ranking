-- CreateEnum
CREATE TYPE "AppRoleCode" AS ENUM ('viewer_internal', 'manager_operational', 'auditor_restricted', 'admin_platform');

-- CreateEnum
CREATE TYPE "AgentStatus" AS ENUM ('draft', 'active', 'inactive', 'suspended', 'archived');

-- CreateEnum
CREATE TYPE "PeriodType" AS ENUM ('daily', 'weekly', 'monthly', 'quarterly', 'custom');

-- CreateEnum
CREATE TYPE "TaskCriticality" AS ENUM ('low', 'medium', 'high', 'critical');

-- CreateEnum
CREATE TYPE "TaskComplexity" AS ENUM ('simple', 'standard', 'complex', 'exceptional');

-- CreateEnum
CREATE TYPE "EventIngestionStatus" AS ENUM ('received', 'validated', 'duplicate', 'invalid', 'normalized', 'failed');

-- CreateEnum
CREATE TYPE "ExecutionStatus" AS ENUM ('pending', 'evaluated', 'rejected', 'needs_review', 'superseded');

-- CreateEnum
CREATE TYPE "ScoreStatus" AS ENUM ('provisional', 'published', 'reprocessed', 'revoked');

-- CreateEnum
CREATE TYPE "VisibilityLayer" AS ENUM ('internal_wide', 'operational', 'audit_restricted');

-- CreateEnum
CREATE TYPE "BadgeAwardStatus" AS ENUM ('active', 'revoked', 'expired');

-- CreateEnum
CREATE TYPE "ReviewStatus" AS ENUM ('open', 'in_analysis', 'approved', 'rejected', 'expired', 'cancelled');

-- CreateEnum
CREATE TYPE "ReviewDecisionType" AS ENUM ('maintained', 'adjusted', 'invalidated');

-- CreateEnum
CREATE TYPE "ConsequenceStatus" AS ENUM ('suggested', 'pending_confirmation', 'applied', 'dismissed', 'expired');

-- CreateEnum
CREATE TYPE "ConsequenceActionType" AS ENUM ('increase_autonomy', 'require_human_review', 'limit_critical_tasks', 'training_plan', 'monitoring_intensified', 'public_recognition', 'priority_routing', 'manual_intervention');

-- CreateEnum
CREATE TYPE "ActorType" AS ENUM ('user', 'system', 'service');

-- CreateEnum
CREATE TYPE "AuditEventType" AS ENUM ('login', 'access_denied', 'view_sensitive_record', 'export_requested', 'export_downloaded', 'policy_created', 'policy_published', 'policy_archived', 'period_opened', 'period_closed', 'period_reprocessed', 'badge_awarded', 'badge_revoked', 'review_opened', 'review_decided', 'manual_override', 'data_updated');

-- CreateTable
CREATE TABLE "app_users" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "externalAuthId" TEXT,
    "email" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "app_users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "app_user_roles" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "userId" UUID NOT NULL,
    "roleCode" "AppRoleCode" NOT NULL,
    "teamId" UUID,
    "functionId" UUID,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "app_user_roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "teams" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "teams_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "functions_catalog" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "functions_catalog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "agents" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "code" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "description" TEXT,
    "status" "AgentStatus" NOT NULL DEFAULT 'draft',
    "primaryFunctionId" UUID,
    "owningTeamId" UUID,
    "startedAt" TIMESTAMPTZ,
    "endedAt" TIMESTAMPTZ,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "agents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "agent_team_assignments" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "agentId" UUID NOT NULL,
    "teamId" UUID NOT NULL,
    "startedAt" TIMESTAMPTZ NOT NULL,
    "endedAt" TIMESTAMPTZ,
    "isCurrent" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "agent_team_assignments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "agent_function_assignments" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "agentId" UUID NOT NULL,
    "functionId" UUID NOT NULL,
    "startedAt" TIMESTAMPTZ NOT NULL,
    "endedAt" TIMESTAMPTZ,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "isCurrent" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "agent_function_assignments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "task_types" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "defaultCriticality" "TaskCriticality" NOT NULL DEFAULT 'medium',
    "defaultComplexity" "TaskComplexity" NOT NULL DEFAULT 'standard',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "task_types_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "metric_catalog" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "minValue" DECIMAL(10,4) NOT NULL DEFAULT 0,
    "maxValue" DECIMAL(10,4) NOT NULL DEFAULT 100,
    "defaultWeight" DECIMAL(8,4) NOT NULL DEFAULT 0,
    "scoreDirection" TEXT NOT NULL DEFAULT 'higher_is_better',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "metric_catalog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "scoring_policies" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "ownerUserId" UUID,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "scoring_policies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "scoring_policy_versions" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "policyId" UUID NOT NULL,
    "versionNumber" INTEGER NOT NULL,
    "status" TEXT NOT NULL,
    "validFrom" TIMESTAMPTZ NOT NULL,
    "validTo" TIMESTAMPTZ,
    "rationale" TEXT,
    "createdByUserId" UUID,
    "publishedByUserId" UUID,
    "publishedAt" TIMESTAMPTZ,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "scoring_policy_versions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "scoring_policy_metric_weights" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "policyVersionId" UUID NOT NULL,
    "metricId" UUID NOT NULL,
    "functionId" UUID,
    "weight" DECIMAL(8,4) NOT NULL,
    "isRequired" BOOLEAN NOT NULL DEFAULT true,
    "capIfMissing" DECIMAL(5,2),
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "scoring_policy_metric_weights_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "scoring_policy_thresholds" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "policyVersionId" UUID NOT NULL,
    "thresholdCode" TEXT NOT NULL,
    "thresholdValue" DECIMAL(10,4) NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "scoring_policy_thresholds_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "scoring_policy_task_weights" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "policyVersionId" UUID NOT NULL,
    "taskTypeId" UUID,
    "criticality" "TaskCriticality",
    "complexity" "TaskComplexity",
    "weightFactor" DECIMAL(8,4) NOT NULL,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "scoring_policy_task_weights_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ingestion_events" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "sourceSystem" TEXT NOT NULL,
    "sourceEventId" TEXT,
    "dedupHash" TEXT NOT NULL,
    "agentId" UUID,
    "taskTypeId" UUID,
    "receivedAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "occurredAt" TIMESTAMPTZ,
    "ingestionStatus" "EventIngestionStatus" NOT NULL DEFAULT 'received',
    "errorMessage" TEXT,
    "payload" JSONB NOT NULL,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ingestion_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "task_executions" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "ingestionEventId" UUID,
    "agentId" UUID NOT NULL,
    "teamId" UUID,
    "functionId" UUID,
    "taskTypeId" UUID NOT NULL,
    "policyVersionId" UUID,
    "externalReference" TEXT,
    "startedAt" TIMESTAMPTZ,
    "completedAt" TIMESTAMPTZ,
    "criticality" "TaskCriticality" NOT NULL,
    "complexity" "TaskComplexity" NOT NULL,
    "executionStatus" "ExecutionStatus" NOT NULL DEFAULT 'pending',
    "confidenceFactor" DECIMAL(6,4) NOT NULL DEFAULT 1.0000,
    "penaltyPoints" DECIMAL(6,2) NOT NULL DEFAULT 0,
    "capScore" DECIMAL(5,2),
    "scoreRaw" DECIMAL(5,2),
    "scoreFinal" DECIMAL(5,2),
    "scoreStatus" "ScoreStatus" NOT NULL DEFAULT 'provisional',
    "sampleEligible" BOOLEAN NOT NULL DEFAULT true,
    "explanation" JSONB NOT NULL DEFAULT '{}',
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "task_executions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "execution_metric_scores" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "executionId" UUID NOT NULL,
    "metricId" UUID NOT NULL,
    "rawValue" DECIMAL(10,4),
    "normalizedValue" DECIMAL(10,4),
    "appliedWeight" DECIMAL(8,4) NOT NULL DEFAULT 0,
    "weightedPoints" DECIMAL(10,4) NOT NULL DEFAULT 0,
    "metricStatus" TEXT NOT NULL DEFAULT 'computed',
    "explanation" TEXT,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "execution_metric_scores_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "execution_evidences" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "executionId" UUID NOT NULL,
    "visibility" "VisibilityLayer" NOT NULL DEFAULT 'audit_restricted',
    "evidenceType" TEXT NOT NULL,
    "storagePath" TEXT,
    "signedUrlExpiresAt" TIMESTAMPTZ,
    "contentHash" TEXT,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "execution_evidences_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "execution_penalties" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "executionId" UUID NOT NULL,
    "penaltyCode" TEXT NOT NULL,
    "penaltyPoints" DECIMAL(6,2) NOT NULL DEFAULT 0,
    "rationale" TEXT,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "execution_penalties_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "evaluation_periods" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "code" TEXT NOT NULL,
    "periodType" "PeriodType" NOT NULL,
    "startsAt" TIMESTAMPTZ NOT NULL,
    "endsAt" TIMESTAMPTZ NOT NULL,
    "isClosed" BOOLEAN NOT NULL DEFAULT false,
    "closedAt" TIMESTAMPTZ,
    "closedByUserId" UUID,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "evaluation_periods_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "period_scorecards" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "periodId" UUID NOT NULL,
    "agentId" UUID,
    "teamId" UUID,
    "functionId" UUID,
    "policyVersionId" UUID NOT NULL,
    "scoreValue" DECIMAL(5,2) NOT NULL,
    "scoreStatus" "ScoreStatus" NOT NULL DEFAULT 'provisional',
    "sampleSize" INTEGER NOT NULL DEFAULT 0,
    "eligibleTaskCount" INTEGER NOT NULL DEFAULT 0,
    "confidenceIndex" DECIMAL(6,4) NOT NULL DEFAULT 1.0000,
    "rankPosition" INTEGER,
    "previousRankPosition" INTEGER,
    "trendDelta" DECIMAL(6,2),
    "operationalBand" TEXT NOT NULL,
    "explanation" JSONB NOT NULL DEFAULT '{}',
    "publishedAt" TIMESTAMPTZ,
    "publicationVersion" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "period_scorecards_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "period_scorecard_dimensions" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "scorecardId" UUID NOT NULL,
    "metricId" UUID NOT NULL,
    "averageScore" DECIMAL(5,2) NOT NULL,
    "appliedWeight" DECIMAL(8,4) NOT NULL,
    "explanation" TEXT,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "period_scorecard_dimensions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ranking_snapshots" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "periodId" UUID NOT NULL,
    "scopeType" TEXT NOT NULL,
    "visibility" "VisibilityLayer" NOT NULL DEFAULT 'internal_wide',
    "publicationVersion" INTEGER NOT NULL,
    "generatedAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "generatedByUserId" UUID,
    "storagePath" TEXT,
    "metadata" JSONB NOT NULL DEFAULT '{}',

    CONSTRAINT "ranking_snapshots_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "badges_catalog" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "badgeCategory" TEXT NOT NULL,
    "visibility" "VisibilityLayer" NOT NULL DEFAULT 'internal_wide',
    "isManualValidationRequired" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "badges_catalog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "badge_rules" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "badgeId" UUID NOT NULL,
    "policyVersionId" UUID,
    "ruleExpression" JSONB NOT NULL,
    "validFrom" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "validTo" TIMESTAMPTZ,
    "createdByUserId" UUID,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "badge_rules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "badge_awards" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "badgeId" UUID NOT NULL,
    "agentId" UUID,
    "teamId" UUID,
    "functionId" UUID,
    "periodId" UUID,
    "awardedByUserId" UUID,
    "sourceScorecardId" UUID,
    "awardStatus" "BadgeAwardStatus" NOT NULL DEFAULT 'active',
    "awardedAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "revokedAt" TIMESTAMPTZ,
    "revokeReason" TEXT,
    "evidence" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "badge_awards_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "consequence_rules" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "policyVersionId" UUID,
    "actionType" "ConsequenceActionType" NOT NULL,
    "triggerExpression" JSONB NOT NULL,
    "requiresHumanConfirmation" BOOLEAN NOT NULL DEFAULT true,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdByUserId" UUID,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "consequence_rules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "consequence_events" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "ruleId" UUID NOT NULL,
    "agentId" UUID,
    "teamId" UUID,
    "functionId" UUID,
    "periodId" UUID,
    "sourceScorecardId" UUID,
    "status" "ConsequenceStatus" NOT NULL DEFAULT 'suggested',
    "triggeredAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "confirmedByUserId" UUID,
    "confirmedAt" TIMESTAMPTZ,
    "dismissedByUserId" UUID,
    "dismissedAt" TIMESTAMPTZ,
    "rationale" TEXT,
    "payload" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "consequence_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "score_reviews" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "executionId" UUID,
    "scorecardId" UUID,
    "requestedByUserId" UUID NOT NULL,
    "assignedToUserId" UUID,
    "reviewStatus" "ReviewStatus" NOT NULL DEFAULT 'open',
    "reason" TEXT NOT NULL,
    "requestedAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dueAt" TIMESTAMPTZ,
    "decidedAt" TIMESTAMPTZ,
    "decidedByUserId" UUID,
    "decisionType" "ReviewDecisionType",
    "originalScore" DECIMAL(5,2),
    "revisedScore" DECIMAL(5,2),
    "decisionNotes" TEXT,
    "attachments" JSONB NOT NULL DEFAULT '[]',
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "score_reviews_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_events" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "eventType" "AuditEventType" NOT NULL,
    "actorType" "ActorType" NOT NULL,
    "actorUserId" UUID,
    "actorServiceName" TEXT,
    "targetTable" TEXT,
    "targetId" UUID,
    "visibility" "VisibilityLayer" NOT NULL DEFAULT 'internal_wide',
    "eventTimestamp" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ipAddress" INET,
    "userAgent" TEXT,
    "rationale" TEXT,
    "metadata" JSONB NOT NULL DEFAULT '{}',

    CONSTRAINT "audit_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "data_access_logs" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "userId" UUID NOT NULL,
    "accessedResource" TEXT NOT NULL,
    "accessedResourceId" UUID,
    "visibility" "VisibilityLayer" NOT NULL,
    "accessReason" TEXT,
    "accessedAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "metadata" JSONB NOT NULL DEFAULT '{}',

    CONSTRAINT "data_access_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "export_jobs" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "requestedByUserId" UUID NOT NULL,
    "visibility" "VisibilityLayer" NOT NULL,
    "queryContext" JSONB NOT NULL DEFAULT '{}',
    "status" TEXT NOT NULL,
    "storagePath" TEXT,
    "expiresAt" TIMESTAMPTZ,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMPTZ,

    CONSTRAINT "export_jobs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "app_users_externalAuthId_key" ON "app_users"("externalAuthId");

-- CreateIndex
CREATE UNIQUE INDEX "app_users_email_key" ON "app_users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "app_user_roles_userId_roleCode_teamId_functionId_key" ON "app_user_roles"("userId", "roleCode", "teamId", "functionId");

-- CreateIndex
CREATE UNIQUE INDEX "teams_code_key" ON "teams"("code");

-- CreateIndex
CREATE UNIQUE INDEX "functions_catalog_code_key" ON "functions_catalog"("code");

-- CreateIndex
CREATE UNIQUE INDEX "agents_code_key" ON "agents"("code");

-- CreateIndex
CREATE UNIQUE INDEX "agent_team_assignments_agentId_teamId_startedAt_key" ON "agent_team_assignments"("agentId", "teamId", "startedAt");

-- CreateIndex
CREATE UNIQUE INDEX "agent_function_assignments_agentId_functionId_startedAt_key" ON "agent_function_assignments"("agentId", "functionId", "startedAt");

-- CreateIndex
CREATE UNIQUE INDEX "task_types_code_key" ON "task_types"("code");

-- CreateIndex
CREATE UNIQUE INDEX "metric_catalog_code_key" ON "metric_catalog"("code");

-- CreateIndex
CREATE UNIQUE INDEX "scoring_policies_code_key" ON "scoring_policies"("code");

-- CreateIndex
CREATE UNIQUE INDEX "scoring_policy_versions_policyId_versionNumber_key" ON "scoring_policy_versions"("policyId", "versionNumber");

-- CreateIndex
CREATE UNIQUE INDEX "scoring_policy_metric_weights_policyVersionId_metricId_func_key" ON "scoring_policy_metric_weights"("policyVersionId", "metricId", "functionId");

-- CreateIndex
CREATE UNIQUE INDEX "scoring_policy_thresholds_policyVersionId_thresholdCode_key" ON "scoring_policy_thresholds"("policyVersionId", "thresholdCode");

-- CreateIndex
CREATE UNIQUE INDEX "ingestion_events_dedupHash_key" ON "ingestion_events"("dedupHash");

-- CreateIndex
CREATE INDEX "ingestion_events_agentId_idx" ON "ingestion_events"("agentId");

-- CreateIndex
CREATE INDEX "ingestion_events_taskTypeId_idx" ON "ingestion_events"("taskTypeId");

-- CreateIndex
CREATE INDEX "ingestion_events_receivedAt_idx" ON "ingestion_events"("receivedAt" DESC);

-- CreateIndex
CREATE INDEX "ingestion_events_ingestionStatus_idx" ON "ingestion_events"("ingestionStatus");

-- CreateIndex
CREATE UNIQUE INDEX "task_executions_ingestionEventId_key" ON "task_executions"("ingestionEventId");

-- CreateIndex
CREATE INDEX "task_executions_agentId_completedAt_idx" ON "task_executions"("agentId", "completedAt" DESC);

-- CreateIndex
CREATE INDEX "task_executions_teamId_completedAt_idx" ON "task_executions"("teamId", "completedAt" DESC);

-- CreateIndex
CREATE INDEX "task_executions_functionId_completedAt_idx" ON "task_executions"("functionId", "completedAt" DESC);

-- CreateIndex
CREATE INDEX "task_executions_policyVersionId_idx" ON "task_executions"("policyVersionId");

-- CreateIndex
CREATE INDEX "task_executions_taskTypeId_idx" ON "task_executions"("taskTypeId");

-- CreateIndex
CREATE INDEX "task_executions_executionStatus_scoreStatus_idx" ON "task_executions"("executionStatus", "scoreStatus");

-- CreateIndex
CREATE INDEX "execution_metric_scores_executionId_idx" ON "execution_metric_scores"("executionId");

-- CreateIndex
CREATE UNIQUE INDEX "execution_metric_scores_executionId_metricId_key" ON "execution_metric_scores"("executionId", "metricId");

-- CreateIndex
CREATE INDEX "execution_evidences_executionId_idx" ON "execution_evidences"("executionId");

-- CreateIndex
CREATE INDEX "execution_penalties_executionId_idx" ON "execution_penalties"("executionId");

-- CreateIndex
CREATE UNIQUE INDEX "evaluation_periods_code_key" ON "evaluation_periods"("code");

-- CreateIndex
CREATE INDEX "evaluation_periods_periodType_startsAt_idx" ON "evaluation_periods"("periodType", "startsAt" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "period_scorecards_periodId_agentId_publicationVersion_key" ON "period_scorecards"("periodId", "agentId", "publicationVersion");

-- CreateIndex
CREATE UNIQUE INDEX "period_scorecards_periodId_teamId_publicationVersion_key" ON "period_scorecards"("periodId", "teamId", "publicationVersion");

-- CreateIndex
CREATE UNIQUE INDEX "period_scorecards_periodId_functionId_publicationVersion_key" ON "period_scorecards"("periodId", "functionId", "publicationVersion");

-- CreateIndex
CREATE UNIQUE INDEX "period_scorecard_dimensions_scorecardId_metricId_key" ON "period_scorecard_dimensions"("scorecardId", "metricId");

-- CreateIndex
CREATE INDEX "ranking_snapshots_periodId_scopeType_publicationVersion_idx" ON "ranking_snapshots"("periodId", "scopeType", "publicationVersion" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "badges_catalog_code_key" ON "badges_catalog"("code");

-- CreateIndex
CREATE INDEX "badge_awards_agentId_awardedAt_idx" ON "badge_awards"("agentId", "awardedAt" DESC);

-- CreateIndex
CREATE INDEX "badge_awards_teamId_awardedAt_idx" ON "badge_awards"("teamId", "awardedAt" DESC);

-- CreateIndex
CREATE INDEX "badge_awards_functionId_awardedAt_idx" ON "badge_awards"("functionId", "awardedAt" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "consequence_rules_code_key" ON "consequence_rules"("code");

-- CreateIndex
CREATE INDEX "consequence_events_agentId_triggeredAt_idx" ON "consequence_events"("agentId", "triggeredAt" DESC);

-- CreateIndex
CREATE INDEX "score_reviews_reviewStatus_requestedAt_idx" ON "score_reviews"("reviewStatus", "requestedAt" DESC);

-- CreateIndex
CREATE INDEX "audit_events_targetTable_targetId_eventTimestamp_idx" ON "audit_events"("targetTable", "targetId", "eventTimestamp" DESC);

-- CreateIndex
CREATE INDEX "audit_events_actorUserId_eventTimestamp_idx" ON "audit_events"("actorUserId", "eventTimestamp" DESC);

-- CreateIndex
CREATE INDEX "data_access_logs_userId_accessedAt_idx" ON "data_access_logs"("userId", "accessedAt" DESC);

-- AddForeignKey
ALTER TABLE "app_user_roles" ADD CONSTRAINT "app_user_roles_userId_fkey" FOREIGN KEY ("userId") REFERENCES "app_users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "app_user_roles" ADD CONSTRAINT "app_user_roles_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "teams"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "app_user_roles" ADD CONSTRAINT "app_user_roles_functionId_fkey" FOREIGN KEY ("functionId") REFERENCES "functions_catalog"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "agents" ADD CONSTRAINT "agents_primaryFunctionId_fkey" FOREIGN KEY ("primaryFunctionId") REFERENCES "functions_catalog"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "agents" ADD CONSTRAINT "agents_owningTeamId_fkey" FOREIGN KEY ("owningTeamId") REFERENCES "teams"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "agent_team_assignments" ADD CONSTRAINT "agent_team_assignments_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "agents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "agent_team_assignments" ADD CONSTRAINT "agent_team_assignments_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "teams"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "agent_function_assignments" ADD CONSTRAINT "agent_function_assignments_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "agents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "agent_function_assignments" ADD CONSTRAINT "agent_function_assignments_functionId_fkey" FOREIGN KEY ("functionId") REFERENCES "functions_catalog"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "scoring_policies" ADD CONSTRAINT "scoring_policies_ownerUserId_fkey" FOREIGN KEY ("ownerUserId") REFERENCES "app_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "scoring_policy_versions" ADD CONSTRAINT "scoring_policy_versions_policyId_fkey" FOREIGN KEY ("policyId") REFERENCES "scoring_policies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "scoring_policy_versions" ADD CONSTRAINT "scoring_policy_versions_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "app_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "scoring_policy_versions" ADD CONSTRAINT "scoring_policy_versions_publishedByUserId_fkey" FOREIGN KEY ("publishedByUserId") REFERENCES "app_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "scoring_policy_metric_weights" ADD CONSTRAINT "scoring_policy_metric_weights_policyVersionId_fkey" FOREIGN KEY ("policyVersionId") REFERENCES "scoring_policy_versions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "scoring_policy_metric_weights" ADD CONSTRAINT "scoring_policy_metric_weights_metricId_fkey" FOREIGN KEY ("metricId") REFERENCES "metric_catalog"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "scoring_policy_metric_weights" ADD CONSTRAINT "scoring_policy_metric_weights_functionId_fkey" FOREIGN KEY ("functionId") REFERENCES "functions_catalog"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "scoring_policy_thresholds" ADD CONSTRAINT "scoring_policy_thresholds_policyVersionId_fkey" FOREIGN KEY ("policyVersionId") REFERENCES "scoring_policy_versions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "scoring_policy_task_weights" ADD CONSTRAINT "scoring_policy_task_weights_policyVersionId_fkey" FOREIGN KEY ("policyVersionId") REFERENCES "scoring_policy_versions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "scoring_policy_task_weights" ADD CONSTRAINT "scoring_policy_task_weights_taskTypeId_fkey" FOREIGN KEY ("taskTypeId") REFERENCES "task_types"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ingestion_events" ADD CONSTRAINT "ingestion_events_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "agents"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ingestion_events" ADD CONSTRAINT "ingestion_events_taskTypeId_fkey" FOREIGN KEY ("taskTypeId") REFERENCES "task_types"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "task_executions" ADD CONSTRAINT "task_executions_ingestionEventId_fkey" FOREIGN KEY ("ingestionEventId") REFERENCES "ingestion_events"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "task_executions" ADD CONSTRAINT "task_executions_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "agents"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "task_executions" ADD CONSTRAINT "task_executions_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "teams"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "task_executions" ADD CONSTRAINT "task_executions_functionId_fkey" FOREIGN KEY ("functionId") REFERENCES "functions_catalog"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "task_executions" ADD CONSTRAINT "task_executions_taskTypeId_fkey" FOREIGN KEY ("taskTypeId") REFERENCES "task_types"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "task_executions" ADD CONSTRAINT "task_executions_policyVersionId_fkey" FOREIGN KEY ("policyVersionId") REFERENCES "scoring_policy_versions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "execution_metric_scores" ADD CONSTRAINT "execution_metric_scores_executionId_fkey" FOREIGN KEY ("executionId") REFERENCES "task_executions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "execution_metric_scores" ADD CONSTRAINT "execution_metric_scores_metricId_fkey" FOREIGN KEY ("metricId") REFERENCES "metric_catalog"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "execution_evidences" ADD CONSTRAINT "execution_evidences_executionId_fkey" FOREIGN KEY ("executionId") REFERENCES "task_executions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "execution_penalties" ADD CONSTRAINT "execution_penalties_executionId_fkey" FOREIGN KEY ("executionId") REFERENCES "task_executions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "evaluation_periods" ADD CONSTRAINT "evaluation_periods_closedByUserId_fkey" FOREIGN KEY ("closedByUserId") REFERENCES "app_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "period_scorecards" ADD CONSTRAINT "period_scorecards_periodId_fkey" FOREIGN KEY ("periodId") REFERENCES "evaluation_periods"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "period_scorecards" ADD CONSTRAINT "period_scorecards_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "agents"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "period_scorecards" ADD CONSTRAINT "period_scorecards_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "teams"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "period_scorecards" ADD CONSTRAINT "period_scorecards_functionId_fkey" FOREIGN KEY ("functionId") REFERENCES "functions_catalog"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "period_scorecards" ADD CONSTRAINT "period_scorecards_policyVersionId_fkey" FOREIGN KEY ("policyVersionId") REFERENCES "scoring_policy_versions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "period_scorecard_dimensions" ADD CONSTRAINT "period_scorecard_dimensions_scorecardId_fkey" FOREIGN KEY ("scorecardId") REFERENCES "period_scorecards"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "period_scorecard_dimensions" ADD CONSTRAINT "period_scorecard_dimensions_metricId_fkey" FOREIGN KEY ("metricId") REFERENCES "metric_catalog"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ranking_snapshots" ADD CONSTRAINT "ranking_snapshots_periodId_fkey" FOREIGN KEY ("periodId") REFERENCES "evaluation_periods"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ranking_snapshots" ADD CONSTRAINT "ranking_snapshots_generatedByUserId_fkey" FOREIGN KEY ("generatedByUserId") REFERENCES "app_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "badge_rules" ADD CONSTRAINT "badge_rules_badgeId_fkey" FOREIGN KEY ("badgeId") REFERENCES "badges_catalog"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "badge_rules" ADD CONSTRAINT "badge_rules_policyVersionId_fkey" FOREIGN KEY ("policyVersionId") REFERENCES "scoring_policy_versions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "badge_awards" ADD CONSTRAINT "badge_awards_badgeId_fkey" FOREIGN KEY ("badgeId") REFERENCES "badges_catalog"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "badge_awards" ADD CONSTRAINT "badge_awards_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "agents"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "badge_awards" ADD CONSTRAINT "badge_awards_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "teams"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "badge_awards" ADD CONSTRAINT "badge_awards_functionId_fkey" FOREIGN KEY ("functionId") REFERENCES "functions_catalog"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "badge_awards" ADD CONSTRAINT "badge_awards_periodId_fkey" FOREIGN KEY ("periodId") REFERENCES "evaluation_periods"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "badge_awards" ADD CONSTRAINT "badge_awards_awardedByUserId_fkey" FOREIGN KEY ("awardedByUserId") REFERENCES "app_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "badge_awards" ADD CONSTRAINT "badge_awards_sourceScorecardId_fkey" FOREIGN KEY ("sourceScorecardId") REFERENCES "period_scorecards"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "consequence_rules" ADD CONSTRAINT "consequence_rules_policyVersionId_fkey" FOREIGN KEY ("policyVersionId") REFERENCES "scoring_policy_versions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "consequence_rules" ADD CONSTRAINT "consequence_rules_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "app_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "consequence_events" ADD CONSTRAINT "consequence_events_ruleId_fkey" FOREIGN KEY ("ruleId") REFERENCES "consequence_rules"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "consequence_events" ADD CONSTRAINT "consequence_events_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "agents"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "consequence_events" ADD CONSTRAINT "consequence_events_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "teams"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "consequence_events" ADD CONSTRAINT "consequence_events_functionId_fkey" FOREIGN KEY ("functionId") REFERENCES "functions_catalog"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "consequence_events" ADD CONSTRAINT "consequence_events_periodId_fkey" FOREIGN KEY ("periodId") REFERENCES "evaluation_periods"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "consequence_events" ADD CONSTRAINT "consequence_events_sourceScorecardId_fkey" FOREIGN KEY ("sourceScorecardId") REFERENCES "period_scorecards"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "consequence_events" ADD CONSTRAINT "consequence_events_confirmedByUserId_fkey" FOREIGN KEY ("confirmedByUserId") REFERENCES "app_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "consequence_events" ADD CONSTRAINT "consequence_events_dismissedByUserId_fkey" FOREIGN KEY ("dismissedByUserId") REFERENCES "app_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "score_reviews" ADD CONSTRAINT "score_reviews_executionId_fkey" FOREIGN KEY ("executionId") REFERENCES "task_executions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "score_reviews" ADD CONSTRAINT "score_reviews_scorecardId_fkey" FOREIGN KEY ("scorecardId") REFERENCES "period_scorecards"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "score_reviews" ADD CONSTRAINT "score_reviews_requestedByUserId_fkey" FOREIGN KEY ("requestedByUserId") REFERENCES "app_users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "score_reviews" ADD CONSTRAINT "score_reviews_assignedToUserId_fkey" FOREIGN KEY ("assignedToUserId") REFERENCES "app_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "score_reviews" ADD CONSTRAINT "score_reviews_decidedByUserId_fkey" FOREIGN KEY ("decidedByUserId") REFERENCES "app_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_events" ADD CONSTRAINT "audit_events_actorUserId_fkey" FOREIGN KEY ("actorUserId") REFERENCES "app_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "data_access_logs" ADD CONSTRAINT "data_access_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "app_users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "export_jobs" ADD CONSTRAINT "export_jobs_requestedByUserId_fkey" FOREIGN KEY ("requestedByUserId") REFERENCES "app_users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
