"use client";

import { useTransition } from "react";
import { createProjectAction } from "./actions";
import { Loader2 } from "lucide-react";

export function CreateProjectForm() {
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      await createProjectAction(formData);
      (e.target as HTMLFormElement).reset();
    });
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div>
         <label htmlFor="name" className="block text-sm font-medium text-zinc-400 mb-1">Nome do Projeto</label>
         <input 
            type="text" 
            name="name" 
            id="name" 
            required 
            placeholder="Ex: Campanha de Lançamento Arva v2"
            className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-emerald-500/50"
         />
      </div>

      <div>
         <label htmlFor="documentation" className="block text-sm font-medium text-zinc-400 mb-1">Documentação Inicial / Briefing</label>
         <textarea 
            name="documentation" 
            id="documentation" 
            rows={3}
            placeholder="Cole aqui o guideline, base de dados ou regras de negócio que os bots precisam ler."
            className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-emerald-500/50 resize-y"
         />
      </div>

      <div>
         <label htmlFor="tasklist" className="block text-sm font-medium text-zinc-400 mb-1">Upload de TASKLIST (Markdown)</label>
         <textarea 
            name="tasklist" 
            id="tasklist" 
            required
            rows={5}
            placeholder={`## Fase 1
- [ ] Analisar concorrência @LIRA-01
- [ ] Criar Copywriter base @NARA-01
- [ ] Aprovar Textos`}
            className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm font-mono text-zinc-300 focus:outline-none focus:border-emerald-500/50 resize-y"
         />
      </div>

      <button 
        type="submit" 
        disabled={isPending}
        className="self-start mt-2 px-6 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-black font-semibold rounded-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
      >
        {isPending ? (
            <><Loader2 size={18} className="animate-spin" /> Injetando...</>
        ) : (
            "Despachar Projeto e Tarefas"
        )}
      </button>
    </form>
  );
}
