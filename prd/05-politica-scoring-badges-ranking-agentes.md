# Política Oficial de Scoring e Badges — Ranking de Eficiência de Agentes Virtuais

## 1. Finalidade

Esta política estabelece as regras oficiais para cálculo de score, atribuição de badges, classificação operacional, revisão, transparência e governança do sistema **Ranking de Eficiência de Agentes Virtuais**.

Ela existe para garantir:
- comparabilidade justa;
- previsibilidade;
- explicabilidade;
- auditabilidade;
- consequência operacional proporcional;
- reconhecimento consistente.

---

## 2. Princípios Oficiais

1. **Objetividade**: toda nota e todo badge devem nascer de critérios verificáveis.
2. **Rastreabilidade**: toda decisão deve ser auditável.
3. **Comparabilidade justa**: o padrão de comparação prioritário é por função.
4. **Estabilidade com revisão possível**: scores publicados são estáveis, mas revisáveis por processo formal.
5. **Transparência em camadas**: todos podem ver o resultado; nem todos podem ver a mesma profundidade.
6. **Não arbitrariedade**: nenhuma badge ou consequência operacional pode surgir sem regra oficial.
7. **Histórico preservado**: revisões, revogações e reprocessamentos nunca apagam a trilha anterior.

---

## 3. Escopo de Aplicação

Esta política se aplica a:
- agentes individuais;
- equipes;
- funções;
- recortes por período;
- tarefas elegíveis ao ranking.

Não se aplica automaticamente a:
- eventos sem evidência mínima;
- execuções duplicadas;
- dados com integridade comprometida;
- tarefas marcadas explicitamente como não elegíveis.

---

## 4. Estrutura Oficial do Score

## 4.1 Score por tarefa
Cada execução elegível recebe um **Score de Tarefa** de 0 a 100.

### Fórmula oficial
```text
Score de Tarefa = Soma Ponderada das Dimensões – Penalidades Aplicáveis
```

### Limites
- mínimo: 0
- máximo: 100
- arredondamento: 2 casas decimais

---

## 4.2 Dimensões oficiais e pesos padrão

| Dimensão | Peso padrão | Descrição |
|---|---:|---|
| Efetividade de Conclusão | 20% | Mede se a tarefa foi concluída com resultado útil e aderente ao objetivo. |
| Qualidade do Resultado | 20% | Mede precisão, utilidade, consistência e robustez do entregável. |
| Cumprimento de SLA / Tempo | 15% | Mede aderência ao tempo esperado para a tarefa. |
| Conformidade / Governança | 15% | Mede aderência a regras, política, segurança e restrições de operação. |
| Autonomia Operacional | 10% | Mede capacidade de resolver sem escalonamentos desnecessários. |
| Evidência / Rastreabilidade | 10% | Mede qualidade do registro, prova, logs e contexto de auditoria. |
| Eficiência sem Retrabalho | 10% | Mede ausência de retrabalho, reenvio, correção repetida ou instabilidade. |

**Total:** 100%

> Observação: políticas por função podem ajustar pesos dentro do processo formal de versionamento, mas a estrutura base permanece a mesma.

---

## 4.3 Escala de cada dimensão

Cada dimensão deve ser convertida para nota de 0 a 100 antes da ponderação.

### Faixas interpretativas
- **95–100**: excelência verificável
- **85–94.99**: desempenho muito forte
- **70–84.99**: desempenho satisfatório
- **55–69.99**: desempenho frágil
- **0–54.99**: desempenho crítico

---

## 5. Penalidades Oficiais

Penalidades reduzem o Score de Tarefa após a soma ponderada das dimensões.

