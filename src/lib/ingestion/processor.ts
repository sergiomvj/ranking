import { prisma } from "../prisma";
import crypto from "crypto";
import { EventIngestionStatus, Prisma } from "@prisma/client";

export interface IngestionPayload {
  sourceSystem: string;
  sourceEventId?: string;
  agentCode: string;
  taskTypeCode: string;
  occurredAt?: string;
  payload: any;
  metadata?: any;
}

/**
 * Processa um payload de webhook e cria/valida uma IngestionEvent.
 * Para o MVP, validamos sincronicamente e criamos a TaskExecution derivada se for apto.
 */
export async function processTaskIngestion(data: IngestionPayload) {
  // 1. Gera um hash de deduplicação básico
  const hashSource = `${data.sourceSystem}_${data.sourceEventId ?? Date.now()}_${data.agentCode}_${data.taskTypeCode}`;
  const dedupHash = crypto.createHash("sha256").update(hashSource).digest("hex");

  // Verifica se já existe (Idempotência)
  const existingEvent = await prisma.ingestionEvent.findUnique({
    where: { dedupHash }
  });

  if (existingEvent) {
    return { status: "duplicate", eventId: existingEvent.id };
  }

  // 2. Tenta fazer o bind (matching) das entidades
  const agent = await prisma.agent.findUnique({ where: { code: data.agentCode } });
  const taskType = await prisma.taskType.findUnique({ where: { code: data.taskTypeCode } });

  let ingestionStatus = EventIngestionStatus.received;
  let errorMessage = null;

  if (!agent) {
    ingestionStatus = EventIngestionStatus.invalid;
    errorMessage = `Agent with code ${data.agentCode} not found`;
  } else if (!taskType) {
    ingestionStatus = EventIngestionStatus.invalid;
    errorMessage = `TaskType with code ${data.taskTypeCode} not found`;
  } else {
    // Pode se tornar normalized direto no MVP
    ingestionStatus = EventIngestionStatus.normalized;
  }

  // 3. Grava o evento na tabela bruta (raw)
  const event = await prisma.ingestionEvent.create({
    data: {
      sourceSystem: data.sourceSystem,
      sourceEventId: data.sourceEventId,
      dedupHash,
      agentId: agent?.id,
      taskTypeId: taskType?.id,
      occurredAt: data.occurredAt ? new Date(data.occurredAt) : new Date(),
      ingestionStatus,
      errorMessage,
      payload: data.payload as Prisma.InputJsonValue,
      metadata: (data.metadata ?? {}) as Prisma.InputJsonValue,
    }
  });

  // 4. Se normalized logicamente, gera a TaskExecution pendente
  if (ingestionStatus === EventIngestionStatus.normalized && agent && taskType) {
    // Exemplo: Criar TaskExecution pendente de evaluation pelo Score Engine
    await prisma.taskExecution.create({
      data: {
        ingestionEventId: event.id,
        agentId: agent.id,
        teamId: agent.owningTeamId,
        functionId: agent.primaryFunctionId,
        taskTypeId: taskType.id,
        externalReference: data.sourceEventId,
        startedAt: event.occurredAt,
        completedAt: event.occurredAt,
        criticality: taskType.defaultCriticality,
        complexity: taskType.defaultComplexity,
        executionStatus: "pending", 
        scoreStatus: "provisional",
      }
    });
  }

  return { status: ingestionStatus, eventId: event.id, error: errorMessage };
}
