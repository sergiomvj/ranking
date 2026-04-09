export const dynamic = "force-dynamic";
import { getAllProjectsWithTasks, deleteProjectAction } from "./actions";
import { CreateProjectForm } from "./CreateProjectForm";
import Link from "next/link";
import { ShieldCheck, Crosshair, CheckCircle2, Clock, Trash2 } from "lucide-react";

export const metadata = {
  title: "Central de Tarefas | Agent Efficiency Hub",
};

export default async function TaskCenterPage() {
  const projects = await getAllProjectsWithTasks();

  const getStatusColor = (status: string) => {
     switch(status) {
        case 'backlog': return 'bg-zinc-800 text-zinc-300 border-zinc-700';
        case 'assigned': return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
        case 'in_progress': return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
        case 'blocked': return 'bg-red-500/10 text-red-400 border-red-500/20';
        case 'completed': return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
        default: return 'bg-zinc-800 text-zinc-300 border-zinc-700';
     }
  };

  const getStatusIcon = (status: string) => {
      switch(status) {
          case 'completed': return <CheckCircle2 size={16} />;
          case 'in_progress': return <Clock size={16} />;
          default: return <Crosshair size={16} />;
      }
  };

  return (
    <div className="flex-1 lg:pl-64 flex flex-col min-h-screen bg-[#050505]">
      <header className="sticky top-0 z-40 bg-black/60 backdrop-blur-xl border-b border-white/5 h-16 flex items-center px-4 sm:px-8">
        <h1 className="text-xl font-bold bg-gradient-to-r from-emerald-400 to-cyan-500 bg-clip-text text-transparent">
          Central de Tarefas (Master Backlog)
        </h1>
      </header>

      <main className="flex-1 p-4 sm:p-8 space-y-8 max-w-7xl mx-auto w-full">
        {/* Formulário de Criação de Projeto */}
        <section className="bg-white/[0.02] border border-white/10 rounded-2xl p-6 sm:p-8 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-8 opacity-10 blur-xl scale-150 transform-gpu group-hover:opacity-20 transition-opacity">
                <ShieldCheck size={200} className="text-emerald-500" />
            </div>
            
            <div className="relative z-10 flex flex-col md:flex-row gap-8">
                <div className="flex-1">
                    <h2 className="text-2xl font-bold text-white mb-2">Despacho Universal</h2>
                    <p className="text-zinc-400 text-sm mb-6">
                        Anexe a documentação fundamental e cole o `TASKLIST.md`. O nosso Parser quebrará o Markdown em tarefas gerenciáveis conectadas à API de Pull dos Agentes.
                    </p>
                    <CreateProjectForm />
                </div>
            </div>
        </section>

        {/* Tabela de Backlog por Projetos */}
        <div className="space-y-6">
            <h3 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
                <Crosshair className="text-emerald-500" /> Backlogs Ativos
            </h3>

            {projects.length === 0 ? (
                <div className="p-8 text-center border-2 border-dashed border-white/5 rounded-2xl">
                    <p className="text-zinc-500">Nenhum projeto despachado no momento.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                    {projects.map((p) => (
                        <div key={p.id} className="bg-zinc-900/50 rounded-2xl border border-white/10 p-6 flex flex-col gap-4">
                           <div className="flex justify-between items-start border-b border-white/5 pb-4">
                               <div>
                                   <div className="flex items-center gap-2 mb-1">
                                      <span className="text-xs font-mono px-2 py-0.5 bg-blue-500/20 text-blue-400 rounded-md">
                                        ID: {p.code.split('_')[0]}
                                      </span>
                                      <h4 className="font-bold text-white text-lg">{p.name}</h4>
                                   </div>
                                   <p className="text-xs text-zinc-500 line-clamp-1">{p.documentation || "Sem documentação"}</p>
                               </div>
                               <div className="flex items-center gap-2">
                                <Link 
                                    href={`/task-center/project/${p.id}`}
                                    className="px-3 py-1 bg-white/5 hover:bg-white/10 rounded-full text-xs font-semibold text-white uppercase transition-colors"
                                >
                                    Gerenciar {p.status}
                                </Link>
                                <form action={deleteProjectAction.bind(null, p.id)}>
                                    <button type="submit" className="p-1.5 text-zinc-500 hover:text-rose-400 bg-white/5 hover:bg-rose-500/10 rounded-full transition-colors" title="Deletar Projeto">
                                      <Trash2 size={16} />
                                    </button>
                                </form>
                               </div>
                           </div>

                           <div className="space-y-3 mt-2">
                               {p.tasks.map((t) => (
                                   <div key={t.id} className={`flex items-center justify-between p-3 rounded-xl border ${getStatusColor(t.status)}`}>
                                       <div className="flex items-center gap-3">
                                           {getStatusIcon(t.status)}
                                           <div className="flex flex-col">
                                               <span className="text-sm font-medium">{t.title}</span>
                                               {t.assignedAgent && (
                                                   <span className="text-xs opacity-70">
                                                        Designado para: <strong>@{t.assignedAgent.code}</strong>
                                                   </span>
                                               )}
                                           </div>
                                       </div>
                                       <span className="uppercase text-[10px] font-bold tracking-wider opacity-80">
                                           {t.status.replace("_", " ")}
                                       </span>
                                   </div>
                               ))}
                           </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
      </main>
    </div>
  );
}