## 5.1 Penalidades típicas
| Código | Faixa sugerida | Regra |
|---|---:|---|
| `minor_rework` | -2 a -5 | Retrabalho leve ou correção simples. |
| `major_rework` | -6 a -15 | Retrabalho relevante ou necessidade de refação substancial. |
| `sla_breach` | -3 a -12 | Descumprimento de prazo aplicável. |
| `evidence_missing` | -5 a -20 | Ausência ou insuficiência relevante de evidência. |
| `policy_breach_minor` | -5 a -15 | Desvio leve de conformidade. |
| `policy_breach_major` | -16 a -40 | Violação relevante de regra, processo ou segurança. |
| `escalation_unnecessary` | -3 a -10 | Escalonamento evitável. |
| `critical_incident` | -20 a -60 | Incidente severo com impacto alto. |

## 5.2 Regras de cap
Além de penalidades, algumas ocorrências impõem teto de nota:
- violação severa de conformidade pode limitar a tarefa a **máximo 49.99**;
- ausência relevante de evidência pode limitar a tarefa a **máximo 60.00**;
- execução inválida ou não auditável pode ser **invalidada** e removida da amostra elegível.

---

## 6. Fatores de Ponderação da Tarefa no Período

Nem toda tarefa tem o mesmo peso na formação do período. O sistema usa pesos oficiais para refletir criticidade, complexidade e confiança.

## 6.1 Peso por criticidade
| Criticidade | Fator |
|---|---:|
| Low | 0.80 |
| Medium | 1.00 |
| High | 1.20 |
| Critical | 1.50 |

## 6.2 Peso por complexidade
| Complexidade | Fator |
|---|---:|
| Simple | 0.90 |
| Standard | 1.00 |
| Complex | 1.15 |
| Exceptional | 1.30 |

## 6.3 Fator de confiança
Representa o grau de completude da evidência e da validação.
- faixa normal: **0.70 a 1.00**
- acima de 1.00 somente quando houver mecanismo formal previsto em política específica.

---

## 7. Score por Período

## 7.1 Fórmula oficial
```text
Score de Período =
Σ (Score de Tarefa × Peso de Criticidade × Peso de Complexidade × Fator de Confiança)
÷
Σ (Peso de Criticidade × Peso de Complexidade × Fator de Confiança)
```

## 7.2 Observações
1. Somente tarefas elegíveis entram na amostra.
2. Tarefas invalidadas não compõem score de período.
3. Tarefas com score provisório podem compor score provisório do período.
4. O score final do período sempre indica a versão da política aplicada.

---

## 8. Regras de Amostra e Confiabilidade

## 8.1 Status da amostra
| Situação | Regra |
|---|---|
| Amostra suficiente | Score pode ser publicado como definitivo |
| Amostra insuficiente | Score deve ser marcado como provisório |
| Amostra inválida | Sem score oficial |

## 8.2 Recomendação de pisos mínimos
| Tipo de período | Piso mínimo sugerido |
|---|---:|
| Diário | 10 tarefas elegíveis |
| Semanal | 30 tarefas elegíveis |
| Mensal | 100 tarefas elegíveis |
| Trimestral | 250 tarefas elegíveis |

> Os pisos podem variar por função via política versionada, desde que a variação seja formalmente publicada.

---

## 9. Faixas Operacionais Oficiais

| Faixa | Intervalo | Interpretação |
|---|---:|---|
| Verde | 85.00–100.00 | Desempenho forte e confiável |
| Amarela | 70.00–84.99 | Desempenho adequado com pontos de atenção |
| Laranja | 55.00–69.99 | Desempenho frágil, requer ação operacional |
| Vermelha | 0.00–54.99 | Desempenho crítico, requer intervenção prioritária |

---

## 10. Consequências Operacionais Oficiais

## 10.1 Faixa Verde
Possíveis ações:
- aumento de autonomia;
- prioridade em tarefas de maior criticidade;
- reconhecimento institucional;
- elegibilidade para badges de excelência.

## 10.2 Faixa Amarela
Possíveis ações:
- monitoramento normal;
- feedback orientativo;
- observação de tendência.

## 10.3 Faixa Laranja
Possíveis ações:
- acompanhamento reforçado;
- revisão humana amostral;
- plano de melhoria;
- restrição parcial de tarefas críticas.

