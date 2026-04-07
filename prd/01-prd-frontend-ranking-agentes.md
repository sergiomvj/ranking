# PRD Frontend — Ranking de Eficiência de Agentes Virtuais

## 1. Resumo Executivo

Este documento especifica o frontend do sistema **Ranking de Eficiência de Agentes Virtuais**, responsável por expor resultados de eficiência com **acesso democratizado**, transparência em camadas e profundidade operacional suficiente para gestão, auditoria e evolução contínua dos agentes.

O frontend deve permitir:
- leitura rápida do ranking organizacional;
- análise detalhada por agente, equipe, função e período;
- visualização de score por tarefa e score agregado;
- consulta de badges e consequências operacionais;
- navegação segura entre visões pública interna, operacional e restrita de auditoria;
- rastreabilidade visual de alterações, evidências e revisões.

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

## 2. Objetivos do Produto no Frontend

### 2.1 Objetivos principais
1. Transformar resultados de eficiência em uma experiência visual clara, comparável e auditável.
2. Permitir que diferentes públicos vejam o mesmo sistema sob níveis distintos de profundidade.
3. Reduzir ambiguidade operacional por meio de métricas explicadas no próprio produto.
4. Facilitar diagnóstico de queda de performance, desvio de conformidade e evolução de badges.
5. Viabilizar governança contínua com confiança visual, filtros consistentes e histórico acessível.

### 2.2 Objetivos secundários
1. Servir como hub central para dashboards e ranking.
2. Suportar decisões operacionais rápidas.
3. Aumentar confiança institucional na justiça do sistema de scoring.
4. Reduzir dependência de planilhas paralelas.
5. Permitir exportações governadas e consultas auditáveis.

### 2.3 Não objetivos
- Não executar o cálculo primário do score no navegador.
- Não permitir edição direta de eventos brutos sensíveis fora dos fluxos autorizados.
- Não substituir ferramentas de observabilidade técnica do runtime dos agentes.
- Não assumir função de BI livre sem regras de visibilidade.

---

## 3. Perfis de Usuário

### 3.1 Executivo interno
Precisa de visão consolidada: ranking geral, líderes, quedas, tendência, saúde por equipe, badges e impacto operacional.

### 3.2 Gestor operacional
Precisa de drill-down: tarefas, score breakdown, incidentes, gaps por dimensão, comparativos entre agentes semelhantes e histórico por período.

### 3.3 Auditor
Precisa de acesso restrito: evidências, payloads, versões de regra, cadeia de revisão, trilha de alterações, logs de acesso, apelações e decisões.

### 3.4 Dono de função ou líder de domínio
Precisa comparar apenas agentes de uma mesma função, validando justiça comparativa e calibragem de pesos.

### 3.5 Administrador do sistema
Precisa configurar catálogo, pesos, ciclos, badges, limites, textos explicativos e permissões.

---

## 4. Princípios de UX e Transparência

1. **Clareza antes de densidade**: a visão ampla deve ser legível em poucos segundos.
2. **Explicabilidade visível**: todo score relevante deve ter botão “como esta nota foi formada”.
3. **Consistência de filtros**: agente, equipe, função e período devem existir em toda a navegação analítica.
4. **Transparência em camadas**: o mesmo dado muda de profundidade conforme permissão, não de definição.
5. **Comparabilidade justa**: comparações default sempre dentro do mesmo grupo funcional.
6. **Auditabilidade progressiva**: o usuário comum vê o suficiente para confiar; o auditor vê o suficiente para provar.
7. **Responsividade real**: uso principal desktop, mas leitura operacional em tablet e mobile deve ser viável.

---

## 5. Stack Recomendada

### 5.1 Stack principal
- **Next.js 15+**
- **React 19**
- **TypeScript**
- **Tailwind CSS**
- **shadcn/ui**
- **TanStack Query** para leitura e cache
- **Zustand** para estado de filtros e preferências locais
- **Recharts** para gráficos comparativos
- **React Hook Form + Zod** para formulários administrativos
- **next-intl** se houver necessidade futura de multilíngue
- **OpenTelemetry frontend** para métricas de uso
- **Sentry** para erros do cliente

