# SQL Completo das Tabelas — Ranking de Eficiência de Agentes Virtuais

> Banco alvo: **PostgreSQL 16+**  
> Objetivo: suportar catálogo organizacional, ingestão, avaliação, score por tarefa, score por período, badges, consequências, auditoria, revisões e snapshots publicados.

## 1. Premissas

- Todas as entidades principais usam UUID.
- Scores são armazenados em decimal `numeric(5,2)` de 0 a 100.
- Histórico nunca deve ser sobrescrito silenciosamente.
- O script abaixo privilegia integridade, rastreabilidade e versionamento.
- Comentários explicativos foram mantidos para facilitar implementação.

---

## 2. Extensões

```sql
create extension if not exists pgcrypto;
create extension if not exists citext;
```

---

## 3. Tipos Enumerados

```sql
do $$
begin
  if not exists (select 1 from pg_type where typname = 'app_role_code') then
    create type app_role_code as enum (
      'viewer_internal',
      'manager_operational',
      'auditor_restricted',
      'admin_platform'
    );
  end if;

  if not exists (select 1 from pg_type where typname = 'agent_status') then
    create type agent_status as enum (
      'draft',
      'active',
      'inactive',
      'suspended',
      'archived'
    );
  end if;

  if not exists (select 1 from pg_type where typname = 'period_type') then
    create type period_type as enum (
      'daily',
      'weekly',
      'monthly',
      'quarterly',
      'custom'
    );
  end if;

  if not exists (select 1 from pg_type where typname = 'task_criticality') then
    create type task_criticality as enum (
      'low',
      'medium',
      'high',
      'critical'
    );
  end if;

  if not exists (select 1 from pg_type where typname = 'task_complexity') then
    create type task_complexity as enum (
      'simple',
      'standard',
      'complex',
      'exceptional'
    );
  end if;

  if not exists (select 1 from pg_type where typname = 'event_ingestion_status') then
    create type event_ingestion_status as enum (
      'received',
      'validated',
      'duplicate',
      'invalid',
      'normalized',
      'failed'
    );
  end if;

  if not exists (select 1 from pg_type where typname = 'execution_status') then
    create type execution_status as enum (
      'pending',
      'evaluated',
      'rejected',
      'needs_review',
      'superseded'
    );
  end if;

  if not exists (select 1 from pg_type where typname = 'score_status') then
    create type score_status as enum (
      'provisional',
      'published',
      'reprocessed',
      'revoked'
    );
  end if;

  if not exists (select 1 from pg_type where typname = 'visibility_layer') then
    create type visibility_layer as enum (
      'internal_wide',
      'operational',
      'audit_restricted'
    );
  end if;

  if not exists (select 1 from pg_type where typname = 'badge_award_status') then
    create type badge_award_status as enum (
      'active',
      'revoked',
      'expired'
    );
  end if;

  if not exists (select 1 from pg_type where typname = 'review_status') then
    create type review_status as enum (
      'open',
      'in_analysis',
      'approved',
      'rejected',
      'expired',
      'cancelled'
    );
  end if;

  if not exists (select 1 from pg_type where typname = 'review_decision_type') then
    create type review_decision_type as enum (
      'maintained',
      'adjusted',
      'invalidated'
    );
  end if;

  if not exists (select 1 from pg_type where typname = 'consequence_status') then
    create type consequence_status as enum (
      'suggested',
      'pending_confirmation',
      'applied',
      'dismissed',
      'expired'
    );
  end if;

  if not exists (select 1 from pg_type where typname = 'consequence_action_type') then
    create type consequence_action_type as enum (
      'increase_autonomy',
      'require_human_review',
      'limit_critical_tasks',
      'training_plan',
      'monitoring_intensified',
      'public_recognition',
      'priority_routing',
      'manual_intervention'
    );
  end if;

  if not exists (select 1 from pg_type where typname = 'actor_type') then
    create type actor_type as enum (
      'user',
      'system',
      'service'
    );
  end if;

  if not exists (select 1 from pg_type where typname = 'audit_event_type') then
    create type audit_event_type as enum (
      'login',
      'access_denied',
      'view_sensitive_record',
      'export_requested',
      'export_downloaded',
      'policy_created',
      'policy_published',
      'policy_archived',
      'period_opened',
      'period_closed',
      'period_reprocessed',
      'badge_awarded',
      'badge_revoked',
      'review_opened',
      'review_decided',
      'manual_override',
      'data_updated'
    );
  end if;
end $$;
```