## 10.4 Faixa Vermelha
Possíveis ações:
- revisão humana obrigatória;
- limitação temporária de escopo;
- intervenção de liderança;
- reavaliação da função;
- auditoria ampliada.

> Consequências são orientadas pela regra e pelo score, mas podem exigir confirmação humana conforme a política vigente.

---

## 11. Regras de Ranking

## 11.1 Ordenação padrão
1. maior score do período;
2. maior sample size elegível;
3. menor incidência de penalidades severas;
4. melhor tendência versus período anterior;
5. ordem alfabética técnica como desempate final.

## 11.2 Regra de comparabilidade
- Ranking geral é permitido.
- Comparação justa prioritária é sempre por função.
- O sistema deve sinalizar quando a comparação atravessar funções heterogêneas.

---

## 12. Política Oficial de Badges

## 12.1 Princípios
1. badge não substitui score;
2. badge não pode contradizer score;
3. toda badge precisa ter critério objetivo;
4. toda badge pode ser auditada;
5. badges automáticas e validadas manualmente devem ser identificadas.

---

## 12.2 Catálogo oficial inicial de badges

### 1. Excelência Sustentada
**Objetivo:** reconhecer performance muito alta com estabilidade.  
**Critério mínimo:** score de período >= 90 por 3 períodos consecutivos, com amostra suficiente.

### 2. Guardião da Conformidade
**Objetivo:** destacar aderência exemplar a regras.  
**Critério mínimo:** dimensão de conformidade >= 95 no período e zero ocorrência de `policy_breach_major`.

### 3. Entrega Relâmpago
**Objetivo:** reconhecer alto desempenho com tempo excelente.  
**Critério mínimo:** dimensão de SLA/tempo >= 95 e score de período >= 85.

### 4. Mestre da Autonomia
**Objetivo:** reconhecer resolução consistente sem escalonamentos desnecessários.  
**Critério mínimo:** dimensão de autonomia >= 92 e sem `escalation_unnecessary` relevante no período.

### 5. Zero Retrabalho
**Objetivo:** destacar consistência operacional sem refações relevantes.  
**Critério mínimo:** dimensão de eficiência sem retrabalho >= 95 e nenhuma penalidade `major_rework`.

### 6. Evidência Impecável
**Objetivo:** valorizar rastreabilidade e prova.  
**Critério mínimo:** dimensão de evidência >= 95 e zero cap por `evidence_missing`.

### 7. Ascensão do Período
**Objetivo:** reconhecer maior evolução positiva.  
**Critério mínimo:** maior delta positivo entre agentes comparáveis, com piso mínimo de amostra.

### 8. Recuperação Exemplar
**Objetivo:** premiar recuperação consistente após período ruim.  
**Critério mínimo:** agente sai de faixa laranja/vermelha para verde ou amarela alta em período subsequente, sem reprocessamento artificial.

### 9. Top 1% da Função
**Objetivo:** reconhecer elite comparável.  
**Critério mínimo:** estar no percentil 99 da própria função, com score definitivo.

### 10. Top 5% da Função
**Objetivo:** reconhecer desempenho de destaque.  
**Critério mínimo:** estar no percentil 95 da própria função.

### 11. Consistência 90/90/90
**Objetivo:** reconhecer estabilidade robusta em três ciclos oficiais.  
**Critério mínimo:** score >= 90 em três períodos consecutivos.

### 12. Equipe de Alto Impacto
**Objetivo:** reconhecer excelência coletiva.  
**Critério mínimo:** equipe com score médio >= 88, desvio controlado e ausência de concentração excessiva em poucos agentes.

---

## 12.3 Regras de revogação de badge
Uma badge pode ser revogada quando:
- o critério deixa de ser atendido em regra de vigência contínua;
- é detectada inconsistência material no dado de origem;
- há revisão formal que invalida a concessão;
- a badge depende de status ativo e o contexto deixa de existir.

Toda revogação deve registrar:
- data;
- motivo;
- responsável, se manual;
- vínculo com scorecard, revisão ou regra.

