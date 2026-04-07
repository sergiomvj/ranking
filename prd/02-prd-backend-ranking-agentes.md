# PRD Backend — Ranking de Eficiência de Agentes Virtuais

## 1. Resumo Executivo

Este documento define o backend do sistema **Ranking de Eficiência de Agentes Virtuais**, incluindo ingestão de eventos, persistência, cálculo de score, versionamento de políticas, atribuição de badges, consequências operacionais, auditoria e entrega de dados segmentados para o frontend.

O backend deve sustentar:
- score por tarefa;
- score agregado por período;
- segmentação por agente, equipe, função e organização;
- visibilidade em camadas;
- evidência auditável;
- regras versionadas;
- consequência operacional automatizada ou assistida.

## Glossário Base do Sistema

- **Agente Virtual**: unidade operacional avaliada pelo sistema. Pode representar um agente autônomo, um copiloto, um agente especialista, um orquestrador ou um agente de suporte humano+IA.
- **Equipe**: agrupamento organizacional de agentes por domínio, squad, produto, cliente ou operação.
- **Função**: papel principal do agente no ecossistema, como atendimento, triagem, SDR, suporte técnico, revisão, redação, auditoria ou orquestração.
- **Tarefa**: unidade mínima de trabalho elegível para avaliação.
- **Execução**: ocorrência concreta de uma tarefa realizada por um agente, com evidências, timestamps e resultado.
- **Score de Tarefa**: nota de 0 a 100 calculada sobre uma execução específica.
- **Score de Período**: nota agregada por agente, equipe, função ou organização em uma janela oficial de tempo.
- **Badge**: selo oficial concedido com base em critérios objetivos e auditáveis.
- **Consequência Operacional**: efeito automático ou recomendado a partir do score, como ampliação de autonomia, revisão obrigatória ou plano de melhoria.
- **Camadas de Transparência**:
  - **Visão ampla interna**: acesso a ranking agregado, tendências, badges e indicadores comparáveis.
  - **Visão operacional**: acesso a drill-down de tarefas, justificativas, componentes de score e histórico de ocorrências.
  - **Visão restrita de auditoria**: acesso a evidências sensíveis, payloads brutos, regras históricas, logs de alteração e rastreabilidade completa.

---

## 2. Objetivos do Backend

### 2.1 Objetivos principais
1. Criar uma base confiável e auditável para o ranking.
2. Permitir cálculo reprodutível de scores com política versionada.
3. Garantir separação entre eventos brutos, eventos avaliados e agregados publicados.
4. Registrar trilha completa de alterações e acessos sensíveis.
5. Suportar consultas analíticas eficientes sem perder rastreabilidade.

### 2.2 Objetivos secundários
1. Facilitar expansão para múltiplas fontes de agentes.
2. Permitir reprocessamento histórico.
3. Minimizar risco de manipulação silenciosa de score.
4. Permitir integrações com orquestradores, CRMs, helpdesks e pipelines de IA.

### 2.3 Não objetivos
- Não substituir o orquestrador dos agentes.
- Não executar inferência de LLM.
- Não servir como data lake genérico de logs não relacionados ao ranking.
- Não permitir exclusão destrutiva de histórico avaliado.

---

## 3. Arquitetura Recomendada

## 3.1 Estilo arquitetural
**Modular monolith com workers assíncronos**, preparado para evolução a microsserviços caso o volume cresça.

### 3.2 Stack recomendada
- **Node.js + TypeScript**
- **NestJS** ou **Fastify estruturado em módulos**
- **PostgreSQL 16+**
- **Redis** para filas e cache transitório
- **BullMQ** para jobs assíncronos
- **Object Storage** para evidências e anexos
- **OpenTelemetry** para tracing
- **Sentry** para erro de aplicação
- **JWT/OIDC** para autenticação
- **RBAC + escopo por camada de transparência**
- **Webhook ingestion** para eventos externos

### 3.3 Módulos de backend
1. Auth & Access Control
2. Agent Registry
3. Team & Function Registry
4. Task Ingestion
5. Evaluation Engine
6. Scoring Engine
7. Period Engine
8. Badge Engine
9. Consequence Engine
10. Audit & Review
11. Dashboard Query API
12. Export & Snapshot
13. Admin Policy Management

---

## 4. Domínios de Dados

## 4.1 Catálogo organizacional
- agentes;
- equipes;
- funções;
- vínculos históricos.

## 4.2 Catálogo de avaliação
- tipos de tarefa;
- métricas;
- políticas de scoring;
- pesos;
- thresholds;
- política de badge;
- política de consequência.

