"use client";

import { useState, useEffect } from "react";
import { ShieldAlert, Check, X, ShieldCheck, AlertOctagon } from "lucide-react";
import { getPendingConsequences, resolveConsequence } from "@/lib/actions/audit";

export default function AuditPage() {
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    const data = await getPendingConsequences();
    setEvents(data.events || []);
    setLoading(false);
  }

  async function handleResolve(id: string, approve: boolean) {
    await resolveConsequence(id, approve);
    await loadData();
  }

  if (loading) {
    return <div className="text-zinc-500 flex justify-center py-10">Carregando auditoria...</div>;
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-700 ease-out max-w-5xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
             <ShieldAlert className="text-rose-400" /> Painel de Auditoria 
          </h2>
          <p className="text-sm text-zinc-400 mt-1">Revisão Humana de Alarmes e Consequências Sistêmicas (HITL)</p>
        </div>
      </div>

      <div className="space-y-4">
         {events.length === 0 ? (
            <div className="border border-white/10 bg-white/5 rounded-2xl p-10 flex flex-col items-center justify-center text-center">
               <ShieldCheck size={48} className="text-emerald-500/50 mb-4" />
               <h3 className="text-lg font-bold text-white">Nenhuma infração pendente</h3>
               <p className="text-sm text-zinc-400 mt-2">A frota está operando dentro das margens seguras e todos os alertas sistêmicos foram mitigados ou não acionados.</p>
            </div>
         ) : (
            events.map((evt) => (
               <div key={evt.id} className="border border-rose-500/20 bg-gradient-to-r from-rose-500/10 to-transparent rounded-2xl p-5 flex items-center justify-between backdrop-blur-sm group">
                  <div className="flex gap-4 items-center">
                     <div className="w-12 h-12 rounded-full bg-rose-500/20 flex items-center justify-center border border-rose-500/30">
                        <AlertOctagon className="text-rose-400" size={24} />
                     </div>
                     <div>
                        <h4 className="text-base font-bold text-white">{evt.rule.name}</h4>
                        <p className="text-sm text-zinc-400">Agente: <span className="font-semibold text-zinc-200">{evt.agent?.displayName}</span> ({evt.agent?.code})</p>
                        <p className="text-xs text-zinc-500 mt-1">Disparado em {new Date(evt.triggeredAt).toLocaleString()}</p>
                     </div>
                  </div>
                  <div className="flex gap-2">
                     <button 
                        onClick={() => handleResolve(evt.id, true)} 
                        className="px-4 py-2 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/20 rounded-lg text-sm font-semibold flex items-center gap-2 transition-colors"
                     >
                        <Check size={16} /> Confirmar Punição
                     </button>
                     <button 
                        onClick={() => handleResolve(evt.id, false)} 
                        className="px-4 py-2 bg-zinc-800 text-zinc-300 hover:bg-zinc-700 hover:text-white border border-zinc-700 rounded-lg text-sm font-semibold flex items-center gap-2 transition-colors"
                     >
                        <X size={16} /> Ignorar
                     </button>
                  </div>
               </div>
            ))
         )}
      </div>
    </div>
  );
}
