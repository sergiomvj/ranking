/**
 * Utilitário para serializar dados vindos do Prisma.
 * O Prisma retorna campos decimais como objetos "Decimal", que não podem ser 
 * serializados automaticamente pelo Next.js ao passar do Server para o Client.
 */
export function serializePrisma<T>(data: T): T {
  if (data === null || data === undefined) {
    return data;
  }

  // Se for um Array, processa recursivamente
  if (Array.isArray(data)) {
    return data.map((item) => serializePrisma(item)) as unknown as T;
  }

  // Se for um objeto de data, mantém como está (Next.js lida bem com Dates)
  if (data instanceof Date) {
    return data;
  }

  // Se for um objeto Decimal do Prisma (possui método toNumber)
  if (
    typeof data === "object" && 
    data !== null && 
    "toNumber" in data && 
    typeof (data as any).toNumber === "function"
  ) {
    return (data as any).toNumber();
  }

  // Se for um objeto comum, processa as chaves recursivamente
  if (typeof data === "object" && data !== null) {
    const serialized: any = {};
    for (const key in data) {
      if (Object.prototype.hasOwnProperty.call(data, key)) {
        serialized[key] = serializePrisma((data as any)[key]);
      }
    }
    return serialized as T;
  }

  return data;
}
