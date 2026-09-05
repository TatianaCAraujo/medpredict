# 🩺 MedPredict

**Predição de No-Show em consultas médicas utilizando Machine Learning e experiência integrada para o paciente.**

**TCC da Turma Fly 2026 — Grupo 5 — TRAMA**

`Python` `pandas` `scikit-learn` `Machine Learning` `Gradient Boosting` `Data Science`

---

## 🎯 O problema

O não comparecimento a consultas médicas (**No-Show**) pode gerar desperdício de recursos, ociosidade na agenda e dificultar o acesso de outros pacientes ao atendimento.

O **MedPredict** utiliza dados históricos de consultas para identificar padrões associados às faltas e avaliar como Machine Learning pode apoiar ações preventivas.

A proposta não é determinar quem irá faltar, mas utilizar o risco estimado pelo modelo como apoio à priorização de ações como confirmação ou reagendamento de consultas.

As decisões e os contatos com pacientes permanecem sob responsabilidade humana.

Além da análise preditiva, o projeto contempla uma segunda frente voltada à experiência do paciente, por meio de um MVP para gerenciamento dos próprios agendamentos.

---

## 💡 Pergunta central

> É possível prever quais pacientes apresentam maior risco de faltar a uma consulta, permitindo que a clínica atue preventivamente?

O problema foi tratado como uma tarefa de **classificação binária**:

- `0` → paciente compareceu;
- `1` → paciente faltou.

---

## 📊 Os dados

O projeto utiliza a base pública **Medical Appointment No Shows**, disponibilizada no Kaggle.

