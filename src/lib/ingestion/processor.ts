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
  let agent = await prisma.agent.findUnique({ where: { code: data.agentCode } });
  const taskType = await prisma.taskType.findUnique({ where: { code: data.taskTypeCode } });

  // AUTO-DISCOVERY: Se o agente não existe, cria agora para não perder o evento
  if (!agent) {
    console.log(`[Discovery] Novo agente detectado via Ingestão: ${data.agentCode}`);
    agent = await prisma.agent.create({
      data: {
        code: data.agentCode,
        displayName: data.agentCode, // Nome temporário (pode ser editado depois)
        status: "active",
        metadata: { 
          source: "auto_discovery", 
          discoveredAt: new Date().toISOString() 
        }
      }
    });
  }

  let ingestionStatus: EventIngestionStatus = EventIngestionStatus.received;
  let errorMessage = null;

  if (!taskType) {
    ingestionStatus = EventIngestionStatus.invalid;
    errorMessage = `TaskType with code ${data.taskTypeCode} not found`;
  } else {
    // Agente agora é garantido (ou já existia ou foi descoberto)
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
export interface MemoryIngestionPayload {
  agentCode: string;
  externalSessionId: string;
  sourceSystem: string;
  contextSummary: string;
  activeThreads: any;
  metadata?: any;
}

/**
 * Processa um payload de memória (Session Bridge) vindo dos agentes.
 * Implementa a Janela de Agrupamento de 24h.
 */
export async function processMemoryIngestion(data: MemoryIngestionPayload) {
  // 1. Localiza o agente
  const agent = await prisma.agent.findUnique({ where: { code: data.agentCode } });
  if (!agent) {
    throw new Error(`Agent with code ${data.agentCode} not found for memory sync`);
  }

  // 2. Verifica se existe uma sessão ativa para este ID externo nos últimos 24h (Janela de Agrupamento)
  const last24h = new Date(Date.now() - 24 * 60 * 60 * 1000);
  
  const existingSession = await prisma.agentSession.findFirst({
    where: {
      agentId: agent.id,
      externalSessionId: data.externalSessionId,
      status: "active",
      updatedAt: { gte: last24h }
    }
  });

  if (existingSession) {
    // Atualiza a sessão existente
    return await prisma.agentSession.update({
      where: { id: existingSession.id },
      data: {
        contextSummary: data.contextSummary,
        activeThreads: data.activeThreads ?? [],
        lastInteraction: new Date(),
        metadata: {
          ...(existingSession.metadata as any),
          ...(data.metadata ?? {}),
          lastUpdateSource: "webhook"
        }
      }
    });
  }

  // 3. Se não existe ou passou da janela, cria uma nova sessão/thread
  return await prisma.agentSession.create({
    data: {
      agentId: agent.id,
      externalSessionId: data.externalSessionId,
      sourceSystem: data.sourceSystem,
      contextSummary: data.contextSummary,
      activeThreads: data.activeThreads ?? [],
      status: "active",
      metadata: data.metadata ?? {}
    }
  });
}
