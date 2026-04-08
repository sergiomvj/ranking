import { getAllAgentsWithSessions, updateManagerNotesAction } from "./actions";
import { Clock, MessageSquareQuote, CheckCircle, Save } from "lucide-react";

export const metadata = {
  title: "Punch Clock | Agent Efficiency Hub",
};

export default async function TimeclockPage() {
  const agents = await getAllAgentsWithSessions();

  // Helper to check if they checked in within the last 12 hours (today)
  const isOnlineToday = (lastCheckIn: Date | null) => {
     if (!lastCheckIn) return false;
     const hrDiff = (new Date().getTime() - lastCheckIn.getTime()) / (1000 * 60 * 60);
     return hrDiff < 12;
  };

  return (
    <div className="flex-1 lg:pl-64 flex flex-col min-h-screen bg-[#050505]">
      <header className="sticky top-0 z-40 bg-black/60 backdrop-blur-xl border-b border-white/5 h-16 flex items-center px-4 sm:px-8">
        <h1 className="text-xl font-bold bg-gradient-to-r from-emerald-400 to-cyan-500 bg-clip-text text-transparent flex items-center gap-2">
          <Clock size={20} /> Punch Clock & Diretrizes
        </h1>
      </header>

      <main className="flex-1 p-4 sm:p-8 space-y-8 max-w-6xl mx-auto w-full">
        
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
           {agents.map(agent => {
              const online = isOnlineToday(agent.lastCheckIn);
              
              return (
                  <div key={agent.id} className="bg-white/[0.02] border border-white/10 rounded-2xl p-5 flex flex-col relative group overflow-hidden">
                      {/* Status indicator line */}
                      <div className={`absolute top-0 left-0 w-full h-1 ${online ? 'bg-emerald-500' : 'bg-white/10'}`} />

                      <div className="flex justify-between items-start mb-4">
                         <div>
                            <div className="flex items-center gap-2">
                                <span className={`w-2 h-2 rounded-full ${online ? 'bg-emerald-500 animate-pulse' : 'bg-zinc-600'}`} />
                                <h3 className="font-bold text-white tracking-tight">{agent.displayName}</h3>
                            </div>
                            <span className="text-xs text-zinc-500 block mt-1">@{agent.code} | {agent.status}</span>
                         </div>
                         {online && (
                            <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-400 uppercase bg-emerald-500/10 px-2 py-0.5 rounded-full">
                               <CheckCircle size={10} /> Shift Ativo
                            </span>
                         )}
                      </div>

                      <div className="mt-2 flex-1">
                          <p className="text-xs font-semibold text-zinc-500 mb-2 flex items-center gap-1">
                             <MessageSquareQuote size={12} /> Diretriz Diária Reativa (Ao bater ponto)
                          </p>
                          <form 
                              action={async (formData) => {
                                  "use server";
                                  const notes = formData.get("notes") as string;
                                  await updateManagerNotesAction(agent.id, notes);
                              }}
                              className="relative"
                          >
                             <textarea 
                                name="notes"
                                defaultValue={agent.managerNotes || ""}
                                rows={4}
                                placeholder="Passe as prioridades para a I.A aqui..."
                                className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-sm text-zinc-300 focus:outline-none focus:border-emerald-500/50 resize-none font-mono"
                             />
                             <button type="submit" className="absolute bottom-3 right-3 text-emerald-500 hover:text-emerald-400 p-1.5 bg-black rounded-lg border border-white/10 transition-colors" title="Salvar Diretriz">
                                <Save size={14} />
                             </button>
                          </form>
                      </div>

                      <div className="mt-4 pt-4 border-t border-white/5 flex items-center justify-between text-xs text-zinc-500">
                          <span>Último Check-In:</span>
                          <span className="font-mono text-zinc-400">
                              {agent.lastCheckIn ? agent.lastCheckIn.toLocaleString('pt-BR') : 'Nunca operou na v5'}
                          </span>
                      </div>
                  </div>
              )
           })}
        </div>

      </main>
    </div>
  );
}