## 4.3 Operação avaliada
- eventos brutos ingeridos;
- execuções normalizadas;
- métricas por execução;
- penalidades e ajustes;
- score final de tarefa.

## 4.4 Agregação e publicação
- scorecards por período;
- snapshots de ranking;
- badges atribuídas;
- consequência operacional aplicada.

## 4.5 Governança
- revisões;
- apelações;
- histórico de política;
- auditoria de acesso;
- auditoria de mudança.

---

## 5. Fluxo de Dados Principal

1. O sistema recebe evento bruto ou lote.
2. O evento é validado, persistido e deduplicado.
3. O evento é transformado em execução elegível.
4. A política correta é selecionada conforme função, período e vigência.
5. As métricas de execução são avaliadas.
6. O score de tarefa é calculado.
7. Jobs agregam scores por período.
8. O motor de badges verifica elegibilidade.
9. O motor de consequências avalia thresholds.
10. Resultados publicados alimentam APIs e dashboards.
11. Toda leitura e alteração sensível é auditada.

---

## 6. Módulos Detalhados

## 6.1 Módulo de Auth & Access Control

### Responsabilidades
- autenticar usuários humanos;
- associar papéis;
- resolver escopo de visibilidade;
- emitir claims seguras;
- controlar exportação e acesso sensível.

### Requisitos
- suporte a SSO corporativo ou provider externo;
- RBAC com perfis:
  - `viewer_internal`
  - `manager_operational`
  - `auditor_restricted`
  - `admin_platform`
- possibilidade de escopo por equipe e função;
- logging de tentativas negadas.

---

## 6.2 Módulo de Agent Registry

### Responsabilidades
- cadastrar agentes;
- manter status operacional;
- registrar função principal e secundária;
- vincular a equipe;
- controlar histórico de movimentação.

### Requisitos
- nenhum score histórico deve ser reatribuído sem rastreabilidade;
- mudanças de equipe/função precisam ser historizadas;
- agente inativo permanece consultável.

---

## 6.3 Módulo de Task Ingestion

### Fontes previstas
- webhook de orquestrador;
- API direta;
- importação em lote;
- conectores futuros.

### Responsabilidades
- validar assinatura/origem;
- registrar payload bruto;
- gerar hash de deduplicação;
- classificar tipo de tarefa;
- armazenar metadados essenciais.

### Regras
- payload bruto sensível deve ficar disponível apenas à auditoria;
- evento duplicado não pode gerar score duplicado;
- erros de parsing devem ficar em fila de exceção.

---

## 6.4 Módulo de Evaluation Engine

### Responsabilidades
- transformar evento em execução avaliada;
- escolher política adequada;
- calcular métricas normalizadas;
- aplicar penalidades e caps;
- registrar score por tarefa.

### Entradas
- execução normalizada;
- política vigente;
- pesos por função;
- criticidade;
- complexidade;
- evidências.

### Saídas
- score final;
- score breakdown;
- confiança;
- status da avaliação;
- motivo de cap ou penalidade.

### Observação
O Evaluation Engine não publica ranking. Ele apenas produz material confiável para agregação.

---

## 6.5 Módulo de Scoring Engine

### Responsabilidades
- calcular score de tarefa de 0 a 100;
- calcular score agregado por período;
- produzir scorecards por agente, equipe e função;
- registrar score provisório quando a amostra for insuficiente.

### Requisitos
- cálculo determinístico e reproduzível;
- versionamento de política por execução e por scorecard;
- reprocessamento histórico controlado;
- suporte a múltiplas granularidades de período.

### Fórmula de alto nível
- `task_score = soma_ponderada_dimensoes - penalidades`
- `period_score = média ponderada de task_scores por peso de criticidade, complexidade e confiança`

O detalhe oficial de pesos e faixas fica no documento de política.

---

## 6.6 Módulo de Period Engine

### Responsabilidades
- abrir e fechar períodos oficiais;
- recalcular scorecards;
- congelar snapshots oficiais;
- permitir comparação entre períodos.

### Tipos
- diário;
- semanal;
- mensal;
- trimestral;
- customizado.

### Regras
- período fechado não pode ser alterado sem processo formal de reprocessamento;
- reprocessamento gera nova versão de publicação, nunca overwrite silencioso.

---

## 6.7 Módulo de Badge Engine

### Responsabilidades
- avaliar elegibilidade;
- emitir badges automáticas;
- permitir badges validadas;
- revogar badges quando regra deixar de ser atendida;
- manter histórico completo.