### 5.2 Estratégia de renderização
- SSR/ISR para dashboards institucionais e páginas de ranking agregadas.
- CSR para páginas com filtros pesados, drill-down e auditoria.
- Streaming de componentes para painéis extensos.
- Lazy loading em módulos restritos de auditoria.

---

## 6. Arquitetura da Informação

## 6.1 Módulos principais
1. **Home / Visão Geral**
2. **Central de Ranking**
3. **Perfil do Agente**
4. **Perfil da Equipe**
5. **Perfil da Função**
6. **Análise por Período**
7. **Central de Badges**
8. **Consequências Operacionais**
9. **Auditoria**
10. **Revisões e Apelações**
11. **Administração de Regras**
12. **Configurações e Permissões**

### 6.2 Navegação principal
- Dashboard
- Ranking
- Agentes
- Equipes
- Funções
- Badges
- Auditoria
- Administração

### 6.3 Navegação contextual
Em qualquer tela analítica, o cabeçalho secundário deve expor:
- período ativo;
- escopo atual;
- filtros persistidos;
- status do dataset;
- versão da política de scoring aplicada.

---

## 7. Requisitos Funcionais por Tela

## 7.1 Tela: Home / Visão Geral

### Objetivo
Entregar leitura instantânea da saúde geral do ecossistema de agentes.

### Componentes
- KPI cards:
  - score médio global;
  - score médio por função;
  - percentual de agentes em faixa verde/amarela/laranja/vermelha;
  - total de badges ativas no período;
  - quantidade de agentes com score provisório;
  - quantidade de revisões pendentes.
- Ranking resumido:
  - top 10 agentes;
  - top 5 equipes;
  - top 5 funções.
- Tendências:
  - evolução semanal/mensal do score médio;
  - heatmap por função;
  - distribuição por faixa.
- Alertas:
  - queda abrupta;
  - risco operacional;
  - badge perdida;
  - política alterada.
- Feed de governança:
  - revisões de score;
  - badges revogadas;
  - regras publicadas.

### Ações
- abrir ranking completo;
- abrir página de uma equipe;
- comparar períodos;
- abrir metodologia oficial;
- exportar visão agregada, se permitido.

### Regras
- Sem permissão operacional, o usuário não deve ver execuções individuais.
- Sem permissão de auditoria, o usuário não deve ver payload bruto ou justificativas sensíveis.

---

## 7.2 Tela: Central de Ranking

### Objetivo
Permitir comparação ampla e segmentada entre agentes.

### Componentes
- tabela principal com:
  - posição;
  - agente;
  - equipe;
  - função;
  - score do período;
  - delta vs período anterior;
  - badges relevantes;
  - amostra;
  - status de confiabilidade;
  - faixa operacional.
- abas:
  - agentes;
  - equipes;
  - funções;
  - organizacional.
- filtros:
  - período;
  - tipo de período;
  - equipe;
  - função;
  - faixa de score;
  - badge;
  - score provisório/definitivo;
  - somente agentes ativos;
  - somente auditáveis.
- modo de visualização:
  - tabela;
  - cards;
  - gráfico de dispersão;
  - heatmap;
  - curva de distribuição.

### Interações obrigatórias
- ordenar por qualquer coluna relevante;
- comparar até 5 agentes lado a lado;
- abrir breakdown de score em drawer lateral;
- salvar visão favorita;
- exportar CSV/PDF respeitando permissão.

### Estados
- vazio;
- sem permissão;
- carregamento parcial;
- cálculo pendente;
- score provisório;
- período fechado.

---

## 7.3 Tela: Perfil do Agente

### Objetivo
Concentrar histórico, score, badges, eventos, tendências e evidências de um agente.

### Seções
1. Cabeçalho
   - nome do agente;
   - status;
   - equipe atual;
   - função principal;
   - score atual;
   - faixa operacional;
   - badges ativas;
   - selo de confiabilidade da amostra.
