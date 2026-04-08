import { prisma } from "../prisma";

/**
 * Retorna a lista de agentes com paginação e filtros opcionais.
 */
export async function getAgents(params?: {
  teamId?: string;
  functionId?: string;
  search?: string;
  page?: number;
  limit?: number;
}) {
  const page = params?.page ?? 1;
  const limit = params?.limit ?? 50;
  const skip = (page - 1) * limit;

  const where: any = {};
  if (params?.teamId) where.owningTeamId = params.teamId;
  if (params?.functionId) where.primaryFunctionId = params.functionId;
  if (params?.search) {
    where.OR = [
      { code: { contains: params.search, mode: "insensitive" } },
      { displayName: { contains: params.search, mode: "insensitive" } },
    ];
  }

  const [data, total] = await Promise.all([
    prisma.agent.findMany({
      where,
      skip,
      take: limit,
      include: {
        owningTeam: true,
        primaryFunction: true,
      },
      orderBy: { displayName: "asc" },
    }),
    prisma.agent.count({ where }),
  ]);

  return { data, total, page, limit };
}

/**
 * Retorna lista de Equipes.
 */
export async function getTeams() {
  return prisma.team.findMany({
    orderBy: { name: "asc" },
  });
}

/**
 * Retorna lista de Funções do Catálogo.
 */
export async function getFunctions() {
  return prisma.functionCatalog.findMany({
    orderBy: { name: "asc" },
  });
}

/**
 * Retorna lista de Tipos de Tarefa.
 */
export async function getTaskTypes() {
  return prisma.taskType.findMany({
    orderBy: { name: "asc" },
  });
}
