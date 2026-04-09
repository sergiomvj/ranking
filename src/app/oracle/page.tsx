import { Brain } from "lucide-react";
import { OracleTabs } from "./OracleClient";
import { getRecommendations } from "@/lib/integrations/oracle";

export const metadata = {
  title: "ORACLE · Agent Efficiency Hub",
  description: "Motor de inteligência Claude Opus — avaliação, ranking e chat estratégico",
};

export default async function OraclePage() {
  let initialRecs: Awaited<ReturnType<typeof getRecommendations>>["recommendations"] = [];

  try {
    const { recommendations } = await getRecommendations("pending");
    initialRecs = recommendations ?? [];
  } catch {
    // ORACLE may be unavailable at build time — fail silently
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 ease-out">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-500/30 to-purple-600/20 border border-violet-500/30 flex items-center justify-center shadow-lg shadow-violet-500/10">
            <Brain size={24} className="text-violet-300" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
              ORACLE
              <span className="text-xs font-normal px-2 py-0.5 bg-violet-500/15 text-violet-400 border border-violet-500/20 rounded-full">
                Claude Opus
              </span>
            </h1>
            <p className="text-sm text-zinc-400 mt-0.5">
              Agente orquestrador de inteligência — avaliação, ranking e análise estratégica
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 px-3 py-1.5 bg-violet-500/10 border border-violet-500/20 rounded-full text-xs text-violet-400">
          <span className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-pulse" />
          Online · Opus 4.6
        </div>
      </div>

      {/* Tabs */}
      <OracleTabs initialRecs={initialRecs} />
    </div>
  );
}