2. Evolução temporal
   - gráfico por dia/semana/mês;
   - anotação de eventos relevantes.
3. Breakdown do score do período
   - dimensões com pesos;
   - nota por dimensão;
   - penalidades;
   - ajustes por confiança;
   - link para política aplicada.
4. Execuções recentes
   - lista de tarefas avaliadas;
   - score por tarefa;
   - severidade;
   - complexidade;
   - rework;
   - compliance;
   - link para auditoria, se permitido.
5. Consequências operacionais
   - recomendações;
   - ações já aplicadas;
   - status.
6. Histórico de badges
7. Histórico de revisões e apelações

### Regras de visualização
- Visão ampla interna: resumo e histórico agregado.
- Visão operacional: lista de tarefas e breakdown por dimensão.
- Visão auditoria: evidência, payload bruto, revisão, versão de regra, responsáveis.

---

## 7.4 Tela: Perfil da Equipe

### Objetivo
Avaliar saúde coletiva da equipe e distribuição interna de performance.

### Componentes
- score médio ponderado da equipe;
- ranking interno;
- desvio-padrão de performance;
- comparativo com período anterior;
- distribuição por faixas;
- mapa de badges;
- incidentes e gargalos;
- matriz agente x dimensão;
- agentes com maior ascensão e maior queda.

### Ações
- abrir perfil de agente;
- comparar equipes;
- filtrar por função dentro da equipe;
- exportar resumo da equipe.

---

## 7.5 Tela: Perfil da Função

### Objetivo
Garantir comparabilidade justa entre agentes que desempenham papéis semelhantes.

### Componentes
- score médio da função;
- ranking somente da função;
- volume de tarefas elegíveis;
- critérios específicos da função;
- distribuição de notas por dimensão;
- outliers positivos e negativos;
- heatmap por equipe dentro da função.

### Regras
- esta é a visão padrão para comparações operacionais justas;
- comparações cruzadas entre funções devem ser sinalizadas como “comparação não homogênea”.

---

## 7.6 Tela: Análise por Período

### Objetivo
Explorar score por janela temporal e detectar mudanças de comportamento.

### Componentes
- seletor de período:
  - diário;
  - semanal;
  - mensal;
  - trimestral;
  - personalizado.
- gráfico de série temporal;
- baseline vs período anterior;
- distribuição por faixa;
- ranking daquele período;
- eventos associados;
- lista de períodos fechados e abertos.

### Recursos
- comparar 2 períodos;
- comparar mesma equipe em 2 períodos;
- comparar função em janelas diferentes;
- exibir política vigente em cada período.

---

## 7.7 Tela: Central de Badges

### Objetivo
Dar visibilidade a selos e méritos, sem comprometer a seriedade do sistema.

### Componentes
- catálogo de badges;
- critérios oficiais;
- badges conquistadas no período;
- badges perdidas/revogadas;
- ranking de badges por agente/equipe;
- trilha histórica de conquistas.

### Regras
- badge sem critério objetivo não pode existir.
- badge revogada deve manter histórico e justificativa.
- badges automáticas e badges validadas manualmente precisam ser distinguidas visualmente.

---

## 7.8 Tela: Consequências Operacionais

### Objetivo
Traduzir score em ação prática de gestão.

### Componentes
- faixas operacionais;
- recomendações ativas;
- ações disparadas;
- ações pendentes de confirmação humana;
- histórico por agente;
- mapa por equipe.

### Exemplos de ações exibidas
- aumento de autonomia;
- obrigatoriedade de revisão humana;
- limitação temporária de tarefas críticas;
- plano de melhoria;
- prioridade para treinamentos;
- destaque institucional.

---

## 7.9 Tela: Auditoria

### Objetivo
Permitir análise probatória, com trilha completa e restrita.

### Componentes
- busca por execução, agente, período, regra, badge ou apelação;
- timeline de eventos;
- payload bruto;
- evidências anexadas;
- versão da regra;
- score breakdown técnico;
- logs de modificação;
- logs de acesso à própria tela;
- exportação auditada.

