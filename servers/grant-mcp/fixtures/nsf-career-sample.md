---
title: "CAREER: Advancing Equitable AI Systems Through Causal Reasoning"
funder: nsf
programType: CAREER
pi: "Dr. Alex Johnson"
institution: "State Technical University"
funding_period: "09/01/2026 - 08/31/2031"
---

# Project Description

## Introduction

Artificial intelligence systems are increasingly deployed in high-stakes domains
including healthcare, criminal justice, and education. However, these systems
often perpetuate or amplify existing societal biases, leading to inequitable
outcomes for marginalized communities. This CAREER proposal presents a research
and education program focused on developing causal reasoning frameworks to
identify, measure, and mitigate bias in AI systems.

## Background and Related Work

Fairness in machine learning has been studied from multiple perspectives,
including individual fairness, group fairness, and counterfactual fairness.
Causal inference provides a principled framework for reasoning about fairness
by explicitly modeling the data-generating process and identifying pathways
through which sensitive attributes influence outcomes.

## Proposed Research

### Task 1: Causal Discovery for Fairness Auditing

We will develop algorithms for automatically discovering causal graphs from
observational data in fairness-critical applications. These graphs will enable
practitioners to identify discriminatory pathways and design appropriate
interventions.

### Task 2: Counterfactual Fairness Estimation

Building on the causal graphs from Task 1, we will develop efficient methods
for estimating counterfactual fairness metrics at scale, enabling real-time
fairness monitoring in deployed systems.

### Task 3: Intervention Design and Evaluation

We will create a toolkit for designing and evaluating fairness interventions
based on causal reasoning, including pre-processing, in-processing, and
post-processing approaches.

## Broader Impacts

This project will directly impact society by providing tools and frameworks for
building more equitable AI systems. The education plan includes developing a new
graduate course on causal reasoning for AI fairness, mentoring undergraduate
researchers from underrepresented groups, and creating open educational resources
for K-12 students.

## Results from Prior NSF Support

The PI received NSF Award CNS-2112345 ($250,000, 2023-2025) for preliminary
work on causal fairness metrics. Key results include the development of the
CausalFair toolkit (500+ GitHub stars) and three published papers in top venues.

## Timeline and Milestones

- Year 1: Causal discovery algorithm development and initial evaluation
- Year 2: Counterfactual fairness estimation framework
- Year 3: Intervention toolkit development
- Year 4: Large-scale evaluation and case studies
- Year 5: Community deployment and education program completion

# Data Management Plan

## 1. Types of Data

This project will produce algorithmic implementations (Python/R code), benchmark
datasets for fairness evaluation, experimental results, and educational materials.

## 2. Data and Metadata Standards

All code will follow PEP 8 standards and include comprehensive documentation.
Datasets will be accompanied by datasheets describing their provenance and
intended use.

## 3. Policies for Access and Sharing

All code and non-sensitive data will be made publicly available under open-source
licenses (MIT for code, CC-BY for educational materials) via GitHub and Zenodo.

## 4. Policies for Re-Use

We encourage re-use and redistribution of all project outputs under their
respective licenses.

## 5. Plans for Archiving

All project outputs will be archived on Zenodo with DOIs for long-term
preservation and citation.

# Budget Justification

The budget includes PI summer salary (2 months), one graduate research assistant,
computing resources for large-scale experiments, and travel to two conferences
annually. Equipment funds cover a workstation with GPU for model training.

# Biosketch

Dr. Alex Johnson is an Assistant Professor of Computer Science at State Technical
University. They received their Ph.D. from Carnegie Mellon University in 2021 and
specialize in fairness and accountability in machine learning systems.

# References

1. Pearl, J. (2009). Causality: Models, Reasoning, and Inference.
2. Barocas, S., Hardt, M., & Narayanan, A. (2019). Fairness and Machine Learning.
3. Kusner, M. J., et al. (2017). Counterfactual Fairness. NeurIPS.
