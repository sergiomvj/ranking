"use client";

import { useState, useTransition } from "react";
import { X, Save, Shield, Activity, GraduationCap, Info } from "lucide-react";
import { updateAgentAction } from "@/lib/actions/agents";

interface EditAgentModalProps {
  agent: any;
  teams: any[];
  functions: any[];
  onClose: () => void;
  onSuccess: () => void;
}

export function EditAgentModal({ agent, teams, functions, onClose, onSuccess }: EditAgentModalProps) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    displayName: agent.displayName || "",
    owningTeamId: agent.owningTeamId || "",
    primaryFunctionId: agent.primaryFunctionId || "",
    career: agent.career || "",
    managerNotes: agent.managerNotes || "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    startTransition(async () => {
      const result = await updateAgentAction(agent.id, {
        displayName: formData.displayName,
        owningTeamId: formData.owningTeamId || null,
        primaryFunctionId: formData.primaryFunctionId || null,
        career: formData.career,
        managerNotes: formData.managerNotes,
      });

      if (result.ok) {
        onSuccess();
        onClose();
      } else {
        setError(result.error || "Erro ao salvar alterações");
      }
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-zinc-900 border border-white/10 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/5 bg-white/[0.02]">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              Perfil do Agente
              <span className="text-[10px] font-mono text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded uppercase">
                {agent.code}
              </span>
            </h2>
            <p className="text-xs text-zinc-500 mt-1">Dados de carreira serão sincronizados com o Master do OpenClaw.</p>
          </div>
          <button onClick={onClose} className="text-zinc-500 hover:text-white transition-colors">
            <X size={24} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="space-y-4">
            {/* Nome de Exibição */}
            <div>
              <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1.5 ml-1">
                Nome de Exibição (Hub)
              </label>
              <input
                type="text"
                required
                value={formData.displayName}
                onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                className="w-full bg-white/[0.05] border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-emerald-500/50 transition-colors"
                placeholder="Ex: Ana Beatriz Schultz"
              />
            </div>

            {/* Grid Squad/Função */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1.5 ml-1 flex items-center gap-1">
                  <Shield size={10} /> Squad ARVA
                </label>
                <select
                  value={formData.owningTeamId}
                  onChange={(e) => setFormData({ ...formData, owningTeamId: e.target.value })}
                  className="w-full bg-white/[0.05] border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-emerald-500/50 transition-colors appearance-none cursor-pointer"
                >
                  <option value="">Sem Squad</option>
                  {teams.map((t) => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1.5 ml-1 flex items-center gap-1">
                  <Activity size={10} /> Função
                </label>
                <select
                  value={formData.primaryFunctionId}
                  onChange={(e) => setFormData({ ...formData, primaryFunctionId: e.target.value })}
                  className="w-full bg-white/[0.05] border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-emerald-500/50 transition-colors appearance-none cursor-pointer"
                >
                  <option value="">Sem Função</option>
                  {functions.map((f) => (
                    <option key={f.id} value={f.id}>{f.name}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Carreira / Perfil */}
            <div>
              <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1.5 ml-1 flex items-center gap-1 text-emerald-400">
                <GraduationCap size={10} /> Carreira / Perfil (Master)
              </label>
              <textarea
                value={formData.career}
                onChange={(e) => setFormData({ ...formData, career: e.target.value })}
                rows={4}
                className="w-full bg-white/[0.05] border border-emerald-500/20 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-emerald-500/50 transition-colors resize-none shadow-inner"
                placeholder="Descreva quem é o profissional, histórico e competências principais..."
              />
            </div>

            {/* Notas do Gestor */}
            <div>
              <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1.5 ml-1 flex items-center gap-1">
                <Info size={10} /> Notas Operacionais (Hub)
              </label>
              <textarea
                value={formData.managerNotes}
                onChange={(e) => setFormData({ ...formData, managerNotes: e.target.value })}
                rows={2}
                className="w-full bg-white/[0.05] border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-emerald-500/50 transition-colors resize-none"
                placeholder="Notas internas não sincronizadas..."
              />
            </div>
          </div>

          {error && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400 text-[10px] font-mono uppercase tracking-widest text-center">
              {error}
            </div>
          )}

          {/* Footer Ações */}
          <div className="flex items-center gap-3 pt-4 border-t border-white/5">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 px-4 rounded-xl border border-white/10 text-zinc-400 font-bold text-sm hover:bg-white/5 hover:text-white transition-all active:scale-95"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="flex-1 py-3 px-4 rounded-xl bg-emerald-500 text-black font-bold text-sm hover:bg-emerald-400 transition-all active:scale-95 shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isPending ? "Sincronizando..." : (
                <>
                  <Save size={18} />
                  Salvar e Sincronizar
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