### Requisitos
- cada badge tem regra explícita, vigência e evidência;
- badge conquistada deve registrar score e contexto da concessão;
- badge revogada não desaparece do histórico.

---

## 6.8 Módulo de Consequence Engine

### Responsabilidades
- transformar score em ação operacional;
- disparar recomendações automáticas;
- registrar confirmação humana quando exigida;
- manter trilha por agente e período.

### Exemplos
- liberar tarefas mais críticas;
- exigir revisão humana;
- acionar plano de melhoria;
- sinalizar risco para equipe.

### Regras
- consequências não alteram score retroativamente;
- consequências devem apontar qual regra as gerou.

---

## 6.9 Módulo de Audit & Review

### Responsabilidades
- registrar acesso sensível;
- registrar mudanças de regra;
- gerenciar revisões e apelações;
- preservar score original e score revisado;
- oferecer trilha probatória.

### Requisitos
- toda decisão precisa de responsável, timestamp e justificativa;
- acesso a payload bruto deve ser logado;
- exports de auditoria devem ser auditados.

---

## 6.10 Módulo de Dashboard Query API

### Responsabilidades
- servir agregados ao frontend;
- responder filtros por agente, equipe, função e período;
- aplicar visibilidade por papel;
- otimizar leitura com índices, views e snapshots.

### Requisitos
- APIs de leitura devem ser idempotentes;
- paginação obrigatória em listas extensas;
- respostas devem incluir `policy_version`.

---

## 6.11 Módulo de Export & Snapshot

### Responsabilidades
- gerar CSV/PDF/JSON controlados;
- registrar quem exportou, o quê e quando;
- armazenar snapshot dos resultados publicados.

### Regras
- export detalhado exige permissão específica;
- export de auditoria deve gerar log próprio.

---

## 6.12 Módulo de Admin Policy Management

### Responsabilidades
- criar políticas;
- publicar novas versões;
- versionar pesos e thresholds;
- simular impacto;
- governar vigência.

### Regras críticas
- nenhuma política ativa pode ser alterada in place;
- cada publicação precisa de justificativa;
- o sistema deve guardar relação entre score e versão da política.

---

## 7. Modelo de APIs

## 7.1 Endpoints de leitura analítica
- `GET /dashboard/overview`
- `GET /rankings/agents`
- `GET /rankings/teams`
- `GET /rankings/functions`
- `GET /agents/:id`
- `GET /agents/:id/executions`
- `GET /teams/:id`
- `GET /functions/:id`
- `GET /periods`
- `GET /scorecards/:id`
- `GET /badges/catalog`
- `GET /badges/awards`
- `GET /consequences`
- `GET /reviews`
- `GET /audit/events`

## 7.2 Endpoints de operação e cadastro
- `POST /agents`
- `PATCH /agents/:id`
- `POST /teams`
- `POST /functions`
- `POST /task-types`
- `POST /policies`
- `POST /policies/:id/publish`
- `POST /badges`
- `POST /consequence-rules`
- `POST /periods/open`
- `POST /periods/:id/close`

## 7.3 Ingestão
- `POST /ingestion/events`
- `POST /ingestion/batch`
- `POST /ingestion/reprocess/:period_id`

## 7.4 Revisões
- `POST /reviews`
- `POST /reviews/:id/assign`
- `POST /reviews/:id/decide`

## 7.5 Exportações
- `POST /exports`
- `GET /exports/:id`

### Convenções
- respostas com paginação:
  - `items`
  - `page`
  - `page_size`
  - `total`
- erros padronizados:
  - `code`
  - `message`
  - `details`
  - `correlation_id`

---

## 8. Modelo de Segurança

### 8.1 Camadas
1. autenticação
2. autorização por papel
3. autorização por escopo
4. autorização por sensibilidade do dado
5. log de acesso

### 8.2 Regras mínimas
- JWT assinado e expirado;
- refresh seguro;
- scoping por equipe/função quando necessário;
- masking de payload sensível;
- signed URLs para anexos;
- retenção de evidência conforme política de governança.

### 8.3 Eventos que exigem auditoria obrigatória
- leitura de payload bruto;
- exportação detalhada;
- publicação de política;
- reprocessamento histórico;
- decisão de revisão;
- revogação manual de badge.

---

## 9. Jobs Assíncronos

### 9.1 Fila de ingestão
- parse
- deduplicação
- normalização

### 9.2 Fila de avaliação
- seleção de política
- cálculo de score por tarefa
- persistência de breakdown

