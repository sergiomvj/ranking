import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * ROTA DE EMERGÊNCIA: Sincronização de Banco via SQL Bruto
 * Esta rota deve ser usada quando as migrações automáticas falham ou não foram enviadas ao Git.
 * Ela adiciona colunas e tabelas faltantes diretamente.
 */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const secret = searchParams.get("secret");

  if (secret !== process.env.INGESTION_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const sqlCommands = [
    `ALTER TABLE "agents" ADD COLUMN IF NOT EXISTS "skills" TEXT;`,
    `ALTER TABLE "agents" ADD COLUMN IF NOT EXISTS "career" TEXT;`,
    `ALTER TABLE "agents" ADD COLUMN IF NOT EXISTS "lastCheckIn" TIMESTAMPTZ;`,
    `ALTER TABLE "agents" ADD COLUMN IF NOT EXISTS "managerNotes" TEXT;`,
    
    // Atualização do AgentSession (Session Bridge)
    `ALTER TABLE "agent_sessions" ADD COLUMN IF NOT EXISTS "externalSessionId" TEXT;`,
    `ALTER TABLE "agent_sessions" ADD COLUMN IF NOT EXISTS "sourceSystem" TEXT;`,
    `ALTER TABLE "agent_sessions" ADD COLUMN IF NOT EXISTS "contextSummary" TEXT;`,
    `ALTER TABLE "agent_sessions" ADD COLUMN IF NOT EXISTS "activeThreads" JSONB DEFAULT '[]';`,
    `ALTER TABLE "agent_sessions" ADD COLUMN IF NOT EXISTS "lastInteraction" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP;`,
    `ALTER TABLE "agent_sessions" ADD COLUMN IF NOT EXISTS "metadata" JSONB DEFAULT '{}';`,
    `ALTER TABLE "agent_sessions" ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP;`,
    `CREATE UNIQUE INDEX IF NOT EXISTS "agent_sessions_externalSessionId_key" ON "agent_sessions"("externalSessionId");`,

    // Squads Iniciais (Default)
    `INSERT INTO "teams" (id, code, name) VALUES (gen_random_uuid(), 'ARVA', 'Squad Arva') ON CONFLICT (code) DO NOTHING;`,
    `INSERT INTO "teams" (id, code, name) VALUES (gen_random_uuid(), 'MKT', 'Marketing') ON CONFLICT (code) DO NOTHING;`,
    `INSERT INTO "teams" (id, code, name) VALUES (gen_random_uuid(), 'SUP', 'Suporte FBR') ON CONFLICT (code) DO NOTHING;`,
    `INSERT INTO "teams" (id, code, name) VALUES (gen_random_uuid(), 'VND', 'Vendas') ON CONFLICT (code) DO NOTHING;`,

    // Funções Iniciais (Default)
    `INSERT INTO "functions_catalog" (id, code, name) VALUES (gen_random_uuid(), 'LDR', 'Líder / Gestor') ON CONFLICT (code) DO NOTHING;`,
    `INSERT INTO "functions_catalog" (id, code, name) VALUES (gen_random_uuid(), 'ESP', 'Especialista') ON CONFLICT (code) DO NOTHING;`,
    `INSERT INTO "functions_catalog" (id, code, name) VALUES (gen_random_uuid(), 'OPR', 'Operador de IA') ON CONFLICT (code) DO NOTHING;`,

    // Projetos
    `CREATE TABLE IF NOT EXISTS "projects" (
        "id" UUID NOT NULL DEFAULT gen_random_uuid(),
        "code" TEXT NOT NULL UNIQUE,
        "name" TEXT NOT NULL,
        "description" TEXT,
        "documentation" TEXT,
        "status" TEXT NOT NULL DEFAULT 'draft',
        "createdByUserId" UUID,
        "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "projects_pkey" PRIMARY KEY ("id")
    );`,

    // Tarefas
    `CREATE TABLE IF NOT EXISTS "project_tasks" (
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
    );`,

    // Ciclo de Vida
    `CREATE TABLE IF NOT EXISTS "task_lifecycle_events" (
        "id" UUID NOT NULL DEFAULT gen_random_uuid(),
        "taskId" UUID NOT NULL,
        "agentId" UUID,
        "eventType" TEXT NOT NULL,
        "notes" TEXT,
        "payload" JSONB NOT NULL DEFAULT '{}',
        "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "task_lifecycle_events_pkey" PRIMARY KEY ("id")
    );`,

    // Sessões
    `CREATE TABLE IF NOT EXISTS "agent_sessions" (
        "id" UUID NOT NULL DEFAULT gen_random_uuid(),
        "agentId" UUID NOT NULL,
        "clockInAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "status" TEXT NOT NULL DEFAULT 'active',
        "notes" TEXT,
        "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "agent_sessions_pkey" PRIMARY KEY ("id")
    );`,

    // Membros
    `CREATE TABLE IF NOT EXISTS "_ProjectMembers" (
        "A" UUID NOT NULL REFERENCES "agents"("id") ON DELETE CASCADE ON UPDATE CASCADE,
        "B" UUID NOT NULL REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE
    );`,

    // Índices
    `CREATE INDEX IF NOT EXISTS "project_tasks_projectId_status_idx" ON "project_tasks"("projectId", "status");`,
    `CREATE INDEX IF NOT EXISTS "task_lifecycle_events_taskId_eventType_idx" ON "task_lifecycle_events"("taskId", "eventType");`,
    `CREATE UNIQUE INDEX IF NOT EXISTS "_ProjectMembers_AB_unique" ON "_ProjectMembers"("A", "B");`,
    `CREATE INDEX IF NOT EXISTS "_ProjectMembers_B_index" ON "_ProjectMembers"("B");`
  ];

  const results = [];
  
  try {
    for (const sql of sqlCommands) {
      try {
        await prisma.$executeRawUnsafe(sql);
        results.push({ sql: sql.substring(0, 30) + "...", status: "SUCCESS" });
      } catch (err: any) {
        // Se a tabela/coluna já existe, ignoramos o erro
        if (err.message.includes("already exists")) {
          results.push({ sql: sql.substring(0, 30) + "...", status: "ALREADY_EXISTS" });
        } else {
          results.push({ sql: sql.substring(0, 30) + "...", status: "FAILED", error: err.message });
        }
      }
    }

    return NextResponse.json({
      ok: true,
      message: "Processo de sincronização forçada concluído.",
      results
    });
  } catch (error: any) {
    return NextResponse.json({
      ok: false,
      error: error.message
    }, { status: 500 });
  }
}
