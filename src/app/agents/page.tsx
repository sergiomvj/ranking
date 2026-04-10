export const dynamic = "force-dynamic";

import { Users } from "lucide-react";
import { getAllAgents, getOperationalMetadata } from "@/lib/actions/agents";
import { SyncButton } from "./SyncButton";
import { AgentClientGrid } from "./AgentGrid";

export const metadata = {
  title: "Agentes | Agent Efficiency Hub",
  description: "Gerenciamento e monitoramento da frota de agentes ativos.",
};

export default async function AgentsPage() {
  // Busca dados em paralelo no servidor
  const [agents, operationalMeta] = await Promise.all([
    getAllAgents(),
    getOperationalMetadata()
  ]);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 ease-out">
      {/* Header com Ações */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight flex items-center gap-3">
            <Users className="text-emerald-500" size={28} />
            Portfolio de Agentes
          </h1>
          <p className="text-zinc-400 mt-2">
            O Hub é o dono da eficiência. Configure squads, funções e habilidades aqui.
          </p>
        </div>
        <SyncButton />
      </div>

      {/* Grid Interativo de Agentes */}
      {agents.length === 0 ? (
        <div className="py-20 text-center border-2 border-dashed border-white/5 rounded-3xl">
          <Users className="mx-auto text-zinc-700 mb-4" size={48} />
          <p className="text-zinc-500 font-medium">Nenhum agente sincronizado no momento.</p>
          <p className="text-zinc-600 text-sm mt-1">Clique no botão acima para importar do OpenClaw.</p>
        </div>
      ) : (
        <AgentClientGrid initialAgents={agents} metadata={operationalMeta} />
      )}
    </div>
  );
}
