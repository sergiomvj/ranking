import { prisma } from "../../../../lib/prisma";
import { notFound } from "next/navigation";
import { ArrowLeft, Users, Save, CheckCircle, X, ListTodo, UserPlus, ArrowRight } from "lucide-react";
import Link from "next/link";
import { 
    updateProjectDocAction, 
    addProjectMemberAction, 
    removeProjectMemberAction,
    updateTaskStatusAction,
    assignTaskToAgentAction
} from "../../actions";

export default async function ProjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  
  const project = await prisma.project.findUnique({
    where: { id },
    include: {
      tasks: {
        include: { assignedAgent: true },
        orderBy: { createdAt: 'asc' }
      },
      members: true
    }
  });

  if (!project) return notFound();

  const allAgents = await prisma.agent.findMany({
     where: { status: "active" },
     orderBy: { displayName: "asc" }
  });

  // Filter agents not already in the project
  const availableAgents = allAgents.filter(a => !project.members.some(m => m.id === a.id));

  const getStatusColor = (status: string) => {
    switch(status) {
       case 'backlog': return 'text-zinc-500 border-zinc-900 bg-zinc-900/50';
       case 'assigned': return 'text-blue-400 border-blue-500/20 bg-blue-500/10';
       case 'in_progress': return 'text-amber-400 border-amber-500/20 bg-amber-500/10';
       case 'blocked': return 'text-rose-400 border-rose-500/20 bg-rose-500/10';
       case 'completed': return 'text-emerald-400 border-emerald-500/20 bg-emerald-500/10';
       default: return 'text-zinc-500 border-white/5 bg-white/5';
    }
  };

  return (
    <div className="flex-1 lg:pl-64 flex flex-col min-h-screen bg-[#050505]">
      <header className="sticky top-0 z-40 bg-black/60 backdrop-blur-xl border-b border-white/5 h-16 flex items-center px-4 sm:px-8 gap-4">
        <Link href="/task-center" className="text-zinc-400 hover:text-white transition-colors">
            <ArrowLeft size={20} />
        </Link>
        <h1 className="text-xl font-bold bg-gradient-to-r from-emerald-400 to-cyan-500 bg-clip-text text-transparent">
          Projeto: {project.name}
        </h1>
      </header>

      <main className="flex-1 p-4 sm:p-8 space-y-8 max-w-6xl mx-auto w-full">
         <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Documentation Editor */}
            <div className="lg:col-span-2 space-y-4">
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                    <CheckCircle className="text-emerald-500" size={18}/> Baseline & Documentação
                </h2>
                <form action={async (formData) => {
                    "use server";
                    const doc = formData.get("doc") as string;
                    await updateProjectDocAction(project.id, doc);
                }} className="flex flex-col gap-3">
                    <textarea 
                        name="doc"
                        defaultValue={project.documentation || ""}
                        rows={10}
                        className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-emerald-500/50 resize-y font-mono"
                    />
                    <button type="submit" className="self-end px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-lg flex items-center gap-2 text-sm transition-colors">
                        <Save size={16} /> Salvar Edições
                    </button>
                </form>
            </div>

            {/* Members Panel */}
            <div className="space-y-4">
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                    <Users className="text-emerald-500" size={18}/> Equipe do Projeto
                </h2>
                
                <div className="bg-white/5 border border-white/10 rounded-xl p-4 flex flex-col gap-3">
                    {project.members.length === 0 ? (
                        <p className="text-sm text-zinc-500">Nenhum membro alocado. Agentes do check-in automático aparecerão aqui.</p>
                    ) : (
                        project.members.map(m => (
                            <div key={m.id} className="flex items-center justify-between text-sm text-zinc-300 bg-black/40 px-3 py-2 rounded-lg group">
                                <div className="flex items-center gap-2">
                                    <Users size={14} className="text-emerald-500"/> @{m.code}
                                </div>
                                <form action={removeProjectMemberAction.bind(null, project.id, m.id)}>
                                   <button type="submit" className="opacity-0 group-hover:opacity-100 text-zinc-500 hover:text-rose-400 transition-all p-1" title="Desalocar">
                                      <X size={14} />
                                   </button>
                                </form>
                            </div>
                        ))
                    )}
                </div>

                <form action={async (formData) => {
                    "use server";
                    const agentId = formData.get("agentId") as string;
                    if (agentId) {
                        await addProjectMemberAction(project.id, agentId);
                    }
                }} className="flex flex-col gap-2 pt-2 border-t border-white/5">
                    <select name="agentId" className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none appearance-none">
                        <option value="">Adicionar Agente ao Projeto...</option>
                        {availableAgents.map(a => (
                            <option value={a.id} key={a.id}>{a.displayName} (@{a.code})</option>
                        ))}
                    </select>
                    <button type="submit" className="w-full px-4 py-2 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 font-semibold rounded-lg text-sm transition-colors flex items-center justify-center gap-2">
                        <UserPlus size={16} /> Alocar Membro
                    </button>
                </form>
            </div>
         </div>

         {/* Task Management Section */}
         <div className="space-y-6 pt-8 border-t border-white/5">
            <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-white flex items-center gap-3">
                    <ListTodo className="text-emerald-500" size={22}/> Gestão de Backlog Granular
                </h2>
                <span className="text-xs font-mono text-zinc-500 uppercase tracking-widest bg-white/5 px-3 py-1 rounded-full border border-white/10">
                    {project.tasks.length} Tarefas Mapeadas
                </span>
            </div>

            <div className="grid grid-cols-1 gap-4">
                {project.tasks.map(task => (
                    <div key={task.id} className="bg-white/[0.02] border border-white/10 rounded-2xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-6 group hover:bg-white/[0.04] transition-colors">
                        <div className="flex-1 space-y-1">
                            <div className="flex items-center gap-3">
                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${getStatusColor(task.status)}`}>
                                    {task.status.replace('_', ' ')}
                                </span>
                                <h4 className="font-bold text-white text-lg">{task.title}</h4>
                            </div>
                            <p className="text-xs text-zinc-500 line-clamp-1 italic">{task.priority ? `Prioridade: ${task.priority}` : 'Prioridade padrão'}</p>
                        </div>

                        <div className="flex flex-wrap items-center gap-4">
                            {/* Assignee Manager */}
                            <form action={async (formData) => {
                                "use server";
                                const agentId = formData.get("agentId") as string;
                                await assignTaskToAgentAction(task.id, agentId || null);
                            }} className="flex items-center gap-2">
                                <label className="text-[10px] uppercase font-bold text-zinc-500">Agente:</label>
                                <select 
                                    name="agentId" 
                                    defaultValue={task.assignedAgentId || ""}
                                    onChange={(e) => (e.target.form as HTMLFormElement).requestSubmit()}
                                    className="bg-black/40 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-zinc-300 focus:outline-none focus:border-emerald-500/50 appearance-none min-w-[140px]"
                                >
                                    <option value="">Não Atribuído</option>
                                    {project.members.map(m => (
                                        <option value={m.id} key={m.id}>@{m.code}</option>
                                    ))}
                                </select>
                            </form>

                            {/* Status Manager */}
                            <form action={async (formData) => {
                                "use server";
                                const status = formData.get("status") as string;
                                await updateTaskStatusAction(task.id, status);
                            }} className="flex items-center gap-2">
                                <label className="text-[10px] uppercase font-bold text-zinc-500">Status:</label>
                                <select 
                                    name="status" 
                                    defaultValue={task.status}
                                    onChange={(e) => (e.target.form as HTMLFormElement).requestSubmit()}
                                    className="bg-black/40 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-zinc-300 focus:outline-none focus:border-emerald-500/50 appearance-none"
                                >
                                    <option value="backlog">Backlog</option>
                                    <option value="assigned">Assigned</option>
                                    <option value="in_progress">In Progress</option>
                                    <option value="blocked">Blocked</option>
                                    <option value="completed">Completed</option>
                                </select>
                            </form>

                            <Link 
                                href={`/agents/${task.assignedAgent?.code || ""}`}
                                className={`p-2 rounded-lg bg-white/5 border border-white/10 text-zinc-500 hover:text-white transition-colors ${!task.assignedAgent ? 'pointer-events-none opacity-20' : ''}`}
                                title="Ver Perfil do Agente"
                            >
                                <ArrowRight size={16} />
                            </Link>
                        </div>
                    </div>
                ))}
            </div>
         </div>
      </main>
    </div>
  );
}