---

## 4. Função utilitária para `updated_at`

```sql
create or replace function set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;
```

---

## 5. Usuários, Papéis e Permissões

```sql
create table if not exists app_users (
  id uuid primary key default gen_random_uuid(),
  external_auth_id text unique,
  email citext not null unique,
  full_name text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists app_user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references app_users(id) on delete cascade,
  role_code app_role_code not null,
  team_id uuid null,
  function_id uuid null,
  created_at timestamptz not null default now(),
  unique (user_id, role_code, team_id, function_id)
);
```

> Observação: `team_id` e `function_id` recebem FK depois da criação das tabelas correspondentes.

---

## 6. Estrutura Organizacional

```sql
create table if not exists teams (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  description text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists functions_catalog (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  description text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists agents (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  display_name text not null,
  description text,
  status agent_status not null default 'draft',
  primary_function_id uuid references functions_catalog(id),
  owning_team_id uuid references teams(id),
  started_at timestamptz,
  ended_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists agent_team_assignments (
  id uuid primary key default gen_random_uuid(),
  agent_id uuid not null references agents(id) on delete cascade,
  team_id uuid not null references teams(id),
  started_at timestamptz not null,
  ended_at timestamptz,
  is_current boolean not null default true,
  created_at timestamptz not null default now(),
  unique (agent_id, team_id, started_at)
);

create table if not exists agent_function_assignments (
  id uuid primary key default gen_random_uuid(),
  agent_id uuid not null references agents(id) on delete cascade,
  function_id uuid not null references functions_catalog(id),
  started_at timestamptz not null,
  ended_at timestamptz,
  is_primary boolean not null default false,
  is_current boolean not null default true,
  created_at timestamptz not null default now(),
  unique (agent_id, function_id, started_at)
);
```

---

## 7. Catálogo de Tarefas e Métricas

```sql
create table if not exists task_types (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  description text,
  default_criticality task_criticality not null default 'medium',
  default_complexity task_complexity not null default 'standard',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists metric_catalog (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  description text,
  min_value numeric(10,4) not null default 0,
  max_value numeric(10,4) not null default 100,
  default_weight numeric(8,4) not null default 0,
  score_direction text not null default 'higher_is_better',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
```

---

## 8. Políticas, Versões, Pesos e Thresholds

```sql
create table if not exists scoring_policies (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  description text,
  owner_user_id uuid references app_users(id),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists scoring_policy_versions (
  id uuid primary key default gen_random_uuid(),
  policy_id uuid not null references scoring_policies(id) on delete cascade,
  version_number integer not null,
  status text not null check (status in ('draft', 'published', 'archived')),
  valid_from timestamptz not null,
  valid_to timestamptz,
  rationale text,
  created_by uuid references app_users(id),
  published_by uuid references app_users(id),
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (policy_id, version_number)
);

create table if not exists scoring_policy_metric_weights (
  id uuid primary key default gen_random_uuid(),
  policy_version_id uuid not null references scoring_policy_versions(id) on delete cascade,
  metric_id uuid not null references metric_catalog(id),
  function_id uuid null references functions_catalog(id),
  weight numeric(8,4) not null check (weight >= 0),
  is_required boolean not null default true,
  cap_if_missing numeric(5,2),
  created_at timestamptz not null default now(),
  unique (policy_version_id, metric_id, function_id)
);

create table if not exists scoring_policy_thresholds (
  id uuid primary key default gen_random_uuid(),
  policy_version_id uuid not null references scoring_policy_versions(id) on delete cascade,
  threshold_code text not null,
  threshold_value numeric(10,4) not null,
  description text,
  created_at timestamptz not null default now(),
  unique (policy_version_id, threshold_code)
);

create table if not exists scoring_policy_task_weights (
  id uuid primary key default gen_random_uuid(),
  policy_version_id uuid not null references scoring_policy_versions(id) on delete cascade,
  task_type_id uuid null references task_types(id),
  criticality task_criticality null,
  complexity task_complexity null,
  weight_factor numeric(8,4) not null check (weight_factor > 0),
  created_at timestamptz not null default now()
);
```

---

## 9. Ingestão de Eventos Brutos

