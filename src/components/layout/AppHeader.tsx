import { Bell, Search } from "lucide-react";

export function AppHeader() {
  return (
    <header className="h-16 border-b border-white/5 bg-black/20 backdrop-blur-xl sticky top-0 z-40 flex items-center justify-between px-8">
      <div className="flex items-center gap-4">
        <h1 className="text-lg font-medium text-white">Dashboard <span className="text-zinc-500">/ Visão Geral</span></h1>
      </div>

      <div className="flex items-center gap-6">
        <div className="relative group hidden sm:block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={16} />
          <input 
            type="text" 
            placeholder="Buscar agente, time ou política..." 
            className="w-64 bg-white/5 border border-white/10 rounded-full pl-10 pr-4 py-1.5 text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all group-hover:bg-white/10"
          />
        </div>
        
        <button className="relative p-2 text-zinc-400 hover:text-white transition-colors">
          <Bell size={20} />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-emerald-500 rounded-full border border-black animate-pulse" />
        </button>
      </div>
    </header>
  );
}
