"use client";

import { useState, useTransition } from "react";
import { RefreshCcw, CheckCircle2, AlertCircle } from "lucide-react";
import { syncAgentsAction } from "@/lib/actions/agents";

export function SyncButton() {
  const [isPending, startTransition] = useTransition();
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [counts, setCounts] = useState<{ created: number; skipped: number } | null>(null);

  const handleSync = () => {
    setStatus("idle");
    startTransition(async () => {
      const result = await syncAgentsAction();
      if (result.ok) {
        setStatus("success");
        setCounts({ created: result.created!, skipped: result.skipped! });
        
        // Reset status after 5 seconds
        setTimeout(() => setStatus("idle"), 5000);
      } else {
        setStatus("error");
      }
    });
  };

  return (
    <div className="flex flex-col items-end gap-2">
      <button
        onClick={handleSync}
        disabled={isPending || status === "success"}
        className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold transition-all duration-300 active:scale-95 disabled:opacity-70 ${
          status === "success" 
            ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" 
            : status === "error"
            ? "bg-rose-500/20 text-rose-400 border border-rose-500/30"
            : "bg-emerald-500 hover:bg-emerald-400 text-black shadow-lg shadow-emerald-500/20"
        }`}
      >
        {isPending ? (
          <RefreshCcw size={18} className="animate-spin" />
        ) : status === "success" ? (
          <CheckCircle2 size={18} />
        ) : status === "error" ? (
          <AlertCircle size={18} />
        ) : (
          <RefreshCcw size={18} />
        )}
        
        {isPending ? "Sincronizando..." : status === "success" ? "Sincronizado" : status === "error" ? "Erro ao Sincronizar" : "Sincronizar OpenClaw"}
      </button>

      {status === "success" && counts && (
        <p className="text-[10px] font-mono text-emerald-500/70 uppercase tracking-widest animate-in fade-in slide-in-from-top-1">
          +{counts.created} novos · {counts.skipped} ignorados
        </p>
      )}
    </div>
  );
}
