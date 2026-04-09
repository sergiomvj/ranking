export const dynamic = "force-dynamic";

import { Users, ShieldCheck, Activity, Clock } from "lucide-react";
import { getAllAgents } from "@/lib/actions/agents";
import { SyncButton } from "./SyncButton";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

export const metadata = {
  title: "Agentes | Agent Efficiency Hub",
  description: "Gerenciamento e monitoramento da frota de agentes ativos.",
};

export default async function AgentsPage() {
  const agents = await getAllAgents();

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
            Visualização completa da capacidade operacional e status em tempo real.
          </p>
        </div>
        <SyncButton />
      </div>

      {/* Grid de Agentes */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {agents.length === 0 ? (
          <div className="col-span-full py-20 text-center border-2 border-dashed border-white/5 rounded-3xl">
            <Users className="mx-auto text-zinc-700 mb-4" size={48} />
            <p className="text-zinc-500 font-medium">Nenhum agente sincronizado no momento.</p>
            <p className="text-zinc-600 text-sm mt-1">Clique no botão acima para importar do OpenClaw.</p>
          </div>
        ) : (
          agents.map((agent: any) => (
            <AgentCard key={agent.id} agent={agent} />
          ))
        )}
      </div>
    </div>
  );
}

function AgentCard({ agent }: { agent: any }) {
  const isOnline = agent.lastCheckIn && (new Date().getTime() - new Date(agent.lastCheckIn).getTime() < 1000 * 60 * 60); // 1 hora de janela

  return (
    <Link 
      href={`/agents/${agent.code}`}
      className="group relative bg-white/[0.02] border border-white/10 rounded-2xl p-5 hover:bg-white/[0.05] hover:border-emerald-500/30 transition-all duration-300 overflow-hidden"
    >
      {/* Glow Effect no Hover */}
      <div className="absolute -right-4 -top-4 w-24 h-24 bg-emerald-500/10 blur-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
      
      <div className="flex justify-between items-start mb-4">
        <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center group-hover:scale-110 transition-transform">
          <span className="text-lg font-bold text-white uppercase">{agent.code.slice(0, 2)}</span>
        </div>
        <div className={`flex items-center gap-1.5 px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
          isOnline ? 'bg-emerald-500/10 text-emerald-400' : 'bg-zinc-500/10 text-zinc-500'
        }`}>
          <span className={`w-1.5 h-1.5 rounded-full ${isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-zinc-600'}`} />
          {isOnline ? 'Online' : 'Offline'}
        </div>
      </div>

      <div>
        <h3 className="text-lg font-bold text-white group-hover:text-emerald-400 transition-colors uppercase truncate">
          {agent.displayName}
        </h3>
        <p className="text-xs text-zinc-500 font-mono tracking-tight">@{agent.code}</p>
      </div>

      <div className="mt-6 space-y-2">
        <div className="flex items-center justify-between text-[11px]">
          <span className="text-zinc-500 flex items-center gap-1">
            <ShieldCheck size={12} /> Squad
          </span>
          <span className="text-zinc-300 font-medium">{agent.owningTeam?.name || "Sem Squad"}</span>
        </div>
        <div className="flex items-center justify-between text-[11px]">
          <span className="text-zinc-500 flex items-center gap-1">
            <Activity size={12} /> Função
          </span>
          <span className="text-zinc-300 font-medium">{agent.primaryFunction?.name || "Versátil"}</span>
        </div>
        <div className="pt-3 mt-3 border-t border-white/5 flex items-center gap-2 text-[10px] text-zinc-500">
          <Clock size={12} />
          {agent.lastCheckIn ? (
            <span>Visto há {formatDistanceToNow(new Date(agent.lastCheckIn), { locale: ptBR, addSuffix: false })}</span>
          ) : (
            <span>Nunca entrou</span>
          )}
        </div>
      </div>
    </Link>
  );
}
