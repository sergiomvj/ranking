import { getDashboardOverview } from "@/lib/actions/dashboard";
import { Users, Activity, Target, Trophy, AlertTriangle, ArrowUpRight, ArrowDownRight, Minus } from "lucide-react";

export default async function DashboardHome() {
  const data = await getDashboardOverview("monthly-2026-04");

  if (!data) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-center space-y-4">
        <AlertTriangle size={48} className="text-zinc-600" />
        <h1 className="text-2xl font-bold text-white">Período Não Encontrado</h1>
        <p className="text-zinc-400 max-w-sm">
          O período "monthly-2026-04" não está disponível no banco. Pode ser necessário rodar o `npm run seed`.
        </p>
      </div>
    );
  }

  const { period, agentCount, totalExecutions, bandsDistribution, topAgents, bottomAgents } = data;

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700 ease-out">
      {/* Header Info */}
      <div className="flex items-center justify-between">
        <div>
           <h2 className="text-2xl font-bold text-white tracking-tight">Período: {period.code}</h2>
           <p className="text-sm text-zinc-400 mt-1">Visão Geral Consolidada da Frota de Agentes</p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 bg-white/5 border border-white/10 rounded-full text-sm font-medium">
           <span className={`w-2 h-2 rounded-full ${period.isClosed ? 'bg-zinc-500' : 'bg-emerald-500 animate-pulse'}`} />
           {period.isClosed ? 'Avaliação Fechada' : 'Avaliação em Andamento'}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard title="Agentes Rankeados" value={agentCount} icon={Users} trend="+12%" positive />
        <KpiCard title="Execuções Processadas" value={totalExecutions} icon={Activity} trend="+4.3%" positive />
        <KpiCard title="Alta Performance (>80)" value={bandsDistribution.green} icon={Trophy} trend="Green Band" />
        <KpiCard title="Sob Alerta (<50)" value={bandsDistribution.red + bandsDistribution.orange} icon={AlertTriangle} trend="Red/Orange Band" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top 5 Agents */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-sm">
           <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                 <Trophy className="text-emerald-400" size={18} />
                 Top Performers
              </h3>
           </div>
           <div className="space-y-3">
              {topAgents.map((agent, i) => (
                 <AgentRow key={agent.id} agent={agent} index={i} type="top" />
              ))}
           </div>
        </div>

        {/* Bottom 5 Agents */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-sm">
           <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                 <Target className="text-rose-400" size={18} />
                 Atenção Requerida
              </h3>
           </div>
           <div className="space-y-3">
              {bottomAgents.map((agent, i) => (
                 <AgentRow key={agent.id} agent={agent} index={i} type="bottom" />
              ))}
           </div>
        </div>
      </div>

    </div>
  );
}

function KpiCard({ title, value, icon: Icon, trend, positive }: any) {
  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-sm hover:bg-white/[0.07] transition-all cursor-default">
      <div className="flex justify-between items-start">
        <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center mb-4">
          <Icon className="text-zinc-300" size={20} />
        </div>
        {trend && (
           <div className={`flex items-center text-xs font-medium px-2 py-1 rounded-full ${positive ? 'text-emerald-400 bg-emerald-400/10' : 'text-zinc-400 bg-white/5'}`}>
             {positive && <ArrowUpRight size={14} className="mr-1" />}
             {trend}
           </div>
        )}
      </div>
      <div>
        <p className="text-sm font-medium text-zinc-400">{title}</p>
        <h4 className="text-3xl font-bold text-white mt-1">{value}</h4>
      </div>
    </div>
  )
}

function AgentRow({ agent, index, type }: any) {
  return (
    <div className="flex items-center justify-between p-3 rounded-xl bg-black/20 border border-white/5 hover:border-white/10 transition-colors group cursor-pointer">
       <div className="flex items-center gap-4">
          <div className="w-8 flex justify-center">
             <span className={`text-sm font-bold ${index === 0 && type === 'top' ? 'text-emerald-400' : 'text-zinc-500'}`}>
               #{agent.rank}
             </span>
          </div>
          <div>
             <p className="text-sm font-medium text-white group-hover:text-emerald-300 transition-colors">{agent.displayName}</p>
             <p className="text-xs text-zinc-500">{agent.code}</p>
          </div>
       </div>
       <div className="flex items-center gap-3">
          <div className={`px-2 py-0.5 rounded text-xs font-medium border ${
             agent.band === 'green' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
             agent.band === 'yellow' ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20' :
             agent.band === 'orange' ? 'bg-orange-500/10 text-orange-400 border-orange-500/20' :
             'bg-rose-500/10 text-rose-400 border-rose-500/20'
          }`}>
            {agent.score}
          </div>
       </div>
    </div>
  )
}
