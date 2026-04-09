import { PrismaClient } from "@prisma/client";
import { OPENCLAW_AGENTS } from "./src/lib/config/agents";

const prisma = new PrismaClient();

async function diagnose() {
  console.log("--- Diagnóstico de Agentes ---");
  try {
    const agents = await prisma.agent.findMany();
    console.log(`Total de agentes no banco: ${agents.length}`);
    
    agents.forEach(a => {
      console.log(`- [${a.code}] ${a.displayName} (Status: ${a.status})`);
    });

    console.log("\n--- Verificação de Configuração ---");
    console.log(`Agentes na lista de sync: ${OPENCLAW_AGENTS.length}`);
    
    OPENCLAW_AGENTS.forEach(cfg => {
      const found = agents.find(a => a.code === cfg.code);
      console.log(`- Config: ${cfg.code} -> ${found ? "PRESENTE" : "AUSENTE"}`);
    });

  } catch (error: any) {
    console.error("ERRO de diagnóstico:", error.message);
  } finally {
    await prisma.$disconnect();
  }
}

diagnose();