🔗 [Medical Appointment No Shows — Kaggle](https://www.kaggle.com/datasets/joniarroba/noshowappointments)

A base original contém:

- **110.527 registros de consultas**
- **14 colunas**
- informações demográficas;
- características do agendamento;
- condições de saúde;
- informação sobre recebimento de SMS;
- bairro;
- status de comparecimento.

Na distribuição original do alvo:

- **88.208 consultas (79,8%)** resultaram em comparecimento;
- **22.319 consultas (20,2%)** resultaram em falta.

Essa diferença entre as classes é importante porque demonstra por que **acurácia isoladamente não é suficiente** para avaliar os modelos.

Um modelo que simplesmente previsse que todos os pacientes compareceriam teria aproximadamente 80% de acurácia, mas seria incapaz de identificar as faltas.

### Dados disponibilizados no repositório

Por questões de organização e reprodutibilidade, o repositório contém uma amostra da base:

`dados/amostra_1000_linhas.csv`

As informações sobre a origem e obtenção da base completa estão documentadas em:

`dados/FONTE.md`

---

## 🔎 Análise exploratória e hipóteses

Durante o desenvolvimento foram investigadas **6 hipóteses** relacionadas ao comportamento de No-Show.

As análises buscaram compreender possíveis relações entre as faltas e características presentes na base, incluindo aspectos como:

- tempo entre agendamento e consulta;
- faixa etária;
- recebimento de SMS;
- localização/bairro;
- características do paciente;
- variáveis relacionadas ao agendamento.

As hipóteses foram avaliadas antes da construção dos modelos e ajudaram a orientar o tratamento dos dados e a engenharia de atributos.

O notebook completo contém as análises, visualizações, interpretações e resultados obtidos em cada etapa.

---

## 🧹 Preparação dos dados

Antes do treinamento dos modelos foi realizado um processo de preparação da base, incluindo:

- análise exploratória;
- identificação de valores inconsistentes;
- tratamento e limpeza dos registros;
- conversão e tratamento das datas;
- remoção de identificadores sem valor preditivo;
- seleção de variáveis;
- criação de novas características;
- preparação das variáveis categóricas;
- separação entre dados de treino e teste;
- construção de pipelines de Machine Learning.

Entre as características derivadas utilizadas durante a análise está o **tempo de espera entre o agendamento e a consulta (`DiasEspera`)**.

---

## 🤖 Modelagem

Foram comparadas diferentes abordagens de Machine Learning:

1. **Baseline — prever comparecimento**
2. **Regressão Logística**
3. **Árvore de Decisão**
4. **Random Forest**
5. **Gradient Boosting**

O baseline foi utilizado como referência para demonstrar a limitação da acurácia em uma base desbalanceada.

Os modelos foram avaliados considerando especialmente o equilíbrio entre precisão e recall para a classe No-Show, representado pelo F1-score, além da capacidade de identificar faltas reais.

### Comparação inicial

| Modelo | Acurácia | Precisão — Falta | Recall — Falta | F1 — Falta |
|---|---:|---:|---:|---:|
| Gradient Boosting | 0,578 | 0,303 | 0,840 | **0,446** |
| Árvore de Decisão | 0,562 | 0,297 | **0,853** | 0,440 |
| Random Forest | 0,572 | 0,298 | 0,825 | 0,437 |
| Regressão Logística | **0,654** | **0,308** | 0,576 | 0,402 |
| Baseline | **0,798** | 0,000 | 0,000 | 0,000 |

O resultado do baseline evidencia a chamada **armadilha da acurácia**: apesar de apresentar aproximadamente 80% de acurácia, ele não identifica nenhuma falta.

---

## 🏆 Modelo final

Após a comparação entre os modelos avaliados, o **Gradient Boosting** foi selecionado como modelo final do MedPredict.

Na comparação realizada, o Gradient Boosting apresentou o **melhor F1-score para a classe No-Show, de 0,446**, mantendo também um **recall elevado de 0,840**.

A escolha considerou o equilíbrio entre precisão e recall, representado pelo F1-score, sem perder de vista a importância de identificar o maior número possível de faltas reais.

No contexto do MedPredict, essa característica é especialmente importante porque o objetivo não é apenas obter uma alta acurácia geral, mas identificar consultas com risco de No-Show que possam ser priorizadas para ações preventivas.

O modelo deve ser utilizado como ferramenta de apoio à priorização, mantendo as decisões e os contatos com pacientes sob responsabilidade humana.


---

## 🧪 Validação cruzada

Para reduzir o risco de avaliar os modelos com base apenas em uma divisão específica dos dados, foi utilizada **validação cruzada** durante o processo de modelagem.

Essa etapa permitiu observar a estabilidade do desempenho dos modelos em diferentes divisões dos dados, complementando a avaliação realizada no conjunto de teste.

A seleção final do **Gradient Boosting** considerou os resultados da comparação entre os modelos, com destaque para o melhor F1-score obtido para a classe No-Show.

---

## 📈 Resultado final

Na comparação dos modelos, o **Gradient Boosting** apresentou o melhor F1-score para identificação de No-Show.

| Métrica | Resultado |
|---|---:|
| Acurácia | 0,578 |
| Precisão — No-Show | 0,303 |
| Recall — No-Show | **0,840** |
| F1-score — No-Show | **0,446** |

O recall de **0,840** indica que, no conjunto avaliado, o modelo identificou aproximadamente **84% das faltas reais**.

Ao mesmo tempo, a precisão de 0,303 demonstra que parte dos alertas gerados corresponde a pacientes que compareceriam à consulta.

Esse comportamento representa um trade-off importante do projeto: aumentar a capacidade de encontrar possíveis faltas também pode aumentar a quantidade de ações preventivas realizadas.

Por isso, o MedPredict deve ser utilizado como ferramenta de **priorização de risco e apoio à decisão**, e não como previsão determinística do comportamento do paciente.

---

## 🧠 Interpretação dos resultados

A análise dos resultados não se limita ao desempenho do modelo.

Durante a exploração dos dados, foram investigadas características associadas ao comportamento de No-Show, permitindo compreender melhor os padrões presentes na base.

Entre os resultados observados, o **tempo de espera entre o agendamento e a consulta (`DiasEspera`)** apresentou associação relevante com o risco de falta.

Essas relações devem ser interpretadas como **associações encontradas nos dados**, e não como relações causais.

---

## 🖥️ Protótipo

O MedPredict possui duas frentes complementares.

### Machine Learning

A frente preditiva busca:

- analisar dados históricos de consultas;
- estimar o risco de No-Show;
- apoiar a priorização de pacientes para ações preventivas;
- apoiar processos de confirmação ou reagendamento;
- manter decisões e contatos sob responsabilidade humana.

### Experiência do paciente

O MVP propõe uma experiência centralizada para gerenciamento das consultas, permitindo ao paciente:

- visualizar seus agendamentos;
- confirmar consultas;
- cancelar consultas;
- gerenciar seus compromissos de forma mais simples e centralizada.

Dessa forma, o projeto combina **análise preditiva** e **experiência do usuário** para abordar o problema de No-Show por duas perspectivas complementares.

---

## ⚠️ Limitações

O comportamento de comparecimento a uma consulta depende de diversos fatores que não estão disponíveis na base utilizada.

O dataset não informa, por exemplo, todas as circunstâncias externas que podem influenciar uma falta.

Por isso:

- o modelo não deve ser interpretado como previsão absoluta do comportamento individual;
- os resultados representam padrões presentes na base histórica;
- associações encontradas não significam necessariamente causalidade;
- falsos positivos e falsos negativos continuam existindo;
- o modelo deve ser utilizado como ferramenta de apoio e priorização;
- decisões finais devem permanecer sob responsabilidade humana.

O próprio desempenho obtido demonstra essa limitação: o comportamento humano é influenciado por fatores que uma base histórica limitada não consegue representar completamente.

---

## 📁 Estrutura do repositório

```text
medpredict/
│
├── apresentacao/
│   └── materiais da apresentação do projeto
│
├── dados/
│   ├── FONTE.md
│   └── amostra_1000_linhas.csv
│
├── imagens/
│   └── imagens e recursos visuais do projeto
│
├── notebook/
│   ├── 01_analise_completa.ipynb
│   └── README.md
│
├── prototipo/
│   └── README.md
│
├── README.md
└── requisitos.txt