### Requisitos críticos
- watermark visual em dados sensíveis;
- mascaramento parcial quando necessário;
- registro obrigatório de acesso e exportação;
- tela indisponível sem papel apropriado.

---

## 7.10 Tela: Revisões e Apelações

### Objetivo
Gerenciar contestação de score e garantir justiça procedimental.

### Componentes
- fila de revisões;
- status: aberta, em análise, deferida, indeferida, expirou;
- score original;
- score revisado;
- motivo;
- anexos;
- parecer;
- aprovadores.

### Regras
- toda revisão precisa preservar score original e score revisado;
- nunca sobrescrever histórico;
- toda decisão precisa indicar responsável e fundamento.

---

## 7.11 Tela: Administração de Regras

### Objetivo
Gerenciar políticas, pesos, critérios e versões.

### Componentes
- políticas publicadas;
- rascunhos;
- pesos por dimensão;
- pesos por função;
- regras de badges;
- regras de consequências;
- thresholds de confiabilidade;
- calendário de períodos;
- sandbox/simulador de impacto.

### Regras críticas
- nenhuma política pode ser editada “em silêncio” após publicação;
- alterações devem gerar nova versão;
- publicação exige motivo e responsável;
- simulador deve mostrar impacto estimado antes da entrada em vigor.

---

## 8. Componentes de Interface Reutilizáveis

1. **ScoreBadge**: exibe score, faixa, confiabilidade e tendência.
2. **DimensionBreakdownCard**: lista métricas, pesos e notas.
3. **RankingTable**: tabela universal com paginação, ordenação e filtros persistidos.
4. **PeriodSwitcher**: seletor uniforme de janela temporal.
5. **TransparencyGuard**: componente que alterna conteúdo por permissão.
6. **EvidencePanel**: renderiza evidências e logs.
7. **PolicyVersionChip**: exibe versão da política aplicada.
8. **OperationalStatusBanner**: comunica consequências e alertas.
9. **AuditTrailTimeline**: linha do tempo de revisões e alterações.
10. **BadgeGallery**: catálogo visual de badges.

---

## 9. Modelo de Permissões no Frontend

### 9.1 Perfis funcionais
- `viewer_internal`
- `manager_operational`
- `auditor_restricted`
- `admin_platform`

### 9.2 Controles de interface
- roteamento protegido;
- ocultação de menus;
- fallback seguro em APIs;
- proteção de exportação;
- mascaramento de colunas sensíveis;
- tooltips explicando restrição.

### 9.3 Matriz resumida
| Recurso | Visão ampla interna | Visão operacional | Visão restrita de auditoria |
|---|---:|---:|---:|
| Ranking agregado | Sim | Sim | Sim |
| Score por tarefa | Não | Sim | Sim |
| Breakdown por dimensão | Resumido | Completo | Completo |
| Payload bruto | Não | Não | Sim |
| Evidência anexada | Não | Parcial | Completa |
| Histórico de regra | Resumido | Sim | Completo |
| Exportação detalhada | Não | Controlada | Auditada |

---

## 10. Contratos de Dados Esperados pelo Frontend

### 10.1 Entidades mínimas
- AgentSummary
- AgentProfile
- TeamSummary
- FunctionSummary
- TaskExecutionSummary
- TaskExecutionAudit
- PeriodScorecard
- BadgeAward
- ConsequenceEvent
- PolicyVersion
- ReviewCase
- AuditEvent

### 10.2 Convenções
- todos os objetos devem conter `id`, `created_at`, `updated_at` quando aplicável;
- todos os recursos analíticos precisam expor `policy_version`;
- score deve vir sempre como número decimal 0–100 com precisão de duas casas;
- campos sensíveis devem vir mascarados pelo backend, nunca pelo frontend como única proteção.

---

## 11. Estados, Erros e Mensagens

### 11.1 Estados obrigatórios
- loading inicial;
- loading incremental;
- sem dados;
- dados insuficientes;
- acesso restrito;
- cálculo em andamento;
- período não fechado;
- score provisório;
- inconsistência de política.