### 9.3 Fila de agregação
- scorecards por período
- snapshots
- rankings

### 9.4 Fila de badges
- concessão
- revogação
- recomputação

### 9.5 Fila de consequências
- avaliação de thresholds
- geração de ação

### 9.6 Fila de exportação
- geração de arquivo
- notificação
- expiração segura do download

### 9.7 Fila de reprocessamento
- recomputação histórica controlada
- versionamento de publicação

---

## 10. Estratégia de Persistência

### 10.1 PostgreSQL como source of truth
O Postgres será a base principal para:
- catálogo organizacional;
- eventos brutos;
- execuções normalizadas;
- score breakdown;
- scorecards;
- badges;
- consequências;
- auditoria;
- revisões.

### 10.2 Object storage
Usado para:
- evidências grandes;
- anexos;
- relatórios exportados;
- snapshots de auditoria.

### 10.3 Redis
Usado para:
- filas;
- locks de reprocessamento;
- cache transitório de consultas quentes.

---

## 11. Regras de Reprocessamento

1. Todo reprocessamento deve indicar:
   - período;
   - política aplicada;
   - responsável;
   - motivo.
2. O sistema nunca deve apagar a publicação anterior.
3. Scorecards republicados precisam de campo de versão.
4. Frontend deve poder comparar versão publicada anterior e nova.
5. Reprocessamento amplo deve ser bloqueado sem perfil administrativo.

---

## 12. Requisitos Não Funcionais

### 12.1 Disponibilidade
- APIs analíticas: alta disponibilidade em horário operacional.
- Jobs: tolerância a falha com retry controlado.

### 12.2 Performance
- ingestão individual: resposta inicial rápida com processamento assíncrono;
- listagens agregadas em menos de 1s para escopos usuais;
- consultas de auditoria em até 3s na maior parte dos casos;
- exports grandes fora do fluxo síncrono.

### 12.3 Integridade
- constraints fortes;
- deduplicação por hash;
- chaves estrangeiras;
- trilha de alteração.

### 12.4 Observabilidade
- tracing por requisição;
- métricas de fila;
- latência por endpoint;
- taxa de erro;
- número de execuções avaliadas;
- número de scores provisórios;
- número de revisões abertas.

### 12.5 Governança
- retenção configurável;
- logs imutáveis de auditoria;
- versionamento formal de política;
- segregação entre dado agregado e evidência sensível.

---

## 13. Métricas Operacionais do Próprio Backend

- eventos ingeridos por hora;
- percentual de eventos inválidos;
- taxa de deduplicação;
- tempo médio de avaliação;
- tempo médio de fechamento de período;
- volume de revisões;
- taxa de revogação de badges;
- número de acessos sensíveis;
- exports por perfil.

---

## 14. Estratégia de Versionamento de Política

### Entidades de governança
- política;
- versão da política;
- pesos por métrica;
- regra por badge;
- regra por consequência.

### Regras
- uma versão publicada é imutável;
- novas versões podem ter vigência futura;
- score precisa sempre apontar para a versão utilizada;
- o frontend deve receber metadados da versão.

---

## 15. Critérios de Aceite do Backend

1. Uma execução avaliada pode ser reproduzida posteriormente com mesma política e mesmos insumos.
2. Um scorecard de período informa claramente a política usada.
3. Um auditor consegue rastrear do ranking até a execução e até a evidência.
4. A mesma execução não gera score duplicado.
5. Badges são atribuídas apenas quando a regra está satisfeita.
6. Consequências operacionais ficam registradas e explicáveis.
7. Revisões preservam score original e score revisado.
8. Reprocessamentos nunca sobrescrevem histórico silenciosamente.
9. Exportações sensíveis geram log.
10. APIs respeitam a camada de transparência do solicitante.

---

## 16. Roadmap de Entrega Recomendado

### Fase 1 — Foundation
- catálogo de agentes/equipes/funções;
- ingestão básica;
- avaliação por tarefa;
- scorecards por período;
- ranking agregado.

### Fase 2 — Expansão operacional
- badges;
- consequências;
- comparativos;
- exports controlados;
- filtros avançados.

### Fase 3 — Governança total
- revisão e apelação;
- auditoria completa;
- versionamento maduro de políticas;
- reprocessamento histórico;
- observabilidade avançada.

---

## 17. Resultado Esperado

O backend deve ser a fonte oficial, reprodutível e auditável do ranking. Seu papel central é garantir que o score não seja apenas calculado, mas **explicável**, **comparável**, **versionado**, **revisável** e **operacionalmente útil**.