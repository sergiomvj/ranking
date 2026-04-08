import Link from "next/link";
import { LayoutDashboard, Users, ShieldAlert, Award, FileText } from "lucide-react";

export function AppSidebar() {
  return (
    <aside className="w-64 border-r border-white/10 bg-black/40 backdrop-blur-2xl hidden md:flex flex-col h-screen fixed left-0 top-0">
      <div className="p-6 h-16 flex items-center border-b border-white/5">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-400 to-cyan-500 flex items-center justify-center shadow-lg shadow-emerald-500/20">
            <Award size={18} className="text-black" />
          </div>
          <h2 className="text-lg font-bold tracking-tight text-white">Efficiency Hub</h2>
        </div>
      </div>
      
      <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
        <p className="px-4 text-xs font-semibold text-zinc-500 uppercase tracking-widest mb-4 mt-2">Plataforma</p>
        <NavItem href="/" icon={LayoutDashboard} label="Visão Geral" active />
        <NavItem href="/rankings" icon={Award} label="Rankings e Tiers" />
        <NavItem href="/agents" icon={Users} label="Agentes" />
        
        <p className="px-4 text-xs font-semibold text-zinc-500 uppercase tracking-widest mb-4 mt-8">Governança</p>
        <NavItem href="/policies" icon={FileText} label="Políticas de Score" />
        <NavItem href="/audit" icon={ShieldAlert} label="Radar e Auditoria" />
      </nav>

      <div className="p-4 border-t border-white/5">
         <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-white/5 border border-white/10">
            <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center text-sm font-medium">AD</div>
            <div className="flex-1 overflow-hidden">
               <p className="text-sm font-medium text-white truncate">Admin User</p>
               <p className="text-xs text-zinc-400 truncate">Manager</p>
            </div>
         </div>
      </div>
    </aside>
  );
}

function NavItem({ href, icon: Icon, label, active }: { href: string; icon: any; label: string; active?: boolean }) {
  return (
    <Link
      href={href}
      className={`group flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-300 ease-out ${
        active
          ? "bg-gradient-to-r from-emerald-500/10 to-transparent text-emerald-400 font-medium border border-emerald-500/20 shadow-sm"
          : "text-zinc-400 hover:text-white hover:bg-white/5"
      }`}
    >
      <Icon size={18} className={active ? "text-emerald-400" : "text-zinc-500 group-hover:text-white transition-colors"} />
      <span className="text-sm">{label}</span>
      {active && <div className="ml-auto w-1 h-4 bg-emerald-500 rounded-full animate-pulse" />}
    </Link>
  );
}
