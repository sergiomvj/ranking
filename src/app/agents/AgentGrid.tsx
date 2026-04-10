"use client";

import { useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ShieldCheck, Activity, Clock, Edit2, Tag } from "lucide-react";
import Link from "next/link";
import { EditAgentModal } from "./EditAgentModal";

interface AgentGridProps {
  initialAgents: any[];
  metadata: {
    teams: any[];
    functions: any[];
  };
}

export function AgentClientGrid({ initialAgents, metadata }: AgentGridProps) {
  const [selectedAgent, setSelectedAgent] = useState<any | null>(null);

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {initialAgents.map((agent) => (
          <AgentCard 
            key={agent.id} 
            agent={agent} 
            onEdit={() => setSelectedAgent(agent)} 
          />
        ))}
      </div>

      {selectedAgent && (
        <EditAgentModal
          agent={selectedAgent}
          teams={metadata.teams}
          functions={metadata.functions}
          onClose={() => setSelectedAgent(null)}
          onSuccess={() => {
            // Recarrega a página para ver as mudanças refletidas via revalidatePath
            window.location.reload();
          }}
        />
      )}
    </>
  );
}

function AgentCard({ agent, onEdit }: { agent: any; onEdit: () => void }) {
  const isOnline = agent.lastCheckIn && (new Date().getTime() - new Date(agent.lastCheckIn).getTime() < 1000 * 60 * 60);

  // Divide as habilidades por vírgula para exibir como tags
  const skillsList = agent.skills 
    ? agent.skills.split(",").map((s: string) => s.trim()).filter((s: string) => s !== "") 
    : [];

  return (
    <div className="group relative bg-white/[0.02] border border-white/10 rounded-2xl p-5 hover:bg-white/[0.05] hover:border-emerald-500/30 transition-all duration-300 overflow-hidden flex flex-col h-full">
      {/* Glow Effect */}
      <div className="absolute -right-4 -top-4 w-24 h-24 bg-emerald-500/10 blur-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
      
      {/* Botão de Editar (Novo) */}
      <button 
        onClick={(e) => {
          e.preventDefault();
          onEdit();
        }}
        className="absolute right-4 top-14 p-2 rounded-lg bg-white/5 border border-white/10 text-zinc-400 hover:text-white hover:bg-emerald-500/20 hover:border-emerald-500/40 opacity-0 group-hover:opacity-100 transition-all z-10"
        title="Editar Perfil no Hub"
      >
        <Edit2 size={14} />
      </button>

      <Link href={`/agents/${agent.code}`} className="flex-1">
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
            <span className="text-zinc-300 font-medium truncate ml-4 text-right">
              {agent.owningTeam?.name || "Sem Squad"}
            </span>
          </div>
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-zinc-500 flex items-center gap-1">
              <Activity size={12} /> Função
            </span>
            <span className="text-zinc-300 font-medium truncate ml-4 text-right">
              {agent.primaryFunction?.name || "Versátil"}
            </span>
          </div>
        </div>

        {/* Seção de Carreira (Novo) */}
        <div className="mt-4 pt-4 border-t border-white/5">
          <p className="text-[10px] font-bold text-emerald-500/70 uppercase tracking-widest mb-2 flex items-center gap-1">
            <GraduationCap size={10} /> Carreira / Perfil
          </p>
          <div className="text-[11px] text-zinc-400 leading-relaxed line-clamp-3 italic">
            {agent.career || "Perfil profissional ainda não definido no Hub."}
          </div>
        </div>
      </Link>

      <div className="pt-3 mt-auto border-t border-white/5 flex items-center gap-2 text-[10px] text-zinc-500">
        <Clock size={12} />
        {agent.lastCheckIn ? (
          <span>Visto há {formatDistanceToNow(new Date(agent.lastCheckIn), { locale: ptBR, addSuffix: false })}</span>
        ) : (
          <span>Nunca entrou</span>
        )}
      </div>
    </div>
  );
}
