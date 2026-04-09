const ORACLE_BASE_URL = "https://dashboard.fbrapps.com";

function getHeaders() {
  const apiKey = process.env.ORACLE_API_KEY;
  if (!apiKey) throw new Error("[ORACLE] ORACLE_API_KEY not configured.");
  return {
    "Content-Type": "application/json",
    Authorization: `ApiKey ${apiKey}`,
  };
}

// ──────────────────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────────────────

export interface OracleDimensions {
  task_completion:     { score: number; evidence: string };
  response_quality:    { score: number; evidence: string };
  protocol_adherence:  { score: number; evidence: string };
  proactivity:         { score: number; evidence: string };
  checkin_reliability: { score: number; evidence: string };
}

export interface OracleRecommendation {
  agent:            string;
  severity:         "critical" | "warning" | "info" | "positive";
  title:            string;
  description:      string;
  suggested_action: string;
  soul_patch?:      string;
}

export interface OracleEvaluationResult {
  ok:              boolean;
  evaluation_id:   number;
  overall_score:   number;
  summary:         string;
  dimensions:      OracleDimensions;
  strengths:       string[];
  concerns:        string[];
  recommendations: OracleRecommendation[];
  trend:           "improving" | "stable" | "declining";
  meta:            { model: string; tokens_in: number; tokens_out: number; duration_ms: number };
}

export interface OracleRankedAgent {
  position:         number;
  agent:            string;
  agent_name:       string;
  efficiency_score: number;
  tier:             "S" | "A" | "B" | "C" | "D";
  highlights:       string[];
  concerns:         string[];
  recommendation:   string;
}

export interface OracleRankingResult {
  ok:                      boolean;
  executive_summary:       string;
  ranking:                 OracleRankedAgent[];
  team_insights:           { best_performer: string; needs_attention: string[]; overloaded: string[]; underutilized: string[] };
  system_recommendations:  OracleRecommendation[];
  meta?:                   { duration_ms: number };
}

export interface OracleChatResult {
  ok:              boolean;
  analysis:        string;
  conclusion:      string;
  recommendations: OracleRecommendation[];
  confidence:      "high" | "medium" | "low";
  caveats:         string[];
  meta:            { duration_ms: number; tokens_in: number; tokens_out: number };
}

export interface OracleRecommendationItem {
  id:          number;
  agent:       string;
  severity:    "critical" | "warning" | "info" | "positive";
  title:       string;
  description: string;
  suggested_action: string;
  soul_patch?: string;
  status:      "pending" | "approved" | "rejected";
  created_at:  string;
}

// ──────────────────────────────────────────────────────────
// API functions
// ──────────────────────────────────────────────────────────

export async function evaluateAgent(
  agentId: string,
  periodDays = 7,
  context = ""
): Promise<OracleEvaluationResult> {
  const res = await fetch(`${ORACLE_BASE_URL}/api/oracle/evaluate`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify({ agent_id: agentId, period_days: periodDays, context }),
    signal: AbortSignal.timeout(65_000),
  });
  if (!res.ok) throw new Error(`[ORACLE evaluate] HTTP ${res.status}`);
  return res.json();
}

export async function generateRanking(
  periodDays = 7,
  context = ""
): Promise<OracleRankingResult> {
  const res = await fetch(`${ORACLE_BASE_URL}/api/oracle/ranking`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify({ period_days: periodDays, context }),
    signal: AbortSignal.timeout(65_000),
  });
  if (!res.ok) throw new Error(`[ORACLE ranking] HTTP ${res.status}`);
  return res.json();
}

export async function generateTaskList(
  prdContent: string,
  sprintName: string,
  dueDate?: string
) {
  const res = await fetch(`${ORACLE_BASE_URL}/api/oracle/tasklist`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify({ prd_content: prdContent, sprint_name: sprintName, due_date: dueDate }),
    signal: AbortSignal.timeout(65_000),
  });
  if (!res.ok) throw new Error(`[ORACLE tasklist] HTTP ${res.status}`);
  return res.json();
}

export async function askOracle(
  question: string,
  context = "",
  agentId?: string
): Promise<OracleChatResult> {
  const res = await fetch(`${ORACLE_BASE_URL}/api/oracle/custom`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify({ question, context, ...(agentId ? { agent_id: agentId } : {}) }),
    signal: AbortSignal.timeout(65_000),
  });
  if (!res.ok) throw new Error(`[ORACLE custom] HTTP ${res.status}`);
  return res.json();
}

export async function getRecommendations(
  status: "pending" | "approved" | "rejected" = "pending",
  agentId?: string,
  severity?: string
): Promise<{ ok: boolean; recommendations: OracleRecommendationItem[] }> {
  const params = new URLSearchParams({ status });
  if (agentId) params.set("agent_id", agentId);
  if (severity) params.set("severity", severity);
  const res = await fetch(`${ORACLE_BASE_URL}/api/oracle/recommendations?${params}`, {
    headers: getHeaders(),
    signal: AbortSignal.timeout(15_000),
  });
  if (!res.ok) throw new Error(`[ORACLE recommendations] HTTP ${res.status}`);
  return res.json();
}

export async function reviewRecommendation(
  id: number,
  status: "approved" | "rejected",
  reviewedBy: string
) {
  const res = await fetch(`${ORACLE_BASE_URL}/api/oracle/recommendations/${id}/review`, {
    method: "PUT",
    headers: getHeaders(),
    body: JSON.stringify({ status, reviewed_by: reviewedBy }),
    signal: AbortSignal.timeout(15_000),
  });
  if (!res.ok) throw new Error(`[ORACLE review] HTTP ${res.status}`);
  return res.json();
}

export async function getOracleHistory(limit = 20) {
  const res = await fetch(`${ORACLE_BASE_URL}/api/oracle/history?limit=${limit}`, {
    headers: getHeaders(),
    signal: AbortSignal.timeout(15_000),
  });
  if (!res.ok) throw new Error(`[ORACLE history] HTTP ${res.status}`);
  return res.json();
}
