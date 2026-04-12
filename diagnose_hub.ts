import { prisma } from "./src/lib/prisma";
import "dotenv/config";

async function diagnose() {
  console.log("🔍 Iniciando diagnóstico do Ranking Hub...");
  
  // 1. Teste de Banco de Dados
  console.log("\n1. Testando conexão com o Banco de Dados...");
  try {
    const agentCount = await prisma.agent.count();
    console.log(`✅ Banco de Dados: OK (Conectado)`);
    console.log(`📊 Agentes cadastrados: ${agentCount}`);
  } catch (err: any) {
    console.error(`❌ Erro no Banco: ${err.message}`);
    if (err.message.includes("SSL") || err.message.includes("TLS")) {
      console.log("💡 DICA: O banco local não suporta SSL. Verifique se o .env tem sslmode=disable e sem aspas.");
    }
  }

  // 2. Teste de API OpenClaw
  console.log("\n2. Testando validade do Token OpenClaw...");
  const apiKey = (process.env.OPENCLAW_API_KEY || "").replace(/"/g, '').trim();
  const baseUrl = "https://dashboard.fbrapps.com";
  
  if (!apiKey) {
    console.error("❌ Erro: OPENCLAW_API_KEY não encontrada no .env");
    return;
  }

  // Usamos um endpoint que sabemos que existe
  console.log(`📡 Chamando: ${baseUrl}/api/agents/mila/career`);
  try {
    const res = await fetch(`${baseUrl}/api/agents/mila/career`, {
      headers: { "Authorization": `ApiKey ${apiKey}` }
    });

    if (res.status === 200) {
      console.log(`✅ Token: OK (Sucedido - Status ${res.status})`);
    } else if (res.status === 401) {
      console.error(`❌ Token: INVÁLIDO ou EXPIRADO (Status ${res.status})`);
      const error = await res.text();
      console.log(`🔴 Resposta da API: ${error}`);
    } else {
      console.log(`⚠️ Token: Resposta inesperada (Status ${res.status})`);
      const error = await res.text();
      console.log(`🔴 Resposta da API: ${error}`);
    }
  } catch (err: any) {
    console.error(`❌ Falha de Rede: ${err.message}`);
  }
}

diagnose();
