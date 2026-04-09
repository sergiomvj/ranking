"use client";

import { useState } from "react";
import type {
  OracleRankingResult,
  OracleChatResult,
  OracleRecommendationItem,
  OracleRecommendation,
} from "@/lib/integrations/oracle";
import {
  Brain, Loader2, Send, CheckCircle, XCircle, ChevronDown, ChevronUp,
  Zap, TrendingUp, AlertTriangle, Info, Star, MessageSquare, Trophy, ClipboardList,
} from "lucide-react";

// ──────────────────────
// Tier helpers
// ──────────────────────
const TIER_STYLES: Record<string, string> = {
  S: "bg-violet-500/15 text-violet-300 border-violet-500/30",
  A: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
  B: "bg-cyan-500/15 text-cyan-300 border-cyan-500/30",
  C: "bg-yellow-500/15 text-yellow-300 border-yellow-500/30",
  D: "bg-rose-500/15 text-rose-300 border-rose-500/30",
};

const SEVERITY_STYLES: Record<string, { color: string; icon: React.FC<any> }> = {
  critical: { color: "text-rose-400 bg-rose-500/10 border-rose-500/20", icon: AlertTriangle },
  warning:  { color: "text-yellow-400 bg-yellow-500/10 border-yellow-500/20", icon: AlertTriangle },
  info:     { color: "text-cyan-400 bg-cyan-500/10 border-cyan-500/20", icon: Info },
  positive: { color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20", icon: Star },
};

const CONFIDENCE_STYLES: Record<string, string> = {
  high:   "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
  medium: "text-yellow-400 bg-yellow-500/10 border-yellow-500/20",
  low:    "text-rose-400 bg-rose-500/10 border-rose-500/20",
};

// ──────────────────────
// Sub-components
// ──────────────────────

function RecommendationBadge({ rec }: { rec: OracleRecommendation | OracleRecommendationItem }) {
  const sev = SEVERITY_STYLES[rec.severity] ?? SEVERITY_STYLES.info;
  const Icon = sev.icon;
  return (
    <div className={`flex items-start gap-3 p-3 rounded-xl border ${sev.color}`}>
      <Icon size={16} className="mt-0.5 shrink-0" />
      <div>
        <p className="text-sm font-semibold">{rec.title}</p>
        <p className="text-xs opacity-80 mt-0.5">{rec.description}</p>
        {rec.suggested_action && (
          <p className="text-xs opacity-60 mt-1 italic">→ {rec.suggested_action}</p>
        )}
      </div>
    </div>
  );
}

// ──────────────────────
// Tab: Ranking Board
// ──────────────────────

export function RankingBoard() {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<OracleRankingResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function fetchRanking() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/oracle/ranking", { method: "POST" });
      const json = await res.json();
      if (!json.ok) throw new Error(json.error || "Erro desconhecido");
      setData(json);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-white">Ranking Cross-Agente</h3>
          <p className="text-sm text-zinc-400 mt-0.5">Avaliação Opus dos últimos 7 dias — tiers S/A/B/C/D</p>
        </div>
        <button
          onClick={fetchRanking}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-violet-600/20 hover:bg-violet-600/30 border border-violet-500/30 text-violet-300 rounded-xl text-sm font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? <Loader2 size={16} className="animate-spin" /> : <Zap size={16} />}
          {loading ? "Analisando..." : "Gerar Novo Ranking"}
        </button>
      </div>

      {loading && (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <div className="relative">
            <div className="w-16 h-16 rounded-full border-2 border-violet-500/20 flex items-center justify-center">
              <Brain size={28} className="text-violet-400 animate-pulse" />
            </div>
            <div className="absolute inset-0 rounded-full border-t-2 border-violet-500 animate-spin" />
          </div>
          <p className="text-zinc-400 text-sm">O ORACLE está analisando todos os agentes...</p>
          <p className="text-zinc-600 text-xs">Isso pode levar até 45 segundos</p>
        </div>
      )}

      {error && (
        <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400 text-sm">
          {error}
        </div>
      )}

      {data && (
        <div className="space-y-6">
          {/* Executive Summary */}
          <div className="p-4 bg-violet-500/5 border border-violet-500/20 rounded-2xl">
            <p className="text-xs text-violet-400 font-semibold uppercase tracking-widest mb-2">Sumário Executivo</p>
            <p className="text-sm text-zinc-300 leading-relaxed">{data.executive_summary}</p>
          </div>

          {/* Agent Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {data.ranking?.map((agent) => (
              <div
                key={agent.agent}
                className="bg-white/5 border border-white/10 rounded-2xl p-4 hover:bg-white/[0.07] transition-all"
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <span className="text-xs text-zinc-500">#{agent.position}</span>
                    <p className="text-white font-semibold">{agent.agent_name}</p>
                    <p className="text-xs text-zinc-500">{agent.agent}</p>
                  </div>
                  <div className={`px-3 py-1 rounded-lg border text-sm font-bold ${TIER_STYLES[agent.tier] ?? TIER_STYLES.D}`}>
                    {agent.tier}
                  </div>
                </div>

                <div className="flex items-center gap-2 mb-3">
                  <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-violet-500 to-cyan-500 rounded-full"
                      style={{ width: `${agent.efficiency_score}%` }}
                    />
                  </div>
                  <span className="text-sm font-bold text-white w-8 text-right">{agent.efficiency_score}</span>
                </div>

                {agent.highlights?.length > 0 && (
                  <div className="space-y-1 mb-2">
                    {agent.highlights.map((h, i) => (
                      <p key={i} className="text-xs text-emerald-400 flex items-center gap-1.5">
                        <Star size={10} /> {h}
                      </p>
                    ))}
                  </div>
                )}
                {agent.concerns?.length > 0 && (
                  <div className="space-y-1">
                    {agent.concerns.map((c, i) => (
                      <p key={i} className="text-xs text-yellow-400 flex items-center gap-1.5">
                        <AlertTriangle size={10} /> {c}
                      </p>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Team Insights */}
          {data.team_insights && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: "Destaque", value: data.team_insights.best_performer, color: "text-emerald-400" },
                { label: "Atenção", value: data.team_insights.needs_attention?.join(", "), color: "text-yellow-400" },
                { label: "Sobrecarregado", value: data.team_insights.overloaded?.join(", "), color: "text-rose-400" },
                { label: "Subutilizado", value: data.team_insights.underutilized?.join(", "), color: "text-cyan-400" },
              ].map((item) => (
                <div key={item.label} className="p-3 bg-white/5 border border-white/10 rounded-xl">
                  <p className="text-xs text-zinc-500 mb-1">{item.label}</p>
                  <p className={`text-sm font-semibold ${item.color}`}>{item.value || "—"}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {!data && !loading && (
        <div className="flex flex-col items-center justify-center py-20 gap-3 text-center">
          <Trophy size={40} className="text-zinc-700" />
          <p className="text-zinc-400">Nenhum ranking gerado ainda</p>
          <p className="text-zinc-600 text-sm">Clique em "Gerar Novo Ranking" para o ORACLE avaliar todos os agentes</p>
        </div>
      )}
    </div>
  );
}

// ──────────────────────
// Tab: Recommendation Queue
// ──────────────────────

export function RecommendationQueue({ initialRecs }: { initialRecs: OracleRecommendationItem[] }) {
  const [recs, setRecs] = useState<OracleRecommendationItem[]>(initialRecs);
  const [processing, setProcessing] = useState<number | null>(null);

  async function handleReview(id: number, status: "approved" | "rejected") {
    setProcessing(id);
    try {
      const res = await fetch(`/api/oracle/recommendations/${id}/review`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, reviewed_by: "admin" }),
      });
      if (res.ok) {
        setRecs((prev) => prev.filter((r) => r.id !== id));
      }
    } finally {
      setProcessing(null);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-white">Fila de Recomendações</h3>
        <p className="text-sm text-zinc-400 mt-0.5">
          {recs.length > 0 ? `${recs.length} recomendação(ões) aguardando revisão` : "Nenhuma recomendação pendente"}
        </p>
      </div>

      {recs.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3 text-center">
          <CheckCircle size={40} className="text-emerald-700" />
          <p className="text-zinc-400">Todas as recomendações foram revisadas!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {recs.map((rec) => {
            const sev = SEVERITY_STYLES[rec.severity] ?? SEVERITY_STYLES.info;
            const Icon = sev.icon;
            return (
              <div key={rec.id} className="bg-white/5 border border-white/10 rounded-2xl p-4 hover:bg-white/[0.07] transition-all">
                <div className="flex items-start gap-3">
                  <div className={`p-2 rounded-lg border ${sev.color} shrink-0`}>
                    <Icon size={14} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-white font-semibold text-sm">{rec.title}</p>
                      <span className={`text-xs px-2 py-0.5 rounded-full border ${sev.color}`}>{rec.severity}</span>
                    </div>
                    <p className="text-xs text-zinc-400">{rec.description}</p>
                    {rec.suggested_action && (
                      <p className="text-xs text-zinc-500 mt-1 italic">→ {rec.suggested_action}</p>
                    )}
                    <p className="text-xs text-zinc-600 mt-2">Agente: {rec.agent}</p>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <button
                      onClick={() => handleReview(rec.id, "approved")}
                      disabled={processing === rec.id}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 text-emerald-400 rounded-lg text-xs font-medium transition-all disabled:opacity-50"
                    >
                      {processing === rec.id ? <Loader2 size={12} className="animate-spin" /> : <CheckCircle size={12} />}
                      Aprovar
                    </button>
                    <button
                      onClick={() => handleReview(rec.id, "rejected")}
                      disabled={processing === rec.id}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 text-rose-400 rounded-lg text-xs font-medium transition-all disabled:opacity-50"
                    >
                      <XCircle size={12} />
                      Rejeitar
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ──────────────────────
// Tab: Oracle Chat
// ──────────────────────

export function OracleChat() {
  const [question, setQuestion] = useState("");
  const [context, setContext] = useState("");
  const [showContext, setShowContext] = useState(false);
  const [loading, setLoading] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [response, setResponse] = useState<OracleChatResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleAsk() {
    if (!question.trim() || loading) return;
    setLoading(true);
    setResponse(null);
    setError(null);
    setElapsed(0);

    const timer = setInterval(() => setElapsed((e) => e + 1), 1000);

    try {
      const res = await fetch("/api/oracle/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question, context }),
      });
      const json = await res.json();
      if (!json.ok && !json.analysis) throw new Error(json.error || "Erro desconhecido");
      setResponse(json);
    } catch (e: any) {
      setError(e.message);
    } finally {
      clearInterval(timer);
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-white">Chat com o ORACLE</h3>
        <p className="text-sm text-zinc-400 mt-0.5">Faça qualquer pergunta estratégica ou operacional</p>
      </div>

      {/* Input Area */}
      <div className="bg-white/5 border border-white/10 rounded-2xl p-4 space-y-3">
        <textarea
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="Ex: Qual agente deveria liderar a campanha de Black Friday?"
          className="w-full bg-transparent text-white placeholder-zinc-600 text-sm resize-none outline-none leading-relaxed"
          rows={3}
          onKeyDown={(e) => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) handleAsk(); }}
        />

        {/* Context toggle */}
        <button
          onClick={() => setShowContext(!showContext)}
          className="flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
        >
          {showContext ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          {showContext ? "Ocultar contexto" : "Adicionar contexto (opcional)"}
        </button>
        {showContext && (
          <textarea
            value={context}
            onChange={(e) => setContext(e.target.value)}
            placeholder="Adicione histórico, restrições, dados relevantes..."
            className="w-full bg-black/20 border border-white/10 rounded-xl px-3 py-2 text-zinc-300 placeholder-zinc-600 text-sm resize-none outline-none"
            rows={3}
          />
        )}

        <div className="flex items-center justify-between">
          <p className="text-xs text-zinc-600">⌘ + Enter para enviar · Latência esperada: 15–45s</p>
          <button
            onClick={handleAsk}
            disabled={loading || !question.trim()}
            className="flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-500 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-xl text-sm font-medium transition-all"
          >
            {loading ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
            {loading ? "Perguntando..." : "Perguntar"}
          </button>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex flex-col items-center justify-center py-12 gap-4">
          <div className="relative">
            <div className="w-16 h-16 rounded-full border-2 border-violet-500/20 flex items-center justify-center">
              <Brain size={28} className="text-violet-400 animate-pulse" />
            </div>
            <div className="absolute inset-0 rounded-full border-t-2 border-violet-500 animate-spin" />
          </div>
          <div className="text-center">
            <p className="text-zinc-300 font-medium">O ORACLE está analisando...</p>
            <p className="text-zinc-500 text-sm mt-1">{elapsed}s · pode levar até 45s</p>
          </div>
          <div className="w-48 h-1 bg-white/10 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-violet-500 to-cyan-500 rounded-full transition-all duration-1000"
              style={{ width: `${Math.min((elapsed / 45) * 100, 95)}%` }}
            />
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400 text-sm">
          {error}
        </div>
      )}

      {/* Response */}
      {response && (
        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-500">
          {/* Analysis */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-3">
              <Brain size={16} className="text-violet-400" />
              <p className="text-xs font-semibold text-violet-400 uppercase tracking-widest">Análise</p>
            </div>
            <p className="text-sm text-zinc-300 leading-relaxed">{response.analysis}</p>
          </div>

          {/* Conclusion */}
          <div className="bg-violet-500/5 border border-violet-500/20 rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp size={16} className="text-violet-300" />
              <p className="text-xs font-semibold text-violet-300 uppercase tracking-widest">Conclusão</p>
            </div>
            <p className="text-sm text-white font-medium leading-relaxed">{response.conclusion}</p>
          </div>

          {/* Recommendations */}
          {response.recommendations?.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-semibold text-zinc-500 uppercase tracking-widest px-1">Recomendações</p>
              {response.recommendations.map((rec, i) => (
                <RecommendationBadge key={i} rec={rec} />
              ))}
            </div>
          )}

          {/* Footer */}
          <div className="flex items-center justify-between px-1">
            <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-medium ${CONFIDENCE_STYLES[response.confidence] ?? CONFIDENCE_STYLES.medium}`}>
              <Zap size={11} />
              Confiança: {response.confidence}
            </div>
            <p className="text-xs text-zinc-600">
              {response.meta?.duration_ms ? `${(response.meta.duration_ms / 1000).toFixed(1)}s` : ""}
              {response.meta?.tokens_out ? ` · ${response.meta.tokens_out} tokens` : ""}
            </p>
          </div>

          {/* Caveats */}
          {response.caveats?.length > 0 && (
            <div className="p-3 bg-yellow-500/5 border border-yellow-500/10 rounded-xl">
              <p className="text-xs text-yellow-600 font-medium mb-1">Ressalvas</p>
              {response.caveats.map((c, i) => (
                <p key={i} className="text-xs text-zinc-500">{c}</p>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ──────────────────────
// Tab Controller
// ──────────────────────

const TABS = [
  { id: "ranking", label: "Ranking", icon: Trophy },
  { id: "recommendations", label: "Recomendações", icon: ClipboardList },
  { id: "chat", label: "Chat", icon: MessageSquare },
];

export function OracleTabs({ initialRecs }: { initialRecs: OracleRecommendationItem[] }) {
  const [tab, setTab] = useState("chat");

  return (
    <div className="space-y-6">
      {/* Tab bar */}
      <div className="flex gap-1 p-1 bg-white/5 border border-white/10 rounded-2xl w-fit">
        {TABS.map((t) => {
          const Icon = t.icon;
          const active = tab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                active
                  ? "bg-violet-600/20 text-violet-300 border border-violet-500/30 shadow-sm"
                  : "text-zinc-500 hover:text-zinc-300"
              }`}
            >
              <Icon size={16} />
              {t.label}
              {t.id === "recommendations" && initialRecs.length > 0 && (
                <span className="ml-1 w-5 h-5 flex items-center justify-center bg-yellow-500/20 text-yellow-400 rounded-full text-xs font-bold">
                  {initialRecs.length}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Tab content */}
      {tab === "ranking" && <RankingBoard />}
      {tab === "recommendations" && <RecommendationQueue initialRecs={initialRecs} />}
      {tab === "chat" && <OracleChat />}
    </div>
  );
}
