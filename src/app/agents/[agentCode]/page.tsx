import { getAgentProfile } from "@/lib/actions/rankings";
import { ArrowLeft, Target, ShieldCheck, Activity, Award, TriangleAlert } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

export default async function AgentProfilePage({ params }: { params: Promise<{ agentCode: string }> }) {
  const resolvedParams = await params;
  const profile = await getAgentProfile(resolvedParams.agentCode, "monthly-2026-04");

  if (!profile) return notFound();

  const { agent, scorecard, recentExecutions } = profile;

  return (
    <div className="space-y-8 animate-in fade-in duration-700 ease-out">
      {/* Voltar e Header Curto */}
      <div>
         <Link href="/rankings" className="inline-flex items-center text-sm font-medium text-emerald-400 hover:text-emerald-300 transition-colors mb-4">
            <ArrowLeft size={16} className="mr-1" />
            Voltar para Rankings
         </Link>
         <div className="flex justify-between items-start">
            <div className="flex gap-6 items-center">
               <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-zinc-800 to-black border border-white/10 shadow-2xl flex items-center justify-center text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400">
                  {agent.displayName.substring(0, 2)}
               </div>
               <div>
                  <h1 className="text-3xl font-bold text-white tracking-tight">{agent.displayName}</h1>
                  <p className="text-zinc-400 font-medium">#{agent.code}</p>
                  <div className="flex items-center gap-3 mt-2">
                     <span className="px-2 py-0.5 rounded text-xs border border-white/10 bg-white/5 text-zinc-300">{agent.owningTeam?.name || "Sem Squad"}</span>
                     <span className="px-2 py-0.5 rounded text-xs border border-white/10 bg-white/5 text-zinc-300">{agent.primaryFunction?.name || "Generic"}</span>
                  </div>
               </div>
            </div>

            {scorecard && (
               <div className="text-right">
                  <p className="text-sm font-medium text-zinc-500 uppercase tracking-widest mb-1">Score Consolidado</p>
                  <div className={`text-5xl font-black ${
                     scorecard.operationalBand === 'green' ? 'text-emerald-400' :
                     scorecard.operationalBand === 'yellow' ? 'text-yellow-400' :
                     scorecard.operationalBand === 'orange' ? 'text-orange-400' :
                     'text-rose-400'
                  }`}>
                     {scorecard.scoreValue.toFixed(1)}
                  </div>
               </div>
            )}
         </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
         {/* Histórico Executivo */}
         <div className="lg:col-span-2 space-y-6">
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-sm">
               <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                  <Activity size={18} className="text-emerald-400" /> Histórico de Processamento
               </h3>
               
               <div className="space-y-4">
                  {recentExecutions.length === 0 ? (
                     <p className="text-zinc-500">Nenhuma execução computada neste ciclo.</p>
                  ) : recentExecutions.map(exec => (
                     <div key={exec.id} className="flex justify-between items-center p-3 rounded-lg border border-white/5 bg-black/20">
                        <div>
                           <p className="text-sm font-medium text-zinc-200">{exec.taskType.name}</p>
                           <p className="text-xs text-zinc-500">{new Date(exec.startedAt).toLocaleString("pt-BR")}</p>
                        </div>
                        <div>
                           <span className={`px-2 py-1 uppercase text-[10px] font-bold rounded-sm border ${
                              exec.scoreStatus === 'published' ? 'border-emerald-500/30 text-emerald-400 bg-emerald-500/10' :
                              exec.scoreStatus === 'calculated' ? 'border-cyan-500/30 text-cyan-400 bg-cyan-500/10' :
                              'border-zinc-500/30 text-zinc-400 bg-zinc-500/10'
                           }`}>{exec.scoreStatus}</span>
                        </div>
                     </div>
                  ))}
               </div>
            </div>
         </div>

         {/* Painel Lateral */}
         <div className="space-y-6">
            {/* Badges Conquistadas */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-sm">
               <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                  <Award size={18} className="text-amber-400" /> Troféus
               </h3>
               <div className="flex flex-wrap gap-2">
                  {agent.badgesAwarded.length === 0 ? (
                     <p className="text-sm text-zinc-500">Nenhuma badge concedida ainda.</p>
                  ) : agent.badgesAwarded.map(bw => (
                     <div key={bw.id} className="flex items-center gap-2 bg-gradient-to-tr from-amber-500/20 to-transparent border border-amber-500/30 px-3 py-1.5 rounded-lg text-amber-200 font-medium text-sm">
                        <Award size={14} /> {bw.badge.name}
                     </div>
                  ))}
               </div>
            </div>

            {/* Eventos Disciplinares / Consequências */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-sm">
               <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                  <TriangleAlert size={18} className="text-rose-400" /> Eventos & Auditoria
               </h3>
               <div className="space-y-3">
                  {agent.consequenceEvents.length === 0 ? (
                     <p className="text-sm text-zinc-500">Nenhum evento registrado.</p>
                  ) : agent.consequenceEvents.map(ce => (
                     <div key={ce.id} className="bg-rose-500/10 border border-rose-500/20 rounded-lg p-3">
                        <p className="text-sm text-rose-300 font-medium">{ce.rule.name}</p>
                        <p className="text-xs text-rose-400/70 mt-1">{ce.status}</p>
                     </div>
                  ))}
               </div>
            </div>
         </div>
      </div>
    </div>
  );
}