```sql
create table if not exists ingestion_events (
  id uuid primary key default gen_random_uuid(),
  source_system text not null,
  source_event_id text,
  dedup_hash text not null,
  agent_id uuid references agents(id),
  task_type_id uuid references task_types(id),
  received_at timestamptz not null default now(),
  occurred_at timestamptz,
  ingestion_status event_ingestion_status not null default 'received',
  error_message text,
  payload jsonb not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique (dedup_hash)
);

create index if not exists idx_ingestion_events_agent_id on ingestion_events(agent_id);
create index if not exists idx_ingestion_events_task_type_id on ingestion_events(task_type_id);
create index if not exists idx_ingestion_events_received_at on ingestion_events(received_at desc);
create index if not exists idx_ingestion_events_status on ingestion_events(ingestion_status);
```

---

## 10. Execuções Normalizadas e Score por Tarefa

```sql
create table if not exists task_executions (
  id uuid primary key default gen_random_uuid(),
  ingestion_event_id uuid unique references ingestion_events(id) on delete set null,
  agent_id uuid not null references agents(id),
  team_id uuid references teams(id),
  function_id uuid references functions_catalog(id),
  task_type_id uuid not null references task_types(id),
  policy_version_id uuid references scoring_policy_versions(id),
  external_reference text,
  started_at timestamptz,
  completed_at timestamptz,
  criticality task_criticality not null,
  complexity task_complexity not null,
  execution_status execution_status not null default 'pending',
  confidence_factor numeric(6,4) not null default 1.0000 check (confidence_factor >= 0 and confidence_factor <= 1.5),
  penalty_points numeric(6,2) not null default 0,
  cap_score numeric(5,2),
  score_raw numeric(5,2),
  score_final numeric(5,2),
  score_status score_status not null default 'provisional',
  sample_eligible boolean not null default true,
  explanation jsonb not null default '{}'::jsonb,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (score_raw is null or (score_raw >= 0 and score_raw <= 100)),
  check (score_final is null or (score_final >= 0 and score_final <= 100)),
  check (cap_score is null or (cap_score >= 0 and cap_score <= 100))
);

create index if not exists idx_task_executions_agent_period on task_executions(agent_id, completed_at desc);
create index if not exists idx_task_executions_team_period on task_executions(team_id, completed_at desc);
create index if not exists idx_task_executions_function_period on task_executions(function_id, completed_at desc);
create index if not exists idx_task_executions_policy on task_executions(policy_version_id);
create index if not exists idx_task_executions_task_type on task_executions(task_type_id);
create index if not exists idx_task_executions_status on task_executions(execution_status, score_status);

create table if not exists execution_metric_scores (
  id uuid primary key default gen_random_uuid(),
  execution_id uuid not null references task_executions(id) on delete cascade,
  metric_id uuid not null references metric_catalog(id),
  raw_value numeric(10,4),
  normalized_value numeric(10,4),
  applied_weight numeric(8,4) not null default 0,
  weighted_points numeric(10,4) not null default 0,
  metric_status text not null default 'computed' check (metric_status in ('computed', 'missing', 'capped', 'invalidated')),
  explanation text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique (execution_id, metric_id)
);

create index if not exists idx_execution_metric_scores_execution on execution_metric_scores(execution_id);

create table if not exists execution_evidences (
  id uuid primary key default gen_random_uuid(),
  execution_id uuid not null references task_executions(id) on delete cascade,
  visibility visibility_layer not null default 'audit_restricted',
  evidence_type text not null,
  storage_path text,
  signed_url_expires_at timestamptz,
  content_hash text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_execution_evidences_execution on execution_evidences(execution_id);

create table if not exists execution_penalties (
  id uuid primary key default gen_random_uuid(),
  execution_id uuid not null references task_executions(id) on delete cascade,
  penalty_code text not null,
  penalty_points numeric(6,2) not null default 0,
  rationale text,
  created_at timestamptz not null default now()
);

create index if not exists idx_execution_penalties_execution on execution_penalties(execution_id);
```

---

## 11. Períodos Oficiais

```sql
create table if not exists evaluation_periods (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  period_type period_type not null,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  is_closed boolean not null default false,
  closed_at timestamptz,
  closed_by uuid references app_users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (ends_at > starts_at)
);

create index if not exists idx_evaluation_periods_type_dates on evaluation_periods(period_type, starts_at desc);
```

---

## 12. Scorecards por Período

