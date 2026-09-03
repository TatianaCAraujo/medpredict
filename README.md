# MedPredict

**Predição de No-Show em consultas médicas com Machine Learning e experiência integrada para o paciente.**

TCC da Turma Fly 2026 - Grupo 5 - Trama

`Python` `pandas` `scikit-learn` `Machine Learning` `Gradient Boosting`

## O problema

O não comparecimento a consultas médicas (No-Show) pode gerar desperdício de recursos, ociosidade na agenda e dificultar o acesso de outros pacientes ao atendimento.

O MedPredict investiga dados históricos de consultas para identificar padrões associados às faltas e avaliar como Machine Learning pode apoiar ações preventivas, sem substituir a decisão humana.

Além da análise preditiva, o projeto considera a experiência do paciente no gerenciamento de seus próprios agendamentos.

## Os dados

- **Fonte:** a ser documentada em `dados/FONTE.md`.
- **Recorte:** será detalhado após a consolidação final da análise.
- **Amostra no repositório:** será disponibilizada na pasta `dados/`.
- **Como reproduzir:** consultar `dados/FONTE.md`.

## O método

O projeto realizou análise exploratória dos dados, tratamento e limpeza da base, seleção de variáveis e preparação dos dados para treinamento e teste.

Foram comparadas diferentes abordagens, incluindo Baseline, Regressão Logística, Random Forest e Gradient Boosting, além de validação cruzada e avaliação das métricas dos modelos.

O Gradient Boosting foi selecionado como modelo principal para apresentação e documentação do projeto.

## Os resultados

Os resultados finais e as principais métricas do modelo serão incluídos nesta seção após a conclusão e validação da análise.

## O protótipo

O MedPredict possui duas frentes complementares:

### Machine Learning

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

O link para o protótipo publicado será incluído após a disponibilização via GitHub Pages.

## Limitações

As limitações identificadas durante a análise serão documentadas nesta seção após a validação final do projeto.

## O grupo

**TRAMA**

- Camila
- Jacqueline
- Nelly
- Renata
- Suzanne
- Tatiana






Os links profissionais das integrantes serão adicionados posteriormente.

## Como rodar

1. Abra `notebook/01_analise_completa.ipynb` no Google Colab.
2. Execute as células de cima para baixo.
3. Consulte `requisitos.txt` para verificar as bibliotecas utilizadas.
4. Consulte `dados/FONTE.md` para informações sobre a origem e reprodução dos dados.
