"use client";

import { useState, useEffect } from "react";
import { X, Brain, MessageSquare, User, Clock, CheckCircle, AlertTriangle } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { getAgentSessions } from "@/lib/actions/agents";

interface AgentMemoryModalProps {
  agent: any;
  onClose: () => void;
}

export function AgentMemoryModal({ agent, onClose }: AgentMemoryModalProps) {
  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadSessions() {
      const data = await getAgentSessions(agent.id);
      setSessions(data);
      setLoading(false);
    }
    loadSessions();
  }, [agent.id]);

  const activeThreadsCount = sessions.length;
  const memoryHealth = activeThreadsCount > 15 ? "warning" : activeThreadsCount > 5 ? "medium" : "good";
  
  const healthColors = {
    good: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
    medium: "text-amber-400 bg-amber-500/10 border-amber-500/20",
    warning: "text-rose-400 bg-rose-500/10 border-rose-500/20",
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-zinc-900 border border-white/10 rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/5 bg-white/[0.02]">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-500">
              <Brain size={28} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                Session Bridge
                <span className="text-[10px] font-mono text-zinc-500 bg-white/5 px-2 py-0.5 rounded uppercase">
                  v1.1
                </span>
              </h2>
              <p className="text-xs text-zinc-500 mt-0.5">Memória cross-canal do agente {agent.displayName}.</p>
            </div>
          </div>
          <button onClick={onClose} className="text-zinc-500 hover:text-white transition-colors">
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-8">
          {/* Memory Health Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className={`p-4 rounded-2xl border ${healthColors[memoryHealth]}`}>
              <p className="text-[10px] font-bold uppercase tracking-widest opacity-70">Saúde da Memória</p>
              <p className="text-2xl font-bold mt-1 uppercase">{memoryHealth === 'good' ? 'Excelente' : memoryHealth === 'medium' ? 'Estável' : 'Sobrecarga'}</p>
            </div>
            <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
              <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Threads Ativas</p>
              <div className="flex items-end gap-2 mt-1">
                <p className="text-2xl font-bold text-white">{activeThreadsCount}</p>
                <p className="text-sm text-zinc-600 mb-1 font-medium">/ 20</p>
              </div>
            </div>
            <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
              <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Retenção (TTL)</p>
              <p className="text-2xl font-bold text-white mt-1 uppercase">72 Horas</p>
            </div>
          </div>

          {loading ? (
            <div className="py-20 flex flex-col items-center justify-center text-zinc-600 gap-4">
              <div className="w-8 h-8 border-2 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin" />
              <p className="text-sm font-medium animate-pulse">Sincronizando ponte de memória...</p>
            </div>
          ) : sessions.length === 0 ? (
            <div className="py-20 text-center border-2 border-dashed border-white/5 rounded-3xl">
              <MessageSquare className="mx-auto text-zinc-700 mb-4" size={48} />
              <p className="text-zinc-500 font-medium">Nenhuma thread de memória ativa.</p>
              <p className="text-zinc-600 text-sm mt-1">O agente não interagiu recentemente com usuários externos.</p>
            </div>
          ) : (
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-2">
                <MessageSquare size={16} /> Threads no Bridge
              </h3>
              <div className="space-y-3">
                {sessions.map((session: any) => (
                  <div key={session.id} className="bg-white/[0.03] border border-white/5 hover:border-white/10 rounded-2xl p-5 transition-all">
                    <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                      <div className="space-y-3 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-500 text-[9px] font-bold uppercase tracking-wider">
                            {session.sourceSystem}
                          </span>
                          <span className="text-[11px] font-mono text-zinc-500 truncate max-w-[200px]">
                            ID: {session.externalSessionId}
                          </span>
                        </div>
                        
                        <div>
                          <p className="text-[10px] font-bold text-zinc-600 uppercase mb-1">Contexto Acumulado</p>
                          <p className="text-sm text-zinc-300 leading-relaxed italic">
                            "{session.contextSummary || "Resumo preliminar da conversa em desenvolvimento..."}"
                          </p>
                        </div>

                        {session.activeThreads && Array.isArray(session.activeThreads) && session.activeThreads.length > 0 && (
                          <div className="flex flex-wrap gap-2 pt-1">
                            {session.activeThreads.map((thread: string, idx: number) => (
                              <span key={idx} className="text-[10px] text-zinc-500 bg-white/5 px-2 py-1 rounded-lg border border-white/5">
                                #{thread}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      <div className="flex flex-col md:items-end gap-3 text-right">
                        <div className="flex items-center gap-1.5 text-[10px] text-zinc-500 font-medium">
                          <Clock size={12} />
                          Ativo há {formatDistanceToNow(new Date(session.lastInteraction), { locale: ptBR })}
                        </div>
                        <button className="text-[10px] font-bold text-emerald-500/70 hover:text-emerald-400 uppercase tracking-widest flex items-center gap-1 bg-emerald-500/5 px-3 py-1.5 rounded-lg border border-emerald-500/10 hove:bg-emerald-500/10 transition-all">
                          Promover para MEMORY.md
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-white/5 bg-white/[0.01] flex items-center justify-between">
          <div className="flex items-center gap-2 text-rose-500/50">
            <AlertTriangle size={14} />
            <p className="text-[10px] font-medium uppercase tracking-widest underline decoration-rose-500/20">Purgar memória (Reset SMT)</p>
          </div>
          <button
            onClick={onClose}
            className="py-2 px-6 rounded-xl border border-white/10 text-sm font-bold text-zinc-400 hover:text-white hover:bg-white/5 transition-all"
          >
            Fechar Auditoria
          </button>
        </div>
      </div>
    </div>
  );
}