```sql
create table if not exists period_scorecards (
  id uuid primary key default gen_random_uuid(),
  period_id uuid not null references evaluation_periods(id) on delete cascade,
  agent_id uuid null references agents(id),
  team_id uuid null references teams(id),
  function_id uuid null references functions_catalog(id),
  policy_version_id uuid not null references scoring_policy_versions(id),
  score_value numeric(5,2) not null check (score_value >= 0 and score_value <= 100),
  score_status score_status not null default 'provisional',
  sample_size integer not null default 0,
  eligible_task_count integer not null default 0,
  confidence_index numeric(6,4) not null default 1.0000,
  rank_position integer,
  previous_rank_position integer,
  trend_delta numeric(6,2),
  operational_band text not null check (operational_band in ('green', 'yellow', 'orange', 'red')),
  explanation jsonb not null default '{}'::jsonb,
  published_at timestamptz,
  publication_version integer not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (
    (case when agent_id is not null then 1 else 0 end) +
    (case when team_id is not null then 1 else 0 end) +
    (case when function_id is not null then 1 else 0 end) = 1
  )
);

create unique index if not exists uq_period_scorecards_agent
  on period_scorecards(period_id, agent_id, publication_version)
  where agent_id is not null;

create unique index if not exists uq_period_scorecards_team
  on period_scorecards(period_id, team_id, publication_version)
  where team_id is not null;

create unique index if not exists uq_period_scorecards_function
  on period_scorecards(period_id, function_id, publication_version)
  where function_id is not null;

create index if not exists idx_period_scorecards_rank_agent on period_scorecards(period_id, rank_position) where agent_id is not null;
create index if not exists idx_period_scorecards_rank_team on period_scorecards(period_id, rank_position) where team_id is not null;
create index if not exists idx_period_scorecards_rank_function on period_scorecards(period_id, rank_position) where function_id is not null;

create table if not exists period_scorecard_dimensions (
  id uuid primary key default gen_random_uuid(),
  scorecard_id uuid not null references period_scorecards(id) on delete cascade,
  metric_id uuid not null references metric_catalog(id),
  average_score numeric(5,2) not null check (average_score >= 0 and average_score <= 100),
  applied_weight numeric(8,4) not null,
  explanation text,
  created_at timestamptz not null default now(),
  unique (scorecard_id, metric_id)
);
```

---

## 13. Snapshots de Ranking Publicado

```sql
create table if not exists ranking_snapshots (
  id uuid primary key default gen_random_uuid(),
  period_id uuid not null references evaluation_periods(id) on delete cascade,
  scope_type text not null check (scope_type in ('agent', 'team', 'function', 'organization')),
  visibility visibility_layer not null default 'internal_wide',
  publication_version integer not null,
  generated_at timestamptz not null default now(),
  generated_by uuid references app_users(id),
  storage_path text,
  metadata jsonb not null default '{}'::jsonb
);

create index if not exists idx_ranking_snapshots_period_scope on ranking_snapshots(period_id, scope_type, publication_version desc);
```

---

## 14. Badges

```sql
create table if not exists badges_catalog (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  description text not null,
  badge_category text not null,
  visibility visibility_layer not null default 'internal_wide',
  is_manual_validation_required boolean not null default false,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists badge_rules (
  id uuid primary key default gen_random_uuid(),
  badge_id uuid not null references badges_catalog(id) on delete cascade,
  policy_version_id uuid null references scoring_policy_versions(id),
  rule_expression jsonb not null,
  valid_from timestamptz not null default now(),
  valid_to timestamptz,
  created_by uuid references app_users(id),
  created_at timestamptz not null default now()
);

create table if not exists badge_awards (
  id uuid primary key default gen_random_uuid(),
  badge_id uuid not null references badges_catalog(id),
  agent_id uuid null references agents(id),
  team_id uuid null references teams(id),
  function_id uuid null references functions_catalog(id),
  period_id uuid null references evaluation_periods(id),
  awarded_by uuid null references app_users(id),
  source_scorecard_id uuid null references period_scorecards(id),
  award_status badge_award_status not null default 'active',
  awarded_at timestamptz not null default now(),
  revoked_at timestamptz,
  revoke_reason text,
  evidence jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  check (
    (case when agent_id is not null then 1 else 0 end) +
    (case when team_id is not null then 1 else 0 end) +
    (case when function_id is not null then 1 else 0 end) = 1
  )
);

create index if not exists idx_badge_awards_agent on badge_awards(agent_id, awarded_at desc) where agent_id is not null;
create index if not exists idx_badge_awards_team on badge_awards(team_id, awarded_at desc) where team_id is not null;
create index if not exists idx_badge_awards_function on badge_awards(function_id, awarded_at desc) where function_id is not null;
```