---

## 13. Política de Revisão e Apelação

## 13.1 Casos elegíveis para revisão
- erro material em dados da execução;
- aplicação incorreta de política;
- evidência omitida ou classificada incorretamente;
- duplicidade;
- penalidade indevida;
- badge atribuída ou negada incorretamente.

## 13.2 Regras do processo
1. abertura formal;
2. atribuição a responsável;
3. análise com fundamento;
4. decisão registrada;
5. preservação de score original e revisado;
6. atualização rastreável de badges e consequências, quando aplicável.

## 13.3 Tipos de decisão
- score mantido;
- score ajustado;
- score invalidado.

---

## 14. Política de Transparência em Camadas

## 14.1 Visão ampla interna
Pode ver:
- ranking agregado;
- score do período;
- tendência;
- badges;
- faixas operacionais;
- metodologia resumida.

Não pode ver:
- payload bruto;
- evidência sensível;
- logs completos de auditoria.

## 14.2 Visão operacional
Pode ver:
- score por tarefa;
- breakdown por dimensão;
- penalidades;
- histórico operacional;
- consequências;
- comparações por função.

Não pode ver, por padrão:
- payload bruto completo;
- anexos sensíveis;
- logs detalhados de acesso.

## 14.3 Visão restrita de auditoria
Pode ver:
- payload bruto;
- evidências;
- versão de regra;
- revisão;
- exportação auditada;
- logs de acesso e alteração.

---

## 15. Política de Publicação e Reprocessamento

1. todo score publicado deve estar vinculado a um período e a uma versão de política;
2. reprocessamento não apaga publicação anterior;
3. o frontend deve sinalizar quando um resultado foi reprocessado;
4. badges e consequências derivadas de score revisado devem ser recalculadas;
5. mudanças de política só valem a partir de publicação formal.

---

## 16. Regras Antigaming

Para reduzir manipulação ou leituras distorcidas, o sistema deve:
- exigir piso mínimo de amostra;
- separar score provisório de score definitivo;
- penalizar ausência de evidência;
- detectar duplicidade;
- sinalizar comparações heterogêneas;
- preservar histórico de revisões;
- impedir alteração silenciosa de períodos fechados.

---

## 17. Exemplos Simplificados

## 17.1 Exemplo de score por tarefa
Uma execução recebe:
- efetividade 90
- qualidade 88
- SLA 95
- conformidade 100
- autonomia 85
- evidência 80
- retrabalho 92

Aplicando pesos:
```text
(90×0.20) + (88×0.20) + (95×0.15) + (100×0.15) + (85×0.10) + (80×0.10) + (92×0.10)
= 90.15
```

Se houver penalidade `minor_rework` de -3:
```text
Score de Tarefa = 90.15 - 3 = 87.15
```

## 17.2 Exemplo de score de período
Suponha 3 tarefas:
- tarefa A: 87.15, peso final 1.00
- tarefa B: 92.00, peso final 1.20
- tarefa C: 78.00, peso final 1.50

```text
Score de Período =
(87.15×1.00 + 92×1.20 + 78×1.50) / (1.00 + 1.20 + 1.50)
= 84.36
```

Resultado: **faixa amarela**.

---

## 18. Governança

A governança da política deve garantir:
- publicação formal;
- versionamento;
- trilha de mudança;
- justificativa obrigatória;
- rastreabilidade no frontend e backend.

Toda alteração em:
- pesos,
- thresholds,
- faixas,
- badges,
- consequências,
deve gerar nova versão de política.

---

## 19. Vigência

Esta política entra em vigor na data de publicação da versão correspondente no sistema. Toda consulta, scorecard, badge ou revisão deve informar explicitamente a versão aplicada.

---

## 20. Resultado Esperado

Com esta política, o sistema passa a ter:
- score por tarefa compreensível;
- score por período comparável;
- badges objetivas;
- consequências proporcionais;
- revisão formal;
- transparência em camadas;
- confiança operacional e institucional.