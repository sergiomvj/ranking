-- AlterTable: Adicionar campos faltantes na tabela agents
ALTER TABLE "agents" ADD COLUMN "lastCheckIn" TIMESTAMPTZ;
ALTER TABLE "agents" ADD COLUMN "managerNotes" TEXT;

-- CreateTable: projects
CREATE TABLE "projects" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "documentation" TEXT,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "createdByUserId" UUID,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "projects_pkey" PRIMARY KEY ("id")
);

-- CreateTable: project_tasks
CREATE TABLE "project_tasks" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "projectId" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "status" TEXT NOT NULL DEFAULT 'backlog',
    "criticality" "TaskCriticality" NOT NULL DEFAULT 'medium',
    "complexity" "TaskComplexity" NOT NULL DEFAULT 'standard',
    "assignedAgentId" UUID,
    "assignedTeamId" UUID,
    "dependencyId" UUID,
    "sequence" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "project_tasks_pkey" PRIMARY KEY ("id")
);

-- CreateTable: task_lifecycle_events
CREATE TABLE "task_lifecycle_events" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "taskId" UUID NOT NULL,
    "agentId" UUID,
    "eventType" TEXT NOT NULL,
    "notes" TEXT,
    "payload" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "task_lifecycle_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable: agent_sessions
CREATE TABLE "agent_sessions" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "agentId" UUID NOT NULL,
    "clockInAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" TEXT NOT NULL DEFAULT 'active',
    "notes" TEXT,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "agent_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable: Tabela de junção para membros do projeto
CREATE TABLE "_ProjectMembers" (
    "A" UUID NOT NULL,
    "B" UUID NOT NULL
);

-- CreateIndex: Projetos
CREATE UNIQUE INDEX "projects_code_key" ON "projects"("code");

-- CreateIndex: Tarefas de Projeto
CREATE INDEX "project_tasks_projectId_status_idx" ON "project_tasks"("projectId", "status");
CREATE INDEX "project_tasks_assignedAgentId_status_idx" ON "project_tasks"("assignedAgentId", "status");

-- CreateIndex: Eventos de Ciclo de Vida
CREATE INDEX "task_lifecycle_events_taskId_eventType_idx" ON "task_lifecycle_events"("taskId", "eventType");

-- CreateIndex: Sessões de Agente
CREATE INDEX "agent_sessions_agentId_clockInAt_idx" ON "agent_sessions"("agentId", "clockInAt" DESC);

-- CreateIndex: Membros do Projeto (Relacionamento Many-to-Many)
CREATE UNIQUE INDEX "_ProjectMembers_AB_unique" ON "_ProjectMembers"("A", "B");
CREATE INDEX "_ProjectMembers_B_index" ON "_ProjectMembers"("B");

-- AddForeignKey: Projetos
ALTER TABLE "projects" ADD CONSTRAINT "projects_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "app_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey: Tarefas de Projeto
ALTER TABLE "project_tasks" ADD CONSTRAINT "project_tasks_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "project_tasks" ADD CONSTRAINT "project_tasks_assignedAgentId_fkey" FOREIGN KEY ("assignedAgentId") REFERENCES "agents"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "project_tasks" ADD CONSTRAINT "project_tasks_assignedTeamId_fkey" FOREIGN KEY ("assignedTeamId") REFERENCES "teams"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "project_tasks" ADD CONSTRAINT "project_tasks_dependencyId_fkey" FOREIGN KEY ("dependencyId") REFERENCES "project_tasks"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey: Eventos de Ciclo de Vida
ALTER TABLE "task_lifecycle_events" ADD CONSTRAINT "task_lifecycle_events_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "project_tasks"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "task_lifecycle_events" ADD CONSTRAINT "task_lifecycle_events_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "agents"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey: Sessões de Agente
ALTER TABLE "agent_sessions" ADD CONSTRAINT "agent_sessions_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "agents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey: Membros do Projeto
ALTER TABLE "_ProjectMembers" ADD CONSTRAINT "_ProjectMembers_A_fkey" FOREIGN KEY ("A") REFERENCES "agents"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "_ProjectMembers" ADD CONSTRAINT "_ProjectMembers_B_fkey" FOREIGN KEY ("B") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;
