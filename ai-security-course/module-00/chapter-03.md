---
title: "AI Security Course, Module 00 — Chapter 3: Neural Networks and Optimization"
description: "A CTI-grounded foundation for neural-network computation, optimization, reproducibility, attacker access, adversarial examples, robustness evaluation, poisoning, backdoors, inference attacks, and defensible AI security evidence."
module: "00"
chapter: "3"
status: "Published"
canonical: "https://1200km.com/ai-security-course/module-00/chapter-03.html"
medium: "https://medium.com/@1200km/ai-security-course-module-00-chapter-3-1bf0411472f6"
published: "2026-08-08"
author: "Andrey Pautov"
---

<a id="top"></a>
[AI Security Engineering](https://1200km.com/ai-security-course.html) / [Module 00](https://1200km.com/ai-security-course/module-00.html) / Chapter 3

**Module 00** · **Chapter 3** · **Published** · **CTI evidence base**

Navigation: [Module 00](https://1200km.com/ai-security-course/module-00.html) · [Chapter 2](https://1200km.com/ai-security-course/module-00/chapter-02.html) · [Course syllabus](https://1200km.com/ai-security-course.html) · [Terminology dictionary](https://1200km.com/ai-security-course/glossary.html)

Medium companion: [Read the original publication](https://medium.com/@1200km/ai-security-course-module-00-chapter-3-1bf0411472f6).

# AI Security Course, Module 00 — Chapter 3: Neural Networks and Optimization

> **Chapter status: Published.** This learner-ready chapter was published on 8 August 2026. The Medium article is the original companion publication; this page is the canonical course version with locally preserved visuals, cross-links, and the assessed analyst exercise.

This chapter explains neural-network computation, optimization, reproducibility, attacker access, adversarial claims, and defensible evidence for security practitioners without a calculus prerequisite.

![AI Security Course Chapter 3 cover: Neural Networks and Optimization for security practitioners](/ai-security-course/assets/chapter-03/00-cover.png)

## Table of contents

1. [1. Why the mechanism matters to security](#mechanism)
2. [2. Neural-network security objects](#security-objects)
3. [3. The forward pass](#forward-pass)
4. [4. Loss functions and objectives](#loss)
5. [5. Gradients and backpropagation](#gradients)
6. [6. Optimization in practice](#optimization)
7. [7. Generalization, regularization, and drift](#generalization)
8. [8. Reproducibility and the nondeterminism problem](#reproducibility)
9. [9. Attacker access and the threat-model taxonomy](#attacker-access)
10. [10. Adversarial examples and evasion](#adversarial)
11. [11. Evaluating robustness claims](#robustness)
12. [12. Poisoning and backdoors](#poisoning)
13. [13. What inference reveals about training](#inference-training)
14. [14. CTI case study: evading a malware classifier](#cti-case)
15. [15. Controls, ATLAS mapping, and analyst exercise](#controls)
16. [16. Key takeaways](#key-takeaways)
17. [17. References](#references)
18. [18. What comes next](#next)

<a id="mechanism"></a>
## 1. Why the mechanism matters to security

Security teams do not need calculus, but they do need a causal model of changed predictions. A neural network is a parameterized computation, not the complete AI system; data, preprocessing, features, configuration, dependencies, serving, policy, and downstream action also matter.

During incident response, a changed output may result from a modified input, parser, tokenizer, checkpoint, adapter, threshold, random seed, library, or serving route. A score is evidence for a policy decision, never the policy or an authorization. Ask which observable component changed and what evidence connects it to the outcome.

![The full Chapter 3 arc from an input tensor through layers, loss, gradients, optimization, a released artifact, inference, downstream policy, and evidence.](/ai-security-course/assets/chapter-03/01-overview.png)

<!-- Open Graph image candidate: https://1200km.com/ai-security-course/assets/chapter-03/01-overview.png -->

*Figure 1 — The full chapter arc: input tensor through layers, loss, gradients, optimizer update, released artifact, inference, downstream policy, and evidence. [Open infographic ↗](https://1200km.com/ai-security-course/assets/chapter-03/01-overview.png)*

```text
input tensor
  → layers and activations
  → output logits or values
  → loss against a target (training only)
  → gradients through backpropagation (training only)
  → optimizer update to parameters (training only)
  → released artifact + configuration
  → inference output and downstream policy
  → telemetry and evidence
```

Training and inference are different paths. Loss, gradients, and updates normally belong to training; a released artifact turns an input into a score, classification, generation, or embedding that may influence deterministic policy. Preserve the boundary in diagrams and logs.

**Security consequence:** Calling every changed outcome a “model attack” hides feature manipulation, configuration drift, artifact substitution, distribution shift, and nondeterminism. Name the object first.

> **Course rule:** Describe the computation and the evidence chain before naming an attack. “Adversarial” is a claim that needs an access level, a perturbation budget, a query budget where applicable, reproducible conditions, and an evidence level.

<a id="security-objects"></a>
## 2. Neural-network security objects

An **architecture** is the ordered computation graph specifying layers, connections, and operations. **Parameters** are learned numeric values, such as weights and biases. **Activations** are intermediate values for one input. **Gradients** describe how an objective changes when a parameter or input changes.

![Architecture, parameters, activations, gradients, artifacts, and dependencies as distinct security objects.](/ai-security-course/assets/chapter-03/02-security-objects.png)

*Figure 2 — Architecture, parameters, activations, gradients, artifacts, and dependencies are distinct security objects. [Open infographic ↗](https://1200km.com/ai-security-course/assets/chapter-03/02-security-objects.png)*

### Tensor

A **tensor** is a typed, shaped array of numbers. Shape, data type, device, normalization, and layout form part of the model interface. A byte-level change in a file can be harmless to a human reviewer but material after parsing, padding, or conversion into a tensor.

**Security consequence:** Record the tensor contract and representative preprocessing output. A changed channel order, dtype, truncation rule, or missing-value policy can change a score without changing the checkpoint.

### Activation, logit, and probability

An **activation** is the value produced by an intermediate layer for a particular input. A **logit** is an unnormalized output score. A **probability** is a transformed score, such as a sigmoid or softmax value, that may be easier to communicate but is not automatically calibrated. A threshold converts a score into an application decision; it is configuration and policy, not a learned parameter.

**Security consequence:** Preserve preprocessing output, logits, post-processing, threshold, and final action separately. “The model said malicious” hides where the change occurred.

### Artifact, dependency, and runtime

A **model artifact** is a released representation of an architecture and learned parameters, such as a checkpoint or serialized package. A **dependency** is a library, tokenizer, custom operator, loader, or runtime component needed to execute it. Hardware, drivers, framework, and serving configuration determine how the artifact is interpreted.

**Security consequence:** A weight-file digest is insufficient. Record the architecture, tokenizer or parser, loader, lockfile, runtime versions, and release approval.

[Chapter 2](https://1200km.com/ai-security-course/module-00/chapter-02.html) covers data, features, labels, artifacts, configuration, and split methodology; cross-link rather than repeat it here.

<a id="forward-pass"></a>
## 3. The forward pass

The **forward pass** applies an architecture and its parameters to an input to produce intermediate activations and an output. In a simple layer, the computation combines an input with weights, adds a bias, and applies an activation function:

```text
z = W · x + b
a = activation(z)
```

Convolutional networks apply local filters, recurrent networks carry state through a sequence, and Transformer blocks combine attention with feed-forward transformations. Whatever the architecture, ask which input, operations, parameters, and post-processing produced the output.

![One layer's computation and the places where preprocessing, dtype, and normalization can silently diverge.](/ai-security-course/assets/chapter-03/03-forward-pass.png)

*Figure 3 — One layer's computation and where preprocessing, dtype, and normalization can silently diverge. [Open infographic ↗](https://1200km.com/ai-security-course/assets/chapter-03/03-forward-pass.png)*

Capture a minimal request fixture and run it against the approved artifact. Compare the raw input, parsed object, normalized tensor, intermediate shapes, logits, score transformation, and final policy. Use the same fixture to compare a suspected replacement, a new parser, or a new runtime.

**Security consequence:** This separates “the computation changed” from “the application sent a different tensor” and gives detection engineering a concrete parser, preprocessing, shape, or artifact signal.

<a id="loss"></a>
## 4. Loss functions and objectives

A **loss function** turns a prediction and a target into a number that training tries to minimize. Cross-entropy is common for classification, mean-squared error is common for regression, and ranking or contrastive objectives are common for retrieval and representation learning. The objective is selected by people and code; it is not a neutral description of risk.

![Loss functions, objectives, class weighting, thresholds, and their security questions.](/ai-security-course/assets/chapter-03/04-loss-objectives.png)

Class weights, focal loss, label smoothing, data filtering, reward models, and safety penalties change which errors receive attention. A security team should ask who chose the objective, which examples had the greatest influence, what cost function was used, and whether safety and abuse outcomes were measured separately from task performance.

**Security consequence:** A lower aggregate loss does not prove lower security risk. A model can improve its average score while becoming less calibrated, more vulnerable to a rare trigger, or worse for a high-cost minority class. Report the slice, threat model, and consequence with the metric.

| Objective or setting | Mechanism | Security question |
|---|---|---|
| Label smoothing | Replaces a hard target with a softened target | Does the reported confidence still mean what operators think it means? |
| Threshold | Converts a score into a decision | Is the threshold versioned, reviewed, and separated from the model artifact? |

<a id="gradients"></a>
## 5. Gradients and backpropagation

**Backpropagation** is the procedure that sends the loss signal backward through the computation graph to compute gradients for the parameters. A gradient is information about local sensitivity, not an attacker by itself. During training, the optimizer uses these values to decide how to update parameters; during an authorized white-box evaluation, an analyst may use input gradients to search for an evasion condition.

![Forward computation, backward gradient propagation, and parameter updates.](/ai-security-course/assets/chapter-03/05-backpropagation.png)

```text
forward:  input → activations → loss
backward: loss → gradients for each operation
update:   parameter ← parameter − learning rate × gradient
```

Exploding gradients, vanishing gradients, saturated activations, or unstable loss curves can indicate an implementation, data, or optimization problem. The symptoms are not proof of tampering. Preserve training logs, representative fixtures, and checkpoint lineage so an investigator can reproduce the condition and compare it with a clean reference.

**Security consequence:** The attacker access question is concrete. If an evaluator had gradients, state that as white-box access and record how it was obtained. If an evasion worked without gradients, do not imply that the attacker used them. The Cylance/Skylight case in Section 14 is important precisely because the researchers manipulated feature extraction and scoring without touching weights or gradients.

<a id="optimization"></a>
## 6. Optimization in practice

An **optimizer** is an update rule that uses gradients to change parameters. **Stochastic gradient descent (SGD)** estimates an update from a batch; momentum smooths updates; Adam adapts step sizes. A **learning rate** is the scale of an update. Batch size, epochs, schedule, weight decay, initialization, and seed can change the artifact.

![The training loop from forward pass through loss, backward pass, parameter update, and the evidence to retain at each step.](/ai-security-course/assets/chapter-03/06-training-loop.png)

*Figure 4 — Forward, loss, backward, and update steps, with the evidence to retain at each stage. [Open infographic ↗](https://1200km.com/ai-security-course/assets/chapter-03/06-training-loop.png)*

```text
dataset manifest + code + configuration
  → batch selection
  → forward pass
  → loss calculation
  → backpropagation
  → optimizer update
  → checkpoint and metrics
  → validation decision and release approval
```

Optimization is a build process. Treat the runner, dependencies, manifest, configuration, logs, checkpoint, and release approval as one supply chain. A model digest without build context cannot fully explain behavior.

![Optimization as a software build pipeline with supply-chain control points.](/ai-security-course/assets/chapter-03/07-optimization-build.png)

*Figure 5 — Optimization as a software build pipeline with supply-chain control points. [Open infographic ↗](https://1200km.com/ai-security-course/assets/chapter-03/07-optimization-build.png)*

| Setting | What it changes | Evidence to retain |
|---|---|---|
| Learning rate and schedule | Update size and stability | Configuration, scheduler state, loss, lineage |
| Batch size and epochs | Gradient noise and exposure | Dataset version, batch policy, stop reason |
| Initialization and seed | Starting point and repeatability | Seed policy, framework, hardware, determinism settings |
| Regularization | Fit/generalization trade-off | Weight decay, dropout, augmentation, stopping decision |
| Runtime and loader | Code, order, and kernel behavior | Lockfile, driver, workers, loader, environment |

**Security consequence:** A training run is an auditable build, not just a command that produced a file. Store the inputs and decisions needed to answer “which exact process produced this artifact?” before the artifact is released.

<a id="generalization"></a>
## 7. Generalization, regularization, and drift

**Generalization** is performance on conditions not used to fit or repeatedly tune the model. **Overfitting** occurs when a model learns training-specific patterns that do not transfer. **Underfitting** occurs when it has not captured enough useful structure. **Regularization** is a constraint or training choice intended to improve generalization, such as weight decay, dropout, augmentation, label smoothing, or early stopping.

![Generalization, overfitting, underfitting, regularization, and their security implications.](/ai-security-course/assets/chapter-03/08-generalization.png)

Regularization can reduce ordinary overfitting, but it is not a security guarantee. A backdoor can remain hidden because its trigger-to-target association costs almost nothing in clean-set accuracy; standard validation then has little signal to detect it. That is a property of model capacity and evaluation design, not ordinary overfitting. An evasion gap can likewise arise from a deployment/threat-model mismatch, not simply underfitting.

**Distribution shift** is already defined in Module 00 and Chapter 2 as a difference between development and deployment conditions. **Concept drift** is when the relationship between an input and its target changes over time, such as a new malware family using features absent from the training corpus or a changed label policy.

![Drift-monitoring evidence across slices, time windows, campaign families, parsers, and high-cost errors.](/ai-security-course/assets/chapter-03/09-drift-monitoring.png)

**Security consequence:** Monitor slices, time windows, campaign families, parser versions, abstentions, and high-cost errors. A clean validation score can coexist with a new deployment condition, a concealed trigger, or a changed label policy.

| Phenomenon | What changes | Useful evidence |
|---|---|---|
| Ordinary overfitting | Training-specific correlations fail to transfer | Learning curves, held-out slices, and duplicate analysis |
| Backdoor concealment | A trigger-to-target association is absent from clean validation | Trigger tests, activation analysis, dataset lineage, and clean-reference comparison |
| Distribution shift | Inputs or labels differ from development conditions | Feature statistics, time and campaign slices, and drift alerts |

<a id="reproducibility"></a>
## 8. Reproducibility and the nondeterminism problem

**Nondeterminism** means that the same nominal program, data, and configuration can produce different execution results because hidden or implementation-dependent choices are not fixed. A second run can therefore produce a different checkpoint without an attacker changing the source code or dataset.

![Sources of nondeterminism in seeds, kernels, precision, data loading, frameworks, drivers, and hardware.](/ai-security-course/assets/chapter-03/10-reproducibility.png)

Seed handling is a source. A project may seed one library but not the framework, augmentation library, workers, or device generator. Record every seed and its consumer. GPU kernels can complete parallel reductions in different orders; record determinism flags, kernels, device, and workers.

Mixed-precision arithmetic can round intermediate values differently from full precision, especially near a decision boundary. Record precision mode, loss-scaling settings, and accelerator type. Data-loader ordering and parallelism can change the order in which examples reach an optimizer, even when the dataset bytes are identical. Record shuffle policy, worker count, queue behavior, and batch order for a reproducibility fixture.

Framework, driver, compiler, and hardware versions can change kernels or numerical behavior. Record the lockfile, versions, accelerator, operating-system image, container digest, and a known-input fixture with expected ranges.

![Reproducibility evidence required to distinguish ordinary nondeterminism from tampering.](/ai-security-course/assets/chapter-03/11-reproducibility-evidence.png)

| Nondeterminism source | Possible effect | Record-keeping requirement |
|---|---|---|
| Unseeded library or worker | Different augmentation, initialization, or sampling | Every library seed, worker seed policy, and random-state capture |
| GPU kernel or reduction order | Small numerical differences accumulate | Device, kernel determinism setting, operation versions, and hardware |
| Mixed precision | Rounding or loss-scaling changes updates | Precision mode, scaler configuration, and accelerator |
| Loader ordering and parallelism | Different batches produce different update order | Shuffle seed, worker count, queue policy, and batch manifest |
| Framework or driver version | Different kernels or defaults | Lockfile, container digest, framework, compiler, and driver |

**Security consequence:** An investigator who cannot rebuild an artifact cannot distinguish tampering from ordinary nondeterminism. “Bit-identical” is a stronger and rarer claim than “behaviorally equivalent.” State which claim is supported, preserve the build record, and compare a fixed fixture across runs before escalating a difference as a security event.

<a id="attacker-access"></a>
## 9. Attacker access and the threat-model taxonomy

An evasion or extraction result is not meaningful without an access level. **White-box access** means target weights, architecture, gradients, or equivalent internal detail. **Gray-box access** means architecture, feature schema, training assumptions, or score semantics without weights. **Black-box query access** means submitted inputs and returned labels or scores without internals. **Transfer from a surrogate** means another model is used without direct target access.

![The four attacker access levels, their required knowledge, and the budgets needed to make a claim falsifiable.](/ai-security-course/assets/chapter-03/12-attacker-access.png)

*Figure 6 — White-box, gray-box, black-box query, and transfer-from-surrogate access levels with their required knowledge and budgets. [Open infographic ↗](https://1200km.com/ai-security-course/assets/chapter-03/12-attacker-access.png)*

A **perturbation budget** is the permitted change to an input, expressed by a stated norm or a real-world constraint such as preserving a valid file and its function. A **query budget** is the maximum number of probes available to an attacker with query access. These budgets make a robustness claim falsifiable: a result under unlimited, unlogged queries is not equivalent to a result under a rate-limited production identity.

![Perturbation and query budgets required for a falsifiable adversarial robustness claim.](/ai-security-course/assets/chapter-03/13-attack-budgets.png)

| Access level | Attacker knowledge or capability | Evidence to request |
|---|---|---|
| White-box | Weights, gradients, architecture, or equivalent access | Provenance, method, budgets, and reproduction |
| Gray-box | Architecture, features, assumptions, or score semantics | Known and withheld information, tested assumptions |
| Black-box query | Input submission and label or score response | Identity, rate, output detail, count, responses |
| Transfer-from-surrogate | No target access; relies on another model | Surrogate provenance, transfer test, uncertainty |

**Security consequence:** A robustness claim without both budgets and an access level is not a claim. The Cylance/Skylight case is a non-gradient feature-manipulation result; describing it as white-box gradient evasion would erase the relevant attack surface.

<a id="adversarial"></a>
## 10. Adversarial examples and evasion

An **adversarial example** is an input intentionally modified to produce an unwanted result under a specified threat model. Evasion occurs at test time, after training, and a capability demonstration is not automatically an intrusion.

![Adversarial examples and test-time evasion under an explicit threat model.](/ai-security-course/assets/chapter-03/14-adversarial-examples.png)

The research lineage matters. Szegedy et al. (2013) first documented the phenomenon in neural networks. Biggio et al. (2013), working in the security literature, independently demonstrated test-time evasion against malware and PDF classifiers. Goodfellow et al. (2014) provided a linear explanation and the fast-gradient method. Madry et al. (2017) framed robustness as constrained optimization against a first-order adversary. Each contribution answers a different question; none by itself proves that a particular production tenant was affected.

The problem-space and feature-space distinction is especially important for malware. A **feature-space perturbation** changes coordinates consumed by a classifier, while a **problem-space perturbation** changes the real artifact that must remain valid and functional. A semantically trivial file change—such as appended strings, repacking, or added sections—can move a feature vector substantially, but many mathematically convenient feature changes cannot be realized as a functioning file. A real malware attacker must preserve functionality, respect the file format, and work without arbitrary access to feature coordinates.

![A semantically trivial file change producing a large feature-space movement, with realizability constraints.](/ai-security-course/assets/chapter-03/15-problem-vs-feature-space.png)

*Figure 7 — Problem-space versus feature-space changes, including functionality, file-format, and realizability constraints. [Open infographic ↗](https://1200km.com/ai-security-course/assets/chapter-03/15-problem-vs-feature-space.png)*

**Security consequence:** Ask whether the change can be applied to the real artifact while preserving its purpose. Record input hash, transformation, access level, both budgets, artifact digest, and consequence; do not generalize an image-space result to malware without problem-space validation.

<a id="robustness"></a>
## 11. Evaluating robustness claims

![Robustness evaluation requirements: adaptive attacks, access assumptions, budgets, baselines, and bypass conditions.](/ai-security-course/assets/chapter-03/16-robustness-evaluation.png)

An **adaptive attack** is an evaluation that uses knowledge of the proposed defense and chooses an attack strategy intended to test that defense, rather than repeating a fixed weak attack. A defense that merely makes gradients uninformative can appear robust under a weak gradient method and collapse under an adaptive method. Athalye, Carlini, and Wagner called this failure mode obfuscated or masked gradients; Carlini and Wagner provided a practical framework for evaluating adversarial robustness.

Use this checklist for a vendor datasheet, research paper, or internal report:

| Question | Minimum detail | Why it matters |
|---|---|---|
| What access level? | White-box, gray-box, black-box query, or transfer | Results may not transfer |
| What perturbation budget? | Norm, transformation, or real-world constraint | “Small” is not reproducible |
| What query budget? | Maximum probes, rate, and output detail | Cost and telemetry affect feasibility |
| Adaptive attack attempted? | Defense-aware evaluation and masking checks | A weak attack can look robust |
| What attack success rate? | Failure rate under the stated threat model | Averages hide targeted failure |
| Independently reproduced? | Independent party and documented conditions | Self-evaluation is weaker evidence |

Adversarial training includes transformed examples, but is bounded by its threat model, costs clean accuracy or compute, and degrades outside its perturbation budget. Sanitization can remove useful signal or miss encodings; canonicalization fails when semantics change or parsers disagree; ensembling does not guarantee independent errors; and detection can be adapted to or harm availability through false positives.

**Security consequence:** Pair every defense with its bypass condition and monitor the resulting failure mode. None of these defenses converts a probabilistic score into an authorization decision. Deterministic authorization, schema validation, transaction limits, and human approval remain policy responsibilities outside the model.

> **Evidence standard:** Use one five-term ladder throughout this chapter: **Observed** — a production event or provider report. **Reproduced** — the same failure under documented local conditions. **Demonstrated** — a research proof-of-concept on a stated model, not necessarily yours. **Inferred** — a hypothesis linking observations. **Unknown** — an explicitly recorded gap.

<a id="poisoning"></a>
## 12. Poisoning and backdoors

**Poisoning** changes training data or the training process so a learned artifact behaves incorrectly. A **backdoor** is a hidden trigger-to-target association that causes a selected behavior while ordinary inputs appear acceptable. A **trigger** is the condition that activates the backdoor, such as a pattern, token, or artifact property. The attacker can target collection, labels, augmentation, a dependency, a checkpoint, or a loader.

![Poisoning and backdoor attack surfaces across datasets, labels, dependencies, checkpoints, and loaders.](/ai-security-course/assets/chapter-03/17-poisoning-backdoors.png)

Backdoor detection needs explicit methods and assumptions. **Trigger reconstruction** searches for a compact input pattern that causes a target output; it assumes the trigger is sufficiently simple and that the search objective exposes it, so distributed or semantic triggers can be missed. **Activation clustering** groups internal activations to find a suspicious cluster associated with poisoned examples; it assumes poisoned and clean representations separate enough to cluster, so weak or entangled triggers can evade it. **Fine-pruning** removes neurons that appear dormant on clean data and then evaluates behavior; it assumes backdoor functionality depends on removable dormant capacity, so triggers using ordinary shared features can survive and pruning can damage legitimate behavior. BadNets is the canonical reference for the backdoor threat model.

The VirusTotal Poisoning case, listed by MITRE ATLAS as AML.CS0002 and reported by McAfee Advanced Threat Research, is a short parallel: adversarial samples were submitted to a shared detection service. Use only that disclosed fact; service, provenance, and downstream effect require the case record and local telemetry.

When investigating a suspected poisoning event, preserve the original dataset and manifest, compare lineage with the approved version, record label history, test for unusual clusters or trigger correlations, and rerun with a clean reference. Do not overwrite the only copy by “cleaning” it in place. Preserve the suspect bytes, access history, and chain of custody before making a derivative dataset.

**Security consequence:** A clean validation score or model digest does not prove a clean build. Preserve dataset versions, label events, features, activations, checkpoint lineage, loader behavior, and release identity.

<a id="inference-training"></a>
## 13. What inference reveals about training

Inference can reveal information about training even when the attacker cannot read the artifact. A **model extraction attack**, also called model stealing, uses target-service outputs to build an approximation of its decision function. It needs query access; confidence scores or logits help more than labels alone; and the query budget affects cost and detectability. Ask who queried, at what rate, from which identity, with what output granularity, and whether responses and model-route identifiers were observable.

![Model extraction, membership inference, and model inversion through inference interfaces.](/ai-security-course/assets/chapter-03/18-inference-attacks.png)

**Security consequence:** Record caller, tenant, source, request count, timing, output fields, model version, and rate-limit decisions. Coarse outputs and quotas reduce exposure but do not eliminate surrogate transfer.

**Membership inference** tests whether a particular record was part of training. It needs query access and an output signal, such as confidence or logits, that differs between familiar and unfamiliar examples; query budget and prior knowledge influence the result. Ask which identity tested which candidates, with what output granularity, and whether telemetry captured repeated probes or sensitive slices.

**Security consequence:** Preserve query fixtures, candidate hashes, response detail, rate, tenant, and data-use authorization. Reduce unnecessary confidence exposure and test privacy on the deployment distribution.

**Model inversion** attempts to infer sensitive features or representative inputs from outputs, gradients, or other observations. It needs an output interface and, for stronger variants, knowledge about classes, features, or internals. Query budget and output granularity affect what can be inferred. Ask who requested which classes or slices, how many probes were made, what scores or gradients were returned, and whether route and policy were logged.

**Security consequence:** Treat outputs, embeddings, gradients, and explanations as information-bearing. Minimize granularity, authorize by tenant and purpose, rate-limit probing, and retain keyed telemetry. Map these controls to Section 15.

These mechanisms identify what could be tested; they do not prove that training data was exposed. Keep the claim at the level supported by telemetry.

<a id="cti-case"></a>
## 14. CTI case study: evading a malware classifier

MITRE ATLAS case study AML.CS0003, **Bypassing Cylance's AI Malware Detection**, documents work by Skylight Cyber researchers Adi Ashkenazy and Shahar Zini, published in July 2019. This is a disclosed research case, not evidence that every Cylance customer was compromised.

### What the researchers did

The researchers analyzed the CylancePROTECT engine and model using publicly available information and verbose logging. They reverse-engineered which attributes carried positive or negative weight, found that feature extraction relied heavily on strings, and reported a strong bias toward one specific video game. They also discovered a secondary model that could override the primary decision. By appending a selected list of strings to a malicious file, they changed its score enough to avoid detection. The report described the result as effective against 100% of the top ten malware samples of May 2019 and close to 90% of a 384-sample set.

**Security consequence:** The exploitable surface described by the researchers was feature extraction plus a scoring-policy override. The attacker did not need to touch weights or gradients. The relevant local evidence would therefore include the original and modified file hashes, parser output, extracted strings, score, model route, policy decision, and release version.

![The AML.CS0003 evidence chain: research claim, vendor dispute, remediation, and evidence-ladder classification.](/ai-security-course/assets/chapter-03/19-cylance-case.png)

*Figure 8 — AML.CS0003 evidence chain: research claim, vendor dispute, remediation, and where each claim sits on the evidence ladder. [Open infographic ↗](https://1200km.com/ai-security-course/assets/chapter-03/19-cylance-case.png)*

### Why gradients were never needed

The case is not a white-box gradient example. The reported method used public information, verbose logging, feature observations, and score behavior. The change was applied to the problem-space file and evaluated through the released detector. An analyst can therefore test a feature-extraction and policy path without possessing weights or gradients.

### The vendor's dispute and remediation

Cylance/BlackBerry disputed the “universal bypass” characterization, describing manipulation of one feature type that in limited circumstances led to an incorrect conclusion. The vendor reported parser anti-tampering controls, model changes to detect disproportionately weighted features, and removal of the implicated features.

**Security consequence:** The disagreement is useful CTI context but does not resolve every environment. Identify engine version, parser, features, route, and remediation state in scope.

### What each party would need to prove

The researchers' claim requires samples, transformation, feature output, score change, sample-set definition, engine version, and reproducible conditions. The vendor's characterization requires feature scope, affected versions, result limits, and remediation evidence. Customer impact additionally requires deployment identity, version, telemetry, sample handling, and action.

### Evidence ladder for this case

Use the same five terms: **Observed** — a production event or provider report. **Reproduced** — the same failure under documented local conditions. **Demonstrated** — a research proof-of-concept on a stated model, not necessarily yours. **Inferred** — a hypothesis linking observations. **Unknown** — an explicitly recorded gap.

- **Observed:** the Skylight publication and the vendor's public response are provider or researcher reports.
- **Reproduced:** a local rerun against the same engine version and documented conditions would support this level.
- **Demonstrated:** the published research result is a proof-of-concept on the stated Cylance engine and sample sets, not automatically on every deployment.
- **Inferred:** a hypothesis that the same feature or policy path explains a missed local sample.
- **Unknown:** whether a particular tenant used an affected version, received the remediation, or experienced a related event without local artifacts and telemetry.

Do not collapse the dispute into either “the bypass worked everywhere” or “there was no issue.” State the claim, evidence level, access level, budgets, version, and unknowns.

Several competing hypotheses can explain a missed malware sample:

1. The sample is outside the development distribution.
2. The parser or feature extractor changed.
3. The threshold, secondary model, or route changed.
4. The sample was modified for evasion in problem space.
5. A label, split, or training artifact was corrupted.

```text
research claim and sample provenance
  → original file and transformed file
  → parser and feature output
  → primary and secondary model route
  → score and threshold policy
  → quarantine, delivery, or analyst review
  → local telemetry and remediation state
```

The CTI publication guides the hypothesis; it does not replace local evidence. Preserve original and derivative samples, hashes, parser output, engine and model identifiers, configuration, request identity, action, and remediation status. This distinguishes an observed local event from an inferred similarity to a public demonstration.

<a id="controls"></a>
## 15. Controls, ATLAS mapping, and analyst exercise

![Control points connecting AI security objects, owners, evidence, and deterministic policy.](/ai-security-course/assets/chapter-03/20-controls-atlas.png)

The terminology becomes operational when each object has an owner, a control point, and a record an analyst can collect. MITRE ATLAS supplies vocabulary and mapping; a defensible case still requires local artifacts, configuration, and telemetry. Because ATLAS has been renaming “ML” to “AI” in technique titles, use the ID as the stable identifier and verify the current title before publication.

![MITRE ATLAS mappings for evasion, poisoning, backdoors, extraction, and inference risks.](/ai-security-course/assets/chapter-03/21-atlas-mapping.png)

| ATLAS ID and title | Chapter connection | Local evidence to preserve |
|---|---|---|
| AML.T0043 — Craft Adversarial Data [VERIFY current title] | Sections 10 and 14: feature manipulation | Bytes, features, access, budget |
| AML.T0015 — Evade ML/AI Model [VERIFY current title] | Sections 9, 10, and 14: evasion | Version, constraint, queries, action |
| AML.T0018 — Backdoor ML Model [VERIFY current title] | Section 12: trigger behavior | Lineage, trigger tests, activations |
| AML.T0020 — Poison Training Data [VERIFY current title] | Section 12: altered data | Manifest, labels, source, rerun |
| AML.T0024 — Exfiltration via ML/AI Inference API [VERIFY current title] | Section 13: response data | Caller, tenant, output, rate |
| AML.T0040 — ML/AI Model Inference API Access [VERIFY current title] | Sections 9 and 13: query access | Authentication, route, count |
| AML.T0044 — Full ML Model Access [VERIFY current title] | Sections 2, 8, and 9: artifact access | Registry, identity, digest |
| AML.CS0003 — Bypassing Cylance's AI Malware Detection [VERIFY current title] | Section 14: feature and policy case | Report, version, parser, remediation |

### Control checklist

![Chapter 3 control checklist for training provenance, release integrity, inference telemetry, and robustness evaluation.](/ai-security-course/assets/chapter-03/22-control-checklist.png)

| Security question | Control focus | Evidence |
|---|---|---|
| What was trained? | Provenance, immutable manifests, labels | Hashes, labels, exclusions, versions |
| How was it trained? | Isolated, reproducible build | Commit, lockfile, seeds, loader, logs |
| What was released? | Signed artifact, loader isolation, approval | Digest, architecture, SBOM, route |
| What happened at inference? | Validation, authorization, bounded effects | Caller, tenant, input, score, action |
| What could output reveal? | Minimized detail, quotas, privacy | Fields, rate, identity, egress |

### Analyst exercise

Choose a local classifier or course-owned demonstration. Do not upload confidential data or test without authorization. Draw its graph and record one parameter, hyperparameter, feature step, threshold, and inference event.

1. Record the input and preprocessing output.
2. Record artifact, architecture, dependency, and configuration digests.
3. Compare logits or scores before and after the suspected change.
4. State which single observable would distinguish evasion from distribution shift, a parser or feature-extraction change, a threshold change, or a swapped artifact.
5. Record the access level, perturbation budget, and query budget for any robustness or evasion result.
6. Separate **Observed** — a production event or provider report; **Reproduced** — the same failure under documented local conditions; **Demonstrated** — a research proof-of-concept on a stated model, not necessarily yours; **Inferred** — a hypothesis linking observations; and **Unknown** — an explicitly recorded gap.
7. Propose one deterministic control and one monitoring signal, and document the bypass condition or residual unknown.

You have completed this chapter when, for a misclassification, you can name an observable distinguishing evasion, distribution shift, parser or feature change, threshold change, and swapped artifact; state the access level and both budgets; apply the five-term ladder; and identify control and telemetry needed to test it.

<a id="key-takeaways"></a>
## 16. Key takeaways

- A neural network is a parameterized computation, not an isolated AI system. The parser, features, configuration, dependencies, runtime, policy, and downstream action also matter.
- A forward pass produces outputs; loss, gradients, and optimizer updates belong to training. Preserve those boundaries in the evidence graph.
- Learning rate, seed, data order, preprocessing, dependencies, and hardware can change behavior as decisively as weights.
- A robustness claim is falsifiable only when it states the access level, perturbation budget, and query budget.
- Problem-space malware changes must preserve functionality and file validity; feature-space coordinates are not automatically realizable artifacts.
- Adversarial training, sanitization, canonicalization, ensembles, and detection all have bypass conditions. None turns a probabilistic score into authorization.
- Backdoor and poisoning investigations require named methods, immutable evidence, and preservation of the suspect dataset.
- Model extraction, membership inference, and model inversion make inference telemetry a CTI and privacy control point.
- Research demonstrations establish capability; use the five-term evidence ladder consistently and record unknowns rather than filling them with assumptions.

<a id="references"></a>
## 17. References

- [Rumelhart, Hinton, and Williams — Learning representations by back-propagating errors](https://doi.org/10.1038/323533a0)
- [Goodfellow, Shlens, and Szegedy — Explaining and Harnessing Adversarial Examples](https://arxiv.org/abs/1412.6572)
- [Madry et al. — Towards Deep Learning Models Resistant to Adversarial Attacks](https://arxiv.org/abs/1706.06083)
- [Kingma and Ba — Adam: A Method for Stochastic Optimization](https://arxiv.org/abs/1412.6980)
- [NIST AI 100-2 E2025 — Adversarial Machine Learning: A Taxonomy and Terminology of Attacks and Mitigations](https://csrc.nist.gov/pubs/ai/100/2/e2025/final)
- [MITRE ATLAS — Adversarial Threat Landscape for Artificial-Intelligence Systems](https://atlas.mitre.org/)
- [Google Machine Learning Crash Course — Neural networks](https://developers.google.com/machine-learning/crash-course/neural-networks)
- [Szegedy et al. — Intriguing Properties of Neural Networks](https://arxiv.org/abs/1312.6199)
- [Biggio et al. — Evasion Attacks against Machine Learning at Test Time](https://arxiv.org/abs/1708.06131)
- [Carlini and Wagner — On Evaluating Adversarial Robustness](https://arxiv.org/abs/1902.06705)
- [Athalye, Carlini, and Wagner — Obfuscated Gradients Give a False Sense of Security](https://arxiv.org/abs/1802.00420)
- [Gu, Dolan-Gavitt, and Garg — BadNets](https://arxiv.org/abs/1708.06733)
- [Pierazzi et al. — Intriguing Properties of Adversarial ML Attacks in the Problem Space](https://arxiv.org/abs/1911.02142)
- [Tramèr et al. — Stealing Machine Learning Models via Prediction APIs](https://arxiv.org/abs/1609.02943)
- [Shokri et al. — Membership Inference Attacks Against Machine Learning Models](https://arxiv.org/abs/1610.05820)
- [Carlini et al. — Poisoning Web-Scale Training Datasets Is Practical](https://arxiv.org/abs/2302.10149)
- [Liu, Dolan-Gavitt, and Garg — Fine-Pruning](https://arxiv.org/abs/1805.12185)
- [Chen et al. — Detecting Backdoor Attacks through Activation Clustering](https://arxiv.org/abs/1811.03728)
- Wang et al. — Neural Cleanse (IEEE S&P 2019) [VERIFY: canonical URL]
- MITRE ATLAS case study AML.CS0003 — Bypassing Cylance's AI Malware Detection [VERIFY: supplied study URL returned 404; canonical URL needed]
- MITRE ATLAS case study AML.CS0002 — VirusTotal Poisoning [VERIFY: supplied study URL returned 404; canonical URL needed]
- [Skylight Cyber — Cylance, I Kill You!](https://skylightcyber.com/2019/07/18/cylance-i-kill-you/)

<a id="next"></a>
## 18. What comes next

[Chapter 4: Transformers and LLM Generation](https://1200km.com/ai-security-course/module-00/chapter-04.html) connects this mechanism to tokenization, embeddings, attention, generation controls, prompt injection, context leakage, and the evidence required for defensible analysis.

---

**AI Security Engineering Course — under construction.** The syllabus, examples, references, labs, and assessment criteria may change during creation.

[1200km.com](https://1200km.com) · [Main course article on Medium](https://medium.com/@1200km/im-building-an-ai-security-engineering-course-55e29e6c035e) · [Back to top ↑](#top)

<!-- GLOSSARY DELTA -->

- **Tensor:** A typed, shaped array of numbers used as a model input or intermediate value.
- **Activation:** The value produced by a layer for a particular input.
- **Logit:** An unnormalized model output score before a probability transformation.
- **Forward pass:** Applying an architecture and its parameters to an input to produce activations and an output.
- **Loss function:** A function that converts a prediction and target into a value used to guide training.
- **Backpropagation:** Computing gradients by sending the loss signal backward through the computation graph.
- **Optimizer:** An update rule that uses gradients to change learned parameters.
- **Learning rate:** The scale applied to an optimizer's parameter update.
- **Adversarial example:** An intentionally modified input that causes an unwanted model result under a stated threat model.
- **Perturbation budget:** The permitted input change expressed by a norm or real-world constraint.
- **Query budget:** The maximum number of probes available to an attacker with query access.
- **Adaptive attack:** A defense-aware evaluation that selects an attack strategy to test the proposed defense.
- **Backdoor:** A hidden trigger-to-target association that causes selected behavior while ordinary inputs appear acceptable.
- **Trigger:** The condition that activates a backdoor.
- **Model extraction:** Using target-service outputs to build an approximation of the target decision function.
- **Membership inference:** Testing whether a particular record was part of a model's training data.
- **Model inversion:** Inferring sensitive features or representative inputs from model outputs or other observations.
- **Nondeterminism:** The condition in which the same nominal program, data, and configuration can produce different results because hidden or implementation-dependent choices are not fixed.