### 11.2 Mensagens orientativas
- “Este score ainda é provisório devido à amostra insuficiente.”
- “Esta comparação mistura funções distintas; interprete com cautela.”
- “Detalhes completos disponíveis apenas para auditoria.”
- “A política aplicada a este período é diferente da atual.”
- “A exportação foi registrada para fins de rastreabilidade.”

---

## 12. Requisitos Não Funcionais do Frontend

### 12.1 Performance
- LCP abaixo de 2.5s nas páginas agregadas.
- Interações de filtro abaixo de 300ms em dados já carregados.
- Paginação server-side para tabelas grandes.
- Virtualização de listas em auditoria.

### 12.2 Segurança
- CSP estrita.
- Sanitização de evidências textuais.
- Downloads assinados e expirados.
- Session handling seguro com refresh controlado.
- Nunca armazenar payload sensível em localStorage.

### 12.3 Observabilidade
- rastrear:
  - filtros usados;
  - telas mais acessadas;
  - exportações;
  - tentativas de acesso negado;
  - tempo de resposta percebido.

### 12.4 Acessibilidade
- navegação por teclado;
- contraste AA;
- labels claros;
- gráficos com alternativa textual;
- status representados por texto, não apenas cor.

---

## 13. Estratégia de Responsividade

### Desktop
Experiência principal, com múltiplos painéis, tabelas largas e comparativos complexos.

### Tablet
Manter dashboards, com simplificação de colunas.

### Mobile
Foco em leitura:
- cards ao invés de tabelas extensas;
- comparação limitada;
- auditoria apenas em modo consulta simplificada, salvo permissão explícita e necessidade operacional.

---

## 14. Telemetria de Produto

Eventos mínimos:
- `ranking_viewed`
- `agent_profile_opened`
- `team_profile_opened`
- `policy_explained_opened`
- `task_breakdown_opened`
- `audit_record_opened`
- `review_case_opened`
- `export_requested`
- `saved_filter_created`
- `comparison_started`

Todos os eventos devem incluir:
- usuário;
- papel;
- escopo;
- período;
- filtros;
- timestamp;
- origem da navegação.

---

## 15. Critérios de Aceite do Frontend

1. O usuário interno consegue entender o ranking geral em menos de 60 segundos.
2. O gestor operacional consegue explicar por que um agente recebeu determinado score.
3. O auditor consegue reconstruir a formação do score e o histórico de alteração.
4. Não existe caminho de navegação que exponha payload bruto para perfil sem permissão.
5. Toda tela analítica mostra claramente o período e a versão da política.
6. O mesmo agente pode ser visto por agente, equipe, função e período sem inconsistência visual.
7. As badges exibem critérios, status e histórico.
8. Consequências operacionais são visíveis e rastreáveis.
9. Revisões preservam histórico original e revisado.
10. Exportações ficam restritas e rastreadas.

---

## 16. Roadmap de Entrega Recomendado

### Fase 1 — Base institucional
- login e permissões;
- dashboard geral;
- central de ranking;
- perfil do agente resumido;
- catálogo de badges;
- política visível.

### Fase 2 — Operação
- drill-down por tarefa;
- perfil de equipe;
- perfil de função;
- consequências operacionais;
- comparativos;
- exportações controladas.

### Fase 3 — Governança e auditoria
- auditoria detalhada;
- revisões e apelações;
- versionamento de regras;
- simulador de impacto;
- logs de acesso avançados.

---

## 17. Dependências de Backend

O frontend depende dos seguintes domínios do backend:
- autenticação e autorização;
- ranking e scorecards;
- execuções de tarefa;
- badges;
- consequências;
- auditoria;
- revisões;
- políticas e versões;
- exports e snapshots.

Sem esses domínios, o frontend não consegue garantir consistência entre score por tarefa, score por período e visibilidade em camadas.

---

## 18. Resultado Esperado

O frontend deve operar como uma interface de confiança institucional. O objetivo não é apenas mostrar quem está na frente, mas **explicar por que está na frente**, **mostrar o que mudou**, **quem pode ver o quê** e **qual ação deve ocorrer a partir disso**.