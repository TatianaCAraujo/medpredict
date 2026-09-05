# 📊 Análise Exploratória e Resultados

Esta pasta reúne as principais visualizações utilizadas na análise dos dados e na avaliação do modelo do projeto **MedPredict**.

Os gráficos foram selecionados para destacar os principais padrões encontrados nos dados e apoiar a interpretação dos resultados do modelo final.

---

## 🎯 Distribuição do No-Show

**Arquivo:** `distribuicao_no_show.png`

Apresenta a distribuição da variável alvo na base original:

- **79,8%** das consultas resultaram em comparecimento;
- **20,2%** das consultas resultaram em falta.

A diferença entre as classes evidencia o desbalanceamento da base e demonstra por que a acurácia, isoladamente, não é suficiente para avaliar os modelos.

Um modelo que previsse comparecimento para todos os pacientes teria aproximadamente 80% de acurácia, mas não identificaria nenhuma falta.

---

## 🔎 Hipóteses H1 e H2

**Arquivo:** `hipoteses_h1_h2.png`

A visualização reúne duas hipóteses investigadas durante a análise exploratória.

### H1 — Tempo de espera

Foi observada associação entre o tempo de espera e o No-Show.

Consultas com maior intervalo entre o agendamento e a data da consulta apresentaram maior percentual de faltas.

### H2 — Faixa etária

A análise também investigou diferenças no percentual de faltas entre diferentes faixas etárias.

Os resultados indicaram maior percentual de No-Show entre adolescentes e jovens quando comparados às faixas etárias mais altas.

Esses resultados representam associações observadas nos dados e não devem ser interpretados como relações causais.

---

## 📱 Hipótese H3 — SMS

**Arquivo:** `hipotese_h3_sms.png`

A análise investigou a relação entre o recebimento de SMS e o No-Show considerando diferentes faixas de tempo de espera.

Quando a comparação é realizada dentro das mesmas faixas de espera, os pacientes que receberam SMS apresentaram menor percentual de faltas.

Esse resultado também evidencia a importância de considerar outras variáveis ao interpretar relações encontradas nos dados.

---

## 🏆 Matriz de confusão — Gradient Boosting

**Arquivo:** `matriz_confusao_gradient_boosting.png`

Apresenta os resultados da classificação realizada pelo **Gradient Boosting**, modelo selecionado como modelo final do MedPredict.

Na avaliação apresentada:

- **5.623 verdadeiros positivos (VP):** faltas corretamente identificadas;
- **1.071 falsos negativos (FN):** faltas que não foram identificadas;
- **12.907 falsos positivos (FP):** consultas sinalizadas como possível falta, mas que resultaram em comparecimento;
- **13.556 verdadeiros negativos (VN):** comparecimentos corretamente identificados.

O modelo alcançou **recall de aproximadamente 0,840 para a classe No-Show**, identificando cerca de 84% das faltas reais no conjunto avaliado.

O resultado também evidencia o trade-off existente entre identificar mais faltas e gerar mais falsos positivos.

---

## 🎚️ Ajuste do threshold

**Arquivo:** `ajuste_threshold_gradient_boosting.png`

A visualização apresenta o comportamento de **precisão, recall e F1-score** em diferentes limiares de decisão.

O threshold adotado no projeto foi **0,46**.

A escolha considera o equilíbrio entre identificar faltas reais e controlar a quantidade de alertas gerados pelo modelo.

Thresholds menores tendem a aumentar o recall, identificando mais faltas, mas também podem aumentar os falsos positivos.

Thresholds maiores tornam o modelo mais conservador, podendo reduzir os falsos positivos ao custo de deixar mais faltas sem identificação.

---

## ⚠️ Interpretação

As visualizações representam padrões e associações encontrados na base histórica utilizada pelo projeto.

Os resultados não devem ser interpretados como relações causais ou como previsão absoluta do comportamento individual dos pacientes.

O MedPredict utiliza essas informações como apoio à **priorização de risco e tomada de decisão**, mantendo as decisões e ações relacionadas aos pacientes sob responsabilidade humana.