---

## 15. Consequências Operacionais

```sql
create table if not exists consequence_rules (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  description text,
  policy_version_id uuid null references scoring_policy_versions(id),
  action_type consequence_action_type not null,
  trigger_expression jsonb not null,
  requires_human_confirmation boolean not null default true,
  is_active boolean not null default true,
  created_by uuid references app_users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists consequence_events (
  id uuid primary key default gen_random_uuid(),
  rule_id uuid not null references consequence_rules(id),
  agent_id uuid null references agents(id),
  team_id uuid null references teams(id),
  function_id uuid null references functions_catalog(id),
  period_id uuid null references evaluation_periods(id),
  source_scorecard_id uuid null references period_scorecards(id),
  status consequence_status not null default 'suggested',
  triggered_at timestamptz not null default now(),
  confirmed_by uuid references app_users(id),
  confirmed_at timestamptz,
  dismissed_by uuid references app_users(id),
  dismissed_at timestamptz,
  rationale text,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  check (
    (case when agent_id is not null then 1 else 0 end) +
    (case when team_id is not null then 1 else 0 end) +
    (case when function_id is not null then 1 else 0 end) = 1
  )
);

create index if not exists idx_consequence_events_agent on consequence_events(agent_id, triggered_at desc) where agent_id is not null;
```

---

## 16. Revisões e Apelações

```sql
create table if not exists score_reviews (
  id uuid primary key default gen_random_uuid(),
  execution_id uuid null references task_executions(id),
  scorecard_id uuid null references period_scorecards(id),
  requested_by uuid not null references app_users(id),
  assigned_to uuid references app_users(id),
  review_status review_status not null default 'open',
  reason text not null,
  requested_at timestamptz not null default now(),
  due_at timestamptz,
  decided_at timestamptz,
  decided_by uuid references app_users(id),
  decision_type review_decision_type,
  original_score numeric(5,2),
  revised_score numeric(5,2),
  decision_notes text,
  attachments jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (
    (case when execution_id is not null then 1 else 0 end) +
    (case when scorecard_id is not null then 1 else 0 end) = 1
  )
);

create index if not exists idx_score_reviews_status on score_reviews(review_status, requested_at desc);
```

---

## 17. Auditoria e Rastreabilidade

```sql
create table if not exists audit_events (
  id uuid primary key default gen_random_uuid(),
  event_type audit_event_type not null,
  actor_type actor_type not null,
  actor_user_id uuid null references app_users(id),
  actor_service_name text,
  target_table text,
  target_id uuid,
  visibility visibility_layer not null default 'internal_wide',
  event_timestamp timestamptz not null default now(),
  ip_address inet,
  user_agent text,
  rationale text,
  metadata jsonb not null default '{}'::jsonb
);

create index if not exists idx_audit_events_target on audit_events(target_table, target_id, event_timestamp desc);
create index if not exists idx_audit_events_actor on audit_events(actor_user_id, event_timestamp desc);

create table if not exists data_access_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references app_users(id),
  accessed_resource text not null,
  accessed_resource_id uuid,
  visibility visibility_layer not null,
  access_reason text,
  accessed_at timestamptz not null default now(),
  metadata jsonb not null default '{}'::jsonb
);

create index if not exists idx_data_access_logs_user on data_access_logs(user_id, accessed_at desc);
```

---

## 18. Exportações e Arquivos Gerados

```sql
create table if not exists export_jobs (
  id uuid primary key default gen_random_uuid(),
  requested_by uuid not null references app_users(id),
  visibility visibility_layer not null,
  scope_type text not null check (scope_type in ('agent', 'team', 'function', 'organization', 'audit')),
  filters jsonb not null default '{}'::jsonb,
  status text not null check (status in ('queued', 'processing', 'ready', 'failed', 'expired')),
  storage_path text,
  file_format text not null check (file_format in ('csv', 'pdf', 'json')),
  requested_at timestamptz not null default now(),
  ready_at timestamptz,
  expires_at timestamptz,
  error_message text,
  metadata jsonb not null default '{}'::jsonb
);

create index if not exists idx_export_jobs_requested_by on export_jobs(requested_by, requested_at desc);
```

---

## 19. Ligações pendentes de FKs

```sql
alter table app_user_roles
  add constraint fk_app_user_roles_team
  foreign key (team_id) references teams(id);

alter table app_user_roles
  add constraint fk_app_user_roles_function
  foreign key (function_id) references functions_catalog(id);
```

---

## 20. Triggers de `updated_at`

```sql
do $$
declare
  r record;
begin
  for r in
    select unnest(array[
      'app_users',
      'teams',
      'functions_catalog',
      'agents',
      'task_types',
      'metric_catalog',
      'scoring_policies',
      'scoring_policy_versions',
      'evaluation_periods',
      'task_executions',
      'period_scorecards',
      'score_reviews',
      'badges_catalog',
      'consequence_rules'
    ]) as table_name
  loop
    execute format('drop trigger if exists trg_%I_updated_at on %I', r.table_name, r.table_name);
    execute format('create trigger trg_%I_updated_at before update on %I for each row execute function set_updated_at()', r.table_name, r.table_name);
  end loop;
end $$;
```

---

## 21. Views de Leitura por Camada de Transparência

```sql
create or replace view v_internal_wide_agent_ranking as
select
  ps.id as scorecard_id,
  ep.code as period_code,
  ep.period_type,
  a.id as agent_id,
  a.display_name as agent_name,
  t.name as team_name,
  f.name as function_name,
  ps.score_value,
  ps.rank_position,
  ps.previous_rank_position,
  ps.trend_delta,
  ps.sample_size,
  ps.operational_band,
  ps.score_status,
  spv.version_number as policy_version
from period_scorecards ps
join evaluation_periods ep on ep.id = ps.period_id
join agents a on a.id = ps.agent_id
left join teams t on t.id = a.owning_team_id
left join functions_catalog f on f.id = a.primary_function_id
join scoring_policy_versions spv on spv.id = ps.policy_version_id
where ps.agent_id is not null;

create or replace view v_operational_task_execution_details as
select
  te.id as execution_id,
  te.agent_id,
  a.display_name as agent_name,
  te.team_id,
  t.name as team_name,
  te.function_id,
  f.name as function_name,
  te.task_type_id,
  tt.name as task_type_name,
  te.completed_at,
  te.criticality,
  te.complexity,
  te.score_final,
  te.penalty_points,
  te.confidence_factor,
  te.execution_status,
  te.score_status,
  te.policy_version_id
from task_executions te
join agents a on a.id = te.agent_id
left join teams t on t.id = te.team_id
left join functions_catalog f on f.id = te.function_id
join task_types tt on tt.id = te.task_type_id;

create or replace view v_audit_execution_full as
select
  te.*,
  ie.source_system,
  ie.source_event_id,
  ie.payload as raw_payload,
  ie.metadata as ingestion_metadata
from task_executions te
left join ingestion_events ie on ie.id = te.ingestion_event_id;
```

---

## 22. Índices Adicionais Recomendados

```sql
create index if not exists idx_task_executions_completed_at on task_executions(completed_at desc);
create index if not exists idx_period_scorecards_period_status on period_scorecards(period_id, score_status);
create index if not exists idx_badge_awards_period on badge_awards(period_id, awarded_at desc);
create index if not exists idx_consequence_events_period on consequence_events(period_id, triggered_at desc);
create index if not exists idx_score_reviews_execution on score_reviews(execution_id) where execution_id is not null;
create index if not exists idx_score_reviews_scorecard on score_reviews(scorecard_id) where scorecard_id is not null;
```

---

## 23. Considerações de Implementação

1. `payload` bruto deve receber proteção de acesso no backend.
2. `publication_version` permite republicação sem sobrescrever histórico.
3. `score_reviews` cobre revisão tanto de tarefa quanto de score agregado.
4. `badge_rules` e `consequence_rules` usam `jsonb` para permitir regras configuráveis e versionáveis.
5. A camada de API deve aplicar autorização adicional mesmo com views separadas.
6. Em ambientes Supabase, recomenda-se complementar com RLS e policies específicas por papel.
7. Para alto volume, pode-se adicionar materialized views para rankings mais acessados.

---

## 24. Ordem Recomendada de Implantação

1. extensões e tipos;
2. usuários, equipes, funções, agentes;
3. catálogo de tarefas e métricas;
4. políticas e versões;
5. ingestão e execuções;
6. períodos e scorecards;
7. badges e consequências;
8. revisões, auditoria e exportações;
9. views e índices finais.

---

## 25. Resultado Esperado

Este schema fornece base sólida para:
- score por tarefa;
- ranking por período;
- badges e consequências;
- explicabilidade;
- reprocessamento;
- transparência em camadas;
- auditoria completa.