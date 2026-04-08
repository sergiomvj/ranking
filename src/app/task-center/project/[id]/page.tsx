import { prisma } from "../../../../lib/prisma";
import { notFound } from "next/navigation";
import { ArrowLeft, Users, Save, CheckCircle } from "lucide-react";
import Link from "next/link";
import { updateProjectDocAction, addProjectMemberAction } from "../../actions";

export default async function ProjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  
  const project = await prisma.project.findUnique({
    where: { id },
    include: {
      tasks: {
        include: { assignedAgent: true }
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

      <main className="flex-1 p-4 sm:p-8 space-y-8 max-w-5xl mx-auto w-full">
         <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            
            {/* Documentation Editor */}
            <div className="md:col-span-2 space-y-4">
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
                        rows={12}
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
                        <p className="text-sm text-zinc-500">Nenhum membro explícito alocado. Tarefas limitadas a atribuições diretas.</p>
                    ) : (
                        project.members.map(m => (
                            <div key={m.id} className="flex items-center gap-2 text-sm text-zinc-300 bg-black/40 px-3 py-2 rounded-lg">
                                <Users size={14} className="text-emerald-500"/> @{m.code}
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
                    <select name="agentId" className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none">
                        <option value="">Adicionar Agente ao Projeto...</option>
                        {availableAgents.map(a => (
                            <option value={a.id} key={a.id}>{a.displayName} (@{a.code})</option>
                        ))}
                    </select>
                    <button type="submit" className="w-full px-4 py-2 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 font-semibold rounded-lg text-sm transition-colors">
                        Alocar Membro
                    </button>
                </form>

            </div>

         </div>
      </main>
    </div>
  );
}
