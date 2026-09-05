# 📓 Notebook — MedPredict

Esta pasta contém o notebook principal de análise e modelagem do projeto **MedPredict**.

## Arquivo principal

`01_analise_completa.ipynb`

O notebook reúne o fluxo completo do projeto, incluindo:

- carregamento e inspeção dos dados;
- análise exploratória;
- investigação das 6 hipóteses;
- limpeza e preparação da base;
- engenharia e seleção de atributos;
- separação entre treino e teste;
- construção de pipelines;
- comparação entre modelos de Machine Learning;
- validação e análise das métricas;
- seleção do **Gradient Boosting** como modelo final.

## Modelos avaliados

Foram comparados:

- Baseline;
- Regressão Logística;
- Árvore de Decisão;
- Random Forest;
- Gradient Boosting.

O **Gradient Boosting** apresentou o melhor F1-score para a classe No-Show na comparação realizada e foi selecionado como modelo final do MedPredict.

Para informações gerais sobre o projeto, consulte o `README.md` principal do repositório.
