---
title: "AI Security Course, Module 00 — Chapter 4: Transformers and LLM Generation"
description: "A security-focused foundation for tokenization, chat templates, embeddings, attention, Transformer blocks, next-token generation, decoding, context limits, prompt injection, evidence, controls, and reproducible LLM evaluation."
module: "00"
chapter: "4"
status: "Published"
canonical: "https://1200km.com/ai-security-course/module-00/chapter-04.html"
medium: "https://medium.com/@1200km/ai-security-course-module-00-chapter-4-b8e3de0c3a9d"
published: "2026-08-15"
author: "Andrey Pautov"
---

<a id="top"></a>
[AI Security Engineering](https://1200km.com/ai-security-course.html) / [Module 00](https://1200km.com/ai-security-course/module-00.html) / Chapter 4

**Module 00** · **Chapter 4** · **Published** · **CTI evidence base**

Navigation: [Module 00](https://1200km.com/ai-security-course/module-00.html) · [Chapter 3](https://1200km.com/ai-security-course/module-00/chapter-03.html) · [Course syllabus](https://1200km.com/ai-security-course.html) · [Terminology dictionary](https://1200km.com/ai-security-course/glossary.html)

Medium companion: [Read the original publication](https://medium.com/@1200km/ai-security-course-module-00-chapter-4-b8e3de0c3a9d).

# AI Security Course, Module 00 — Chapter 4: Transformers and LLM Generation

**Trace an LLM request from structured messages to generated output, then place authorization, validation, and forensic evidence at the boundaries that actually enforce security.**

This chapter explains how an application turns messages into tokens, how a Transformer produces next-token scores, how decoding turns those scores into text, and where security controls and evidence must exist around the model.

It is written for security engineers, CTI analysts, detection engineers, incident responders, and technical leaders who need to investigate an LLM-enabled application without treating fluent output as proof. The objective is a repeatable request trace: identify each artifact and trust boundary, reproduce behavior under controlled conditions, and distinguish generated text from an authorized or executed action.

> **Scope and safety:** Use only course-owned systems or environments you are authorized to test. The practical uses harmless marker strings and does not require production data, reusable credentials, destructive tool calls, or attempts to extract another user's information. If a provider processes the test remotely, follow its data-handling rules and do not send confidential evidence.

> **Chapter status: Published.** This learner-ready chapter was published on 15 August 2026. The Medium article is the original companion publication; this page is the canonical course version with locally preserved visuals, cross-links, a bounded practical, a completion rubric, primary references, and an evidence-first security workflow.

![AI Security Course Module 00 Chapter 4 cover: Transformers and LLM Generation](/ai-security-course/assets/chapter-04/00-cover.png)

<!-- Open Graph image candidate: https://1200km.com/ai-security-course/assets/chapter-04/00-cover.png -->

*Chapter 4 cover — Transformers and LLM Generation. [Open infographic ↗](https://1200km.com/ai-security-course/assets/chapter-04/00-cover.png)*

Video companion: [Watch Chapter 4 — Transformers and LLM Generation on YouTube](https://www.youtube.com/watch?v=B0lSWuG2UUQ).

## Learning outcomes

After completing this chapter, you should be able to:

- trace one request from application messages to a generated response;
- distinguish tokenizer, vocabulary, chat template, model artifact, context, logits, decoding policy, and application policy;
- explain attention conceptually without treating it as explanation, authorization, or factual verification;
- identify security-relevant truncation, role-boundary, serialization, generation, and logging failures;
- state a prompt-injection or extraction claim with an explicit threat model and evidence level; and
- design a reproducible LLM test record that separates model behavior from application behavior.

## Table of contents

1. [1. Why the generation mechanism matters to security](#mechanism)
2. [2. The complete LLM request path](#request-path)
3. [3. Tokenization and the model interface](#tokenization)
4. [4. Chat templates and instruction serialization](#chat-templates)
5. [5. Embeddings and positional information](#embeddings)
6. [6. Self-attention: learned information flow](#attention)
7. [7. The Transformer block](#transformer-block)
8. [8. Causal language modeling and next-token prediction](#next-token)
9. [9. Context windows, truncation, and KV cache](#context)
10. [10. Decoding and generation controls](#decoding)
11. [11. Determinism, reproducibility, and evidence](#reproducibility)
12. [12. Structured output is not authorization](#structured-output)
13. [13. Prompt injection and instruction conflicts](#prompt-injection)
14. [14. Extraction, leakage, and sensitive context](#extraction)
15. [15. CTI case study: indirect prompt injection](#cti-case)
16. [16. Controls, ATLAS mapping, and analyst exercise](#controls)
17. [17. Limitations and scope boundaries](#limitations)
18. [18. Key takeaways](#key-takeaways)
19. [19. What comes next](#next)
20. [20. Conclusion](#conclusion)
21. [21. References](#references)
22. [22. Follow My Work](#follow-my-work)

<a id="mechanism"></a>
## 1. Why the generation mechanism matters to security

An LLM does not receive a conversation as separate colored chat bubbles. The application serializes messages, retrieved text, tool descriptions, memory, and control markers into a model-specific sequence. A tokenizer converts that sequence into token IDs. The model produces scores for possible next tokens, and a decoding procedure chooses what to append. The process repeats until a stop condition is reached.

![Security view of the LLM generation path from application context and model processing to downstream controls and evidence](/ai-security-course/assets/chapter-04/01-generation-mechanism.png)

*Why generation mechanics matter — the request path, security-relevant changes, evidence to preserve, and the course rule that keeps authorization outside generation. [Open infographic ↗](https://1200km.com/ai-security-course/assets/chapter-04/01-generation-mechanism.png)*

```text
identity + messages + application state
  → authorization and context assembly
  → model-specific chat template
  → tokenizer and special tokens
  → token IDs and positions
  → repeated Transformer blocks
  → next-token logits
  → decoding policy selects a token
  → append token and repeat
  → parser, policy, tools, and downstream action
```

*Figure 1 — The complete LLM request path. This text-native diagram is deliberately kept as selectable, searchable evidence: it places identity and authorization before generation and policy, execution, and audit after generation.*

Every arrow is a potential source of changed behavior. A response can change because the application selected different context, an untrusted document entered the prompt, the tokenizer or template changed, earlier instructions were truncated, a model route changed, the decoding configuration changed, or a downstream parser interpreted output differently.

**Security consequence:** “The model ignored the system prompt” is not yet an incident description. Preserve the serialized prompt or an approved privacy-safe representation, token counts, truncation decisions, model and tokenizer identifiers, decoding configuration, output, parser result, policy decision, and any action taken.

> **Course rule:** The model generates candidate content. The application authenticates identities, authorizes access, validates data, enforces policy, approves actions, and records evidence.

<a id="request-path"></a>
## 2. The complete LLM request path

Treat the LLM as one component in a larger system. The security boundary begins before tokenization and continues after generation.

![Complete LLM request path showing controls before the model, model and generation artifacts, and evidence after generation](/ai-security-course/assets/chapter-04/02-complete-request-path.png)

*The complete LLM request path — authenticated state and context assembly before generation, model-specific artifacts during generation, and validation, policy, action, and audit afterward. [Open infographic ↗](https://1200km.com/ai-security-course/assets/chapter-04/02-complete-request-path.png)*

| Object | What it is | Security question |
|---|---|---|
| Initiating identity | User, service, workload, or agent starting the request | Which tenant, role, and authority apply? |
| Message object | Structured role and content supplied by the application | Who created each field, and is it trusted? |
| Context source | Retrieved document, memory, tool result, or policy text | Was access checked before inclusion? |
| Chat template | Serialization rules and special control tokens | Which version produced the actual sequence? |
| Tokenizer | Algorithm and vocabulary mapping text or bytes to IDs | Which artifact, normalization, and special tokens were used? |
| Model artifact | Architecture, parameters, and configuration | Which digest and serving route handled the request? |
| Generation configuration | Temperature, sampling, length, stop, and penalties | Was it explicit, bounded, and logged? |
| Output parser | Code converting text into data or a proposed action | Does it fail closed and validate against a schema? |
| Policy decision | Deterministic allow, deny, transform, or approval rule | Is it independent of persuasive model text? |
| Side effect | Tool call, message, file change, purchase, or access change | Was exact authority checked at execution time? |

![Reference table of LLM request-path objects and the security question associated with each object](/ai-security-course/assets/chapter-04/03-request-path-objects.png)

*Request-path object inventory — identities, messages, context, templates, tokenizers, model artifacts, generation settings, parsers, policy decisions, and side effects each require a distinct security question. [Open infographic ↗](https://1200km.com/ai-security-course/assets/chapter-04/03-request-path-objects.png)*

The same base model can behave differently behind two products because their templates, context assembly, tools, safety layers, decoding, and policies differ. Evaluate the deployed system, not only a model name.

<a id="tokenization"></a>
## 3. Tokenization and the model interface

A **tokenizer** maps text or bytes into token IDs from a versioned vocabulary. Tokens may represent a word, word fragment, punctuation mark, byte sequence, whitespace pattern, or special control marker. Tokenization is reversible only within the tokenizer's defined behavior; it is not a semantic security parser.

![Tokenization pipeline from raw input through normalization, segmentation, special-token processing, and token IDs](/ai-security-course/assets/chapter-04/04-tokenization.png)

*Tokenization and the model interface — a versioned pipeline whose vocabulary, normalization, special tokens, and truncation behavior form part of the security-relevant release artifact. [Open infographic ↗](https://1200km.com/ai-security-course/assets/chapter-04/04-tokenization.png)*

```text
raw input
  → Unicode or byte handling
  → normalization and pre-tokenization
  → vocabulary segmentation
  → special-token processing
  → token IDs
```

Token boundaries affect length, cost, truncation, multilingual behavior, detection rules, and stop matching. Two visually similar strings may become different token sequences. One token ID can also be interpreted differently if the vocabulary or tokenizer artifact changes.

**Security consequence:** Version and hash the tokenizer with the model release. Test security controls against token IDs as well as rendered text when token boundaries matter. Never assume a character limit equals a token limit.

### Special tokens

Special tokens can mark beginning, end, padding, roles, tool calls, or document boundaries. Whether user text can contain or imitate these markers depends on the tokenizer and template implementation.

**Security consequence:** Treat reserved control markers as protocol data. Escape, encode, or reject ambiguous input at the serialization boundary. Test duplicate beginning/end markers, embedded role markers, malformed Unicode, and byte-level variants.

### Minimal tokenizer evidence

For a reproduced request, retain:

- tokenizer repository or package and immutable revision;
- relevant file digests and vocabulary size;
- special-token map and added tokens;
- normalization and truncation settings;
- the final token count and, where permissible, token IDs; and
- a privacy-aware digest or encrypted capture of the serialized input.

<a id="chat-templates"></a>
## 4. Chat templates and instruction serialization

Chat applications usually represent a conversation as structured messages, but a text model consumes a token sequence. A **chat template** converts roles and content into the format used during model training or instruction tuning.

![Chat-template serialization of structured system and user messages into model-specific control tokens and content](/ai-security-course/assets/chapter-04/05-chat-templates.png)

*Chat templates and instruction serialization — structured messages become a model-specific sequence, making the template executable, versioned configuration rather than invisible formatting. [Open infographic ↗](https://1200km.com/ai-security-course/assets/chapter-04/05-chat-templates.png)*

```text
messages = [
  {role: "system", content: system_policy},
  {role: "user", content: user_request}
]

template(messages)
  → control tokens + role labels + content + generation marker
  → tokenizer
```

Different models trained from similar base checkpoints may require different formats. A missing assistant-generation marker, duplicated special token, changed role name, or template mismatch can reduce performance or change instruction-following behavior.

**Security consequence:** A chat template is executable configuration and part of the release artifact. Review it like code. Record its digest, test untrusted content at every interpolation point, and compare the actual serialized sequence during incident response.

### Role labels are not access-control boundaries

The labels `system`, `developer`, `user`, `assistant`, `tool`, or similar names express intended instruction structure to a model. They do not authenticate the speaker and do not enforce tenant or tool permissions.

**Security consequence:** The application must construct roles from authenticated state. Never accept a client-supplied role as proof of authority. A system message can influence model behavior, but it cannot authorize a database read or a payment.

<a id="embeddings"></a>
## 5. Embeddings and positional information

Each token ID is mapped to a learned vector called a **token embedding**. The model also needs position information because token embeddings alone do not describe order. Transformer implementations may use learned positional embeddings, fixed encodings, rotary position embeddings, or other mechanisms.

![Token IDs mapped to learned embeddings and combined with positional information before Transformer processing](/ai-security-course/assets/chapter-04/06-embeddings.png)

*Embeddings and positional information — numerical representations retain the sensitivity of their source data and must remain within appropriate access, retention, and tenant-isolation controls. [Open infographic ↗](https://1200km.com/ai-security-course/assets/chapter-04/06-embeddings.png)*

```text
token ID at position i
  → token representation
  + or combined with position information
  → contextual processing through Transformer layers
```

An embedding is a numerical representation, not a safe or anonymous form of the original content. Intermediate activations, cached representations, and embedding services can remain sensitive.

**Security consequence:** Apply classification, retention, tenant isolation, and access control to embeddings and caches according to the source data and demonstrated leakage risk. Do not downgrade data merely because it is represented numerically.

<a id="attention"></a>
## 6. Self-attention: learned information flow

For each position, an attention head derives a **query**, **key**, and **value** representation. Query–key similarity produces weights, and those weights combine value information. A common conceptual form is:

![Self-attention flow using query, key, and value projections with causal masking and multi-head processing](/ai-security-course/assets/chapter-04/07-self-attention.png)

*Self-attention as learned information flow — useful for modeling relationships inside a sequence, but not evidence of permission, provenance, confidence, or a causal explanation. [Open infographic ↗](https://1200km.com/ai-security-course/assets/chapter-04/07-self-attention.png)*

```text
Attention(Q, K, V) = softmax(QKᵀ / √d_k) V
```

In **self-attention**, queries, keys, and values are derived from positions in the same sequence. **Multi-head attention** performs several learned projections in parallel, allowing different patterns of information flow. A causal mask prevents a decoder-only language model from using future tokens when predicting the next token.

Attention weights are not permissions, citations, confidence scores, or guaranteed explanations. High weight does not prove that a source authorized an action or that a generated claim is true.

**Security consequence:** Do not build an authorization or forensic conclusion from an attention visualization alone. Use source provenance, controlled experiments, request traces, and deterministic application logs.

<a id="transformer-block"></a>
## 7. The Transformer block

A modern Transformer block commonly combines attention, a position-wise feed-forward network, residual connections, and normalization. Exact ordering and components vary by architecture.

![Transformer block with normalization, masked multi-head attention, residual paths, and feed-forward transformation](/ai-security-course/assets/chapter-04/08-transformer-block.png)

*The Transformer block — an architectural family built from attention, feed-forward transformations, normalization, and residual paths whose exact configuration belongs in the preserved release evidence. [Open infographic ↗](https://1200km.com/ai-security-course/assets/chapter-04/08-transformer-block.png)*

```text
input representations
  → normalization
  → masked multi-head self-attention
  → residual connection
  → normalization
  → feed-forward transformation
  → residual connection
  → next block
```

The original Transformer used encoder and decoder stacks. Many generative LLMs use a decoder-only, causally masked design; other models use encoder-only or encoder–decoder architectures. “Transformer” therefore names an architectural family, not one fixed implementation.

**Security consequence:** Preserve the architecture and configuration with the weight artifact. Context length, attention implementation, precision, quantization, parallelism, and runtime kernels can affect behavior and reproducibility.

<a id="next-token"></a>
## 8. Causal language modeling and next-token prediction

A decoder-only language model estimates a distribution over the next token given previous tokens. Its output layer produces **logits**—unnormalized scores over the vocabulary. A softmax transformation can convert them into a probability distribution, after which the generation procedure selects a token.

![Autoregressive next-token generation from prior tokens through logits, token selection, append, and repeat](/ai-security-course/assets/chapter-04/09-next-token-generation.png)

*Causal language modeling — coherent text emerges from repeated next-token prediction, not from an independent verification of facts, authority, or organizational policy. [Open infographic ↗](https://1200km.com/ai-security-course/assets/chapter-04/09-next-token-generation.png)*

```text
P(token_t | token_1 ... token_t-1)
```

The selected token is appended and the model runs again. Coherent paragraphs emerge through repeated conditional prediction; the mechanism does not independently retrieve current facts, verify claims, remember a user's legal authority, or understand organizational policy.

### Why fluent output is not verified output

Training rewards prediction of patterns in data. Instruction tuning and preference optimization can make responses more useful, but fluency remains distinct from evidence. A plausible citation, hostname, vulnerability ID, command, or policy statement may be unsupported.

**Security consequence:** Require authoritative retrieval or deterministic verification for claims that drive security decisions. Log the source and validation result separately from generated prose.

<a id="context"></a>
## 9. Context windows, truncation, and KV cache

The **context window** is the bounded token sequence available to a generation request. It may contain instructions, history, retrieved content, tool schemas, tool results, memory, and output generated so far. Product limits can be lower than the underlying model limit.

![Context-window composition, truncation decisions, and security isolation requirements for the KV cache](/ai-security-course/assets/chapter-04/10-context-window-kv-cache.png)

*Context windows, truncation, and KV cache — observable selection rules and isolation attributes are necessary because silent removal and cross-request state reuse can change both behavior and exposure. [Open infographic ↗](https://1200km.com/ai-security-course/assets/chapter-04/10-context-window-kv-cache.png)*

When input plus requested output exceeds a limit, an application may reject the request, truncate content, summarize history, remove earlier messages, or select fewer documents. Each policy changes the effective security context.

**Security consequence:** Make truncation deterministic and observable. Protect high-priority policy from silent removal, but do not mistake retained policy text for enforcement. Record tokens included and excluded by source class.

### KV cache

Autoregressive serving often caches attention keys and values for prior positions so each new token does not recompute the full prefix. Cache reuse improves latency but creates sensitive runtime state.

**Security consequence:** Isolate cache entries by request, identity, tenant, model, adapter, and relevant configuration. Define eviction and zeroization behavior. Treat cross-request cache reuse as a security-sensitive optimization requiring evidence.

<a id="decoding"></a>
## 10. Decoding and generation controls

Decoding converts logits into a token choice. The model artifact does not uniquely determine the response.

![Decoding pipeline from logits through penalties, temperature, top-k or top-p filtering, selection, and stopping rules](/ai-security-course/assets/chapter-04/11-decoding-controls.png)

*Decoding and generation controls — version temperature, sampling, length, repetition, and stop behavior as release configuration, then enforce independent workflow budgets around the model. [Open infographic ↗](https://1200km.com/ai-security-course/assets/chapter-04/11-decoding-controls.png)*

| Control | Mechanism | Security limitation |
|---|---|---|
| Greedy decoding | Select the highest-scoring token | Can still vary across runtimes and does not ensure correctness |
| Temperature | Rescale logits before sampling | Lower values reduce randomness but do not create authorization or truth |
| Top-k | Restrict choices to the k highest-scoring tokens | Can remove a low-ranked correct token |
| Top-p | Use the smallest set reaching cumulative probability p | Candidate set changes at each step |
| Maximum new tokens | Bound response-token count | Does not bound retries, tool loops, or total workflow cost |
| Stop sequence | Stop when configured token patterns appear | Tokenization and streaming boundaries can affect matching |
| Repetition penalty | Change scores based on prior tokens | Can distort structured or security-sensitive output |

![Comparison table for greedy decoding, temperature, top-k, top-p, maximum tokens, stop sequences, and repetition penalties](/ai-security-course/assets/chapter-04/12-decoding-strategies.png)

*Generation-strategy comparison — each control changes token selection or termination but none establishes truth, semantic safety, or authority. [Open infographic ↗](https://1200km.com/ai-security-course/assets/chapter-04/12-decoding-strategies.png)*

```text
logits
  → processors and penalties
  → temperature
  → top-k / top-p filtering
  → sample or select
  → stop and length rules
```

**Security consequence:** Treat decoding as versioned release configuration. Apply independent workflow budgets for time, cost, tokens, retries, tool calls, and side effects.

<a id="reproducibility"></a>
## 11. Determinism, reproducibility, and evidence

The same visible prompt can yield a different output because of hidden context, template changes, tokenization, model routing, floating-point behavior, batching, hardware, kernels, sampling, seed handling, or provider updates. A temperature of zero is not a universal service-level guarantee of identical text.

![Minimum reproducibility record for an LLM request including context, artifacts, generation settings, output, policy, and actions](/ai-security-course/assets/chapter-04/13-reproducibility-evidence.png)

*Determinism, reproducibility, and evidence — capture the complete request and decision chain because the visible prompt and temperature alone cannot reconstruct an LLM-enabled system's behavior. [Open infographic ↗](https://1200km.com/ai-security-course/assets/chapter-04/13-reproducibility-evidence.png)*

### Minimum reproducibility record

```yaml
request_id: immutable identifier
initiating_identity: pseudonymous or access-controlled reference
tenant: tenant identifier
messages_digest: digest of canonical structured messages
context_manifest: source IDs, versions, ACL decisions, order, and token counts
template_digest: immutable chat-template digest
tokenizer: artifact ID and digest
model: artifact or provider model-version identifier
adapter: identifier and digest, if used
runtime: provider or local runtime version
generation: temperature, top_p, top_k, max_tokens, stop, seed
output_digest: digest of raw generated bytes
parser_and_policy: versions and decisions
actions: exact proposed, approved, denied, and executed actions
safety_layer: guardrail or filter identifiers, versions, and decisions
```

Sensitive prompts and outputs may require encryption, minimization, field-level redaction, or shorter retention. A digest proves equality only when the canonicalization method and protected original are available for authorized investigation.

**Security consequence:** Design evidence before an incident. If privacy policy prevents full prompt logging, retain a manifest of trusted/untrusted segments, stable digests, lengths, token counts, source references, and authorization decisions.

<a id="structured-output"></a>
## 12. Structured output is not authorization

Models can be prompted or constrained to produce JSON, XML, SQL, code, or tool-call arguments. Grammar-constrained generation and schema validation improve syntax. They do not prove semantic correctness, benign intent, object-level authorization, or safe side effects.

![Control chain from model-generated structured output through parsing, validation, authorization, approval, least-privileged execution, and audit](/ai-security-course/assets/chapter-04/14-structured-output-authorization.png)

*Structured output is not authorization — syntax is only the first gate before semantic validation, object-level authorization, policy, exact-action approval, least-privileged execution, and audit. [Open infographic ↗](https://1200km.com/ai-security-course/assets/chapter-04/14-structured-output-authorization.png)*

```text
model output
  → strict parser
  → schema and type validation
  → semantic validation
  → tenant and object authorization
  → policy and risk check
  → exact-action approval when required
  → execution with least-privileged identity
  → result and audit record
```

*Figure 2 — From model output to authorized action. Syntax validation is only the first control; semantic validation, authorization, approval, least privilege, and audit remain application responsibilities.*

**Security consequence:** Treat model output as untrusted input even when it matches a schema. Bind human approval to the exact normalized action, target, arguments, identity, and expiration—not to a natural-language summary.

<a id="prompt-injection"></a>
## 13. Prompt injection and instruction conflicts

**Prompt injection** is an attack or test in which adversarially chosen input attempts to change a generative AI system's behavior contrary to the application owner's intent. In **direct prompt injection**, the adversary supplies instructions through an interactive input. In **indirect prompt injection**, instructions arrive through data the application retrieves or processes, such as a web page, email, document, issue, tool result, or memory entry.

![Direct and indirect prompt-injection paths crossing untrusted content, model generation, and protected application boundaries](/ai-security-course/assets/chapter-04/15-prompt-injection.png)

*Prompt injection and instruction conflicts — manipulated content can influence generation, so durable controls must constrain what that influence can retrieve, disclose, approve, or execute. [Open infographic ↗](https://1200km.com/ai-security-course/assets/chapter-04/15-prompt-injection.png)*

Prompt injection is not ordinary SQL injection: the model is designed to interpret natural-language content as potential instruction. Quoting, delimiters, role text, and “ignore previous instructions” warnings may influence behavior but do not create a hard security boundary.

### State the threat model

Record:

- attacker control over direct input or external content;
- victim identity and tenant;
- accessible data sources and tools;
- model, template, context, and application versions;
- required user interaction;
- target security property and success criterion;
- number of attempts or query budget; and
- evidence connecting generated output to an unauthorized disclosure or action.

### Defensive design

1. Keep untrusted content labeled and provenance-linked.
2. Authorize retrieval before content enters context.
3. Minimize secrets and authority available to the model path.
4. Separate content processing from control data where architecture permits.
5. Validate every proposed action independently.
6. Require exact-action approval for material side effects.
7. Test direct, indirect, encoded, multilingual, fragmented, and multi-turn variants.
8. Monitor abnormal source-to-tool flows and repeated control-boundary probes.

**Security consequence:** The durable control is outside the model. Assume manipulated content can influence generation; limit what that influence can disclose or execute.

<a id="extraction"></a>
## 14. Extraction, leakage, and sensitive context

An attacker may attempt to obtain system instructions, hidden context, private retrieved data, memorized training examples, model behavior, or proprietary parameters. These are different targets and require different evidence.

![Taxonomy of system-prompt disclosure, context leakage, training-data memorization, model extraction, and cross-tenant disclosure](/ai-security-course/assets/chapter-04/16-extraction-leakage.png)

*Extraction and leakage claims — identify the protected object and require evidence appropriate to prompt disclosure, context leakage, memorization, model extraction, or cross-tenant exposure. [Open infographic ↗](https://1200km.com/ai-security-course/assets/chapter-04/16-extraction-leakage.png)*

| Claim | Required evidence |
|---|---|
| System-prompt disclosure | Match against the actual versioned instruction, accounting for guessable text |
| Context leakage | Proof that output contains data present in protected request context and unavailable to the attacker |
| Training-data memorization | Reproducible extraction with provenance and analysis of uniqueness or exposure |
| Model extraction | Demonstrated approximation or recovery under a stated query/access budget |
| Cross-tenant disclosure | Identity, tenant, authorization trace, source object, and output linkage |

![Evidence requirements for system-prompt disclosure, context leakage, training-data memorization, model extraction, and cross-tenant disclosure claims](/ai-security-course/assets/chapter-04/17-evidence-requirements.png)

*Required evidence differs for instruction disclosure, protected-context leakage, training-data memorization, model extraction, and cross-tenant disclosure. [Open infographic ↗](https://1200km.com/ai-security-course/assets/chapter-04/17-evidence-requirements.png)*

Avoid putting reusable credentials, private keys, bearer tokens, or unrestricted secrets into model context. A system prompt is configuration, not an appropriate secret store.

**Security consequence:** Apply data minimization before context assembly, output filtering only as defense in depth, least privilege to retrieval and tools, and incident-ready provenance for every sensitive segment.

<a id="cti-case"></a>
## 15. CTI case study: indirect prompt injection

![Indirect prompt-injection chain from attacker-controlled content through authorized retrieval and model influence to a proposed or executed side effect](/ai-security-course/assets/chapter-04/18-indirect-prompt-injection.png)

*CTI case study — untrusted retrieved content influences generation and reaches a side-effect path when an independent authorization and policy boundary is missing. [Open infographic ↗](https://1200km.com/ai-security-course/assets/chapter-04/18-indirect-prompt-injection.png)*

### Disclosed case: EchoLeak

EchoLeak anchors this pattern in a disclosed production-system vulnerability. AIM Security researchers reported a zero-click indirect prompt-injection chain affecting Microsoft 365 Copilot; Microsoft assigned [CVE-2025-32711](https://msrc.microsoft.com/update-guide/vulnerability/CVE-2025-32711), remediated the issue, and stated that no customer action was required. MITRE ATLAS records the research as case study [`AML.CS0059`](https://github.com/mitre-atlas/atlas-data/releases/tag/v2026.06). The ATLAS case record says a malicious email could enter Copilot's retrieval context, influence the generated response, and use rendered Markdown image behavior to create an outbound exfiltration path.

In this case, **zero-click** means that the victim did not need to open the malicious email or select an attacker-supplied link. A later, ordinary Copilot interaction acted as the trigger after the content had entered the retrieval path; it does not mean that the system produced an effect without any subsequent request or event.

This evidence supports a disclosed and reproduced capability against the affected design. It does **not** establish criminal exploitation in the wild, universal behavior across Copilot versions, or compromise of every tenant. Preserve that distinction when turning a case study into a detection or architectural requirement.

The generalized teaching scaffold below changes the product and side effect deliberately. Consider a **synthetic, course-only** security assistant that reads external incident reports and can create tickets. A report contains hidden or visible text instructing the assistant to copy prior private context into a ticket controlled by the attacker.

```text
attacker-controlled report
  → authorized crawler stores content
  → analyst asks assistant to summarize report
  → retrieval adds report to model context
  → embedded instruction influences generation
  → model proposes ticket creation with sensitive content
  → weak application executes proposal
```

*Figure 3 — Generalized indirect prompt-injection chain. EchoLeak used email retrieval and response rendering; the synthetic ticket workflow changes those components so learners can reason about the underlying trust-boundary failure without replaying a real exploit.*

The report's inclusion may be authorized while the ticket content and destination are not. The security failure occurs when untrusted content influences a side effect without an independent authorization and policy boundary. This general pattern was established in earlier application-integrated prompt-injection research by Greshake et al.; the EchoLeak disclosure provides a later production-system case with a CVE and a published evidence chain.

### Evidence chain

1. Preserve the retrieved object, version, parser output, and provenance.
2. Record the authenticated analyst, tenant, request, and retrieval authorization.
3. Preserve the template, tokenization manifest, model route, and generation configuration.
4. Capture the raw proposal separately from the parsed tool arguments.
5. Record policy checks, approval display, executing workload identity, and final ticket API response.
6. Reproduce against a benign control document and encoded variants.
7. Report whether the result was generated text, blocked proposal, approved action, or executed unauthorized action.

### Detection hypothesis

Alert or investigate when content from an untrusted source is followed by a proposed or executed high-risk tool call that references sensitive context, changes destination, or exceeds the initiating user's normal workflow. Correlate retrieval provenance, generation trace, policy decision, and tool telemetry.

<a id="controls"></a>
## 16. Controls, ATLAS mapping, and analyst exercise

![Layered LLM security controls across build, context assembly, generation, tools, monitoring, and response](/ai-security-course/assets/chapter-04/19-layered-controls.png)

*Layered controls for LLM-enabled systems — secure the build and release, context assembly, generation and parsing, tool execution, monitoring, and response as one evidence-producing system. [Open infographic ↗](https://1200km.com/ai-security-course/assets/chapter-04/19-layered-controls.png)*

### Layered control checklist

**Build and release**

- Pin model, tokenizer, template, adapter, runtime, and generation configuration.
- Sign artifacts and preserve provenance, evaluation records, and approval.
- Test role serialization, special tokens, truncation, stop handling, and parser failure.

**Context assembly**

- Authenticate the initiating identity and preserve tenant context.
- Authorize every retrieved object before inclusion.
- Label source, trust, sensitivity, version, and parser for each segment.
- Minimize secrets and enforce deterministic context budgets.

**Generation and parsing**

- Bound input, output, cost, time, retries, and concurrency.
- Treat output as untrusted data.
- Parse strictly and validate schema, semantics, destinations, and identifiers.
- Keep safety filters observable and versioned.

**Tools and actions**

- Enforce least privilege with a scoped workload identity.
- Authorize every object and operation at execution time.
- Require exact-action approval for material side effects.
- Make retries idempotent and log proposed, approved, denied, and executed actions separately.

**Monitoring and response**

- Correlate request, context provenance, model route, output, policy, and tool events.
- Detect unusual source-to-tool flows, destination changes, secret patterns, and repeated probes.
- Support rapid model, template, tool, connector, and content-source rollback.
- Maintain privacy-aware evidence retention and an incident reproduction fixture.

### MITRE ATLAS-oriented mapping

The official ATLAS release page listed content release **2026.06** as latest when this chapter was finalized on 13 August 2026. ATLAS uses `YYYY.MM.N` for content versions, while the Git tag is prefixed with `v`. The chapter records the content version as `2026.06` and links the immutable `v2026.06` release tag.

| ATLAS ID and title in 2026.06 | Chapter connection | Evidence required before mapping |
|---|---|---|
| `AML.T0051.000` — LLM Prompt Injection: Direct | Adversary supplies the instruction through the interactive input | Original request, identity, template, output, and protected boundary affected |
| `AML.T0051.001` — LLM Prompt Injection: Indirect | Separate data channel is ingested by the LLM | Retrieved object, source provenance, parser output, context inclusion, and generated result |
| `AML.T0051.002` — LLM Prompt Injection: Triggered | Later user action or event activates a planted instruction | Infiltration event, activation trigger, request trace, and resulting behavior |
| `AML.T0070` — RAG Poisoning | Manipulated content is indexed and later retrieved | Indexed object, index version, retrieval trace, relevance, and source authorization |
| `AML.T0077` — LLM Response Rendering | Rendered output creates an external request containing protected data | Raw model output, renderer behavior, outbound request, destination, and protected value linkage |
| `AML.T0085.000` — Data from AI Services: RAG Databases | AI service retrieves sensitive organizational information | Caller and tenant, source object, ACL decision, retrieved content, and output linkage |
| `AML.T0086` — Exfiltration via AI Agent Tool Invocation | A write-capable tool carries protected data to an adversary-controlled destination | Proposed arguments, policy decision, executing identity, API result, destination, and received data |

![MITRE ATLAS-oriented mapping of prompt injection, RAG poisoning, response rendering, data access, and agent-tool exfiltration](/ai-security-course/assets/chapter-04/20-atlas-mapping.png)

*MITRE ATLAS-oriented mapping — connect only observed, evidence-backed behavior to versioned techniques rather than treating a taxonomy label as proof. [Open infographic ↗](https://1200km.com/ai-security-course/assets/chapter-04/20-atlas-mapping.png)*

EchoLeak's ATLAS 2026.06 case record maps specific steps to `AML.T0051.002`, `AML.T0070`, `AML.T0077`, and `AML.T0085.000`, among other techniques. That case mapping does not make the same IDs correct for every prompt-injection test.

Do not force every failed instruction-following test into an ATT&CK or ATLAS technique. Map observed attacker behavior and evidence, and record the ATLAS version used.

### Analyst practical: trace one request

Choose a course-owned or otherwise authorized local test application. Do not use production secrets or unauthorized targets. The dedicated Chapter 4 lab fixture is not yet published; until it is available, use an isolated disposable application that has no external side effects, or complete the exercise as a paper architecture trace using the synthetic ticket workflow above.

1. Inventory the model, tokenizer, template, context sources, tools, and generation configuration.
2. Send a benign request and capture the minimum reproducibility record.
3. Repeat with a document containing a harmless instruction conflict, such as a request to output a fixed test marker.
4. Determine whether the marker entered retrieved content, serialized context, generated text, parsed arguments, or an executed action.
5. Change one variable at a time: document placement, encoding, truncation pressure, template, model, or policy.
6. Add an independent action validator and repeat.
7. Write the result as an evidence chain, not as “the LLM was hacked.”

### Required deliverables

Submit one concise evidence pack containing:

1. A request-path diagram showing identity, context sources, serialization, tokenizer, model route, generation settings, parser, policy, and any available tool boundary.
2. A baseline record and one harmless instruction-conflict record, including stable artifact or provider versions and privacy-safe input/output evidence.
3. A comparison that changes one variable at a time and distinguishes generated text, parsed proposal, policy decision, approval, and executed action.
4. One detection hypothesis with required telemetry, expected benign cases, and a stated false-positive risk.
5. One recommended deterministic control and evidence showing whether it operated as intended.
6. A final finding divided into **observed**, **reproduced**, **inferred**, and **unknown** statements.

### Assessment rubric

| Criterion | Points | Full-credit standard |
|---|---:|---|
| Scope and safe execution | 10 | Names the authorized system, uses a harmless marker, and excludes secrets and third-party data. |
| Request-path accuracy | 20 | Separates identity, context, template, tokenizer, model, decoding, parser, policy, and action. |
| Reproducibility record | 20 | Preserves sufficient versions, digests, settings, provenance, and outputs to repeat the test. |
| Evidence reasoning | 20 | Clearly separates observed facts, reproduced behavior, inference, alternatives, and unknowns. |
| Control and detection design | 20 | Proposes an independently enforced control and a telemetry-backed detection hypothesis with limitations. |
| Communication | 10 | Uses bounded language and does not equate model output with authorization, execution, or verified impact. |

![Chapter 4 assessment rubric covering safe scope, request-path accuracy, reproducibility, evidence reasoning, controls, detection, and communication](/ai-security-course/assets/chapter-04/21-assessment-rubric.png)

*Assessment rubric — full credit requires safe scope, a complete request-path model, reproducible evidence, bounded reasoning, independently enforced controls, telemetry-backed detection, and precise communication. [Open infographic ↗](https://1200km.com/ai-security-course/assets/chapter-04/21-assessment-rubric.png)*

**Passing standard:** 70/100, with at least half credit in every criterion. Revise any submission that uses unauthorized data, claims impact from generated text alone, omits the effective template or generation configuration, or treats an ATLAS mapping as evidence by itself.

You have completed this chapter when you can reconstruct why an LLM-enabled application produced a result, identify which security boundary accepted or rejected it, and state the strongest claim the preserved evidence supports.

### Knowledge check

1. Why can two applications using the same model produce different security outcomes?
2. Why is a role label not an authorization boundary?
3. What does a causal attention mask prevent?
4. Which generation settings must be recorded for reproducibility?
5. Why does schema-valid JSON remain untrusted?
6. What evidence distinguishes prompt disclosure from guessed prompt content?
7. Where should authorization occur for retrieved content and tool execution?
8. Which event proves impact: generated text, parsed proposal, approved action, or executed action?
9. Which identifiers and isolation attributes must be part of a safe cross-request KV-cache design?
10. Why must a chat template be versioned and reviewed as a release artifact rather than treated as invisible formatting?

<a id="limitations"></a>
## 17. Limitations and scope boundaries

![Chapter 4 scope boundary separating covered decoder-oriented generation and application controls from later course topics](/ai-security-course/assets/chapter-04/22-limitations.png)

*Limitations and scope — this chapter models decoder-oriented text generation and its application boundaries while leaving training, RAG construction, multimodal systems, agent loops, MCP, and serving operations to later chapters. [Open infographic ↗](https://1200km.com/ai-security-course/assets/chapter-04/22-limitations.png)*

This chapter explains decoder-oriented text generation and the surrounding application controls. It does not teach model training, RAG construction, multimodal tokenization, autonomous agent loops, MCP, or serving operations; later Module 00 chapters own those subjects. Retrieved content and tools appear here only where they affect the request boundary.

The conceptual equations and flows are architecture-neutral teaching models. A deployed provider may hide token IDs, logits, routing, kernels, safety layers, or the serialized prompt, so a complete forensic reconstruction may be impossible. Record unavailable fields as unknown rather than inferring them from visible output.

The EchoLeak section is based on a disclosed research case, Microsoft remediation information, and the MITRE ATLAS case record. It is not evidence of exploitation in the wild or a claim that current Microsoft 365 Copilot versions remain vulnerable. Likewise, an ATLAS mapping organizes validated behavior; it does not prove that the behavior occurred in a learner's system.

The chapter preserves text-native diagrams alongside locally archived publication infographics. The text-native flows remain selectable, accessible, searchable, and easy to revise; the infographics provide a visual summary of the same control boundaries. Learners should treat both as architecture models, not packet-level or provider-specific implementation diagrams.

<a id="key-takeaways"></a>
## 18. Key takeaways

![Chapter 4 key takeaways for serialization, artifacts, attention, decoding, context, authorization, prompt injection, and durable controls](/ai-security-course/assets/chapter-04/23-key-takeaways.png)

*Key takeaways — inspect serialization, version all model-path artifacts, separate generated content from trusted decisions, and place durable controls outside generation. [Open infographic ↗](https://1200km.com/ai-security-course/assets/chapter-04/23-key-takeaways.png)*

- A chat application serializes structured state into a token sequence; inspect the serialization boundary.
- Tokenizer and chat template are versioned release artifacts, not invisible preprocessing details.
- Attention is learned information flow, not explanation, permission, provenance, or truth.
- An LLM repeatedly predicts a next-token distribution; decoding and application policy determine what happens next.
- Context limits, truncation, caches, routing, and generation configuration can change behavior and evidence.
- Structured output improves syntax but does not establish authorization or semantic safety.
- Prompt injection becomes a security incident when manipulated content crosses a protected confidentiality, integrity, or action boundary.
- Durable controls authenticate, authorize, validate, constrain, approve, execute, and log outside the model.

<a id="next"></a>
## 19. What comes next

![Course roadmap from Chapter 4 generation mechanics to the next Module 00 chapter on the LLM lifecycle](/ai-security-course/assets/chapter-04/24-what-comes-next.png)

*What comes next — follow the LLM lifecycle through training, adaptation, release, serving, monitoring, and retirement while preserving provenance across every changed artifact. [Open infographic ↗](https://1200km.com/ai-security-course/assets/chapter-04/24-what-comes-next.png)*

[The next Module 00 chapter](https://1200km.com/ai-security-course/module-00.html#lifecycle) follows the LLM lifecycle from pre-training through instruction tuning, preference optimization, adapters, quantization, release, serving, monitoring, and retirement. It will show which artifacts change at each stage and how to preserve provenance across them.

<a id="conclusion"></a>
## 20. Conclusion

![Conclusion showing the LLM request as a chain of identities, context, serialization, artifacts, generation, policy, and side effects](/ai-security-course/assets/chapter-04/25-conclusion.png)

*Conclusion — defensible LLM security comes from versioning every link in the request chain and keeping retrieval authorization, validation, approval, execution, and evidence outside model generation. [Open infographic ↗](https://1200km.com/ai-security-course/assets/chapter-04/25-conclusion.png)*

An LLM request is not one opaque model event. It is a chain of authenticated identities, selected context, serialization rules, tokenizer artifacts, model execution, decoding choices, parsers, policy decisions, and possible side effects. Investigations become defensible when each link is versioned and the analyst states exactly where the evidence ends.

The central security discipline is therefore simple: let the model propose content, but keep trust decisions outside generation. Authorize retrieval before context assembly, validate structured output as untrusted input, approve material actions precisely, execute with least privilege, and preserve enough evidence to reproduce the result. This approach remains useful even as architectures and providers change because it is grounded in system boundaries rather than confidence in generated prose.

<a id="references"></a>
## 21. References

1. Vaswani, A. et al., [Attention Is All You Need](https://arxiv.org/abs/1706.03762), 2017 (revised 2023).
2. Hugging Face Transformers, [Chat templates](https://huggingface.co/docs/transformers/main/chat_templating) and [Writing a chat template](https://huggingface.co/docs/transformers/main/chat_templating_writing).
3. Hugging Face Transformers, [Generation strategies](https://huggingface.co/docs/transformers/main/generation_strategies).
4. NIST, [Adversarial Machine Learning: A Taxonomy and Terminology of Attacks and Mitigations, NIST AI 100-2 E2025](https://doi.org/10.6028/NIST.AI.100-2e2025), 2025.
5. NIST, [Artificial Intelligence Risk Management Framework: Generative Artificial Intelligence Profile, NIST AI 600-1](https://doi.org/10.6028/NIST.AI.600-1), 2024.
6. MITRE, [ATLAS](https://atlas.mitre.org/) and [ATLAS content release 2026.06 (Git tag `v2026.06`)](https://github.com/mitre-atlas/atlas-data/releases/tag/v2026.06), accessed 13 August 2026.
7. Greshake, K. et al., [More than you've asked for: A Comprehensive Analysis of Novel Prompt Injection Threats to Application-Integrated Large Language Models](https://arxiv.org/abs/2302.12173), 2023.
8. Microsoft Security Response Center, [CVE-2025-32711](https://msrc.microsoft.com/update-guide/vulnerability/CVE-2025-32711), 2025.
9. MITRE ATLAS, [EchoLeak: Zero-Click Prompt Injection Targeting M365 Copilot for Data Exfiltration (`AML.CS0059`)](https://github.com/mitre-atlas/atlas-data/releases/tag/v2026.06), ATLAS content release 2026.06.
10. OWASP, [GenAI LLM Top 10 2026](https://genai.owasp.org/resource/owasp-genai-llm-top-10-2026/), 3 August 2026; use as community guidance rather than a substitute for a system-specific threat model.

<!-- GLOSSARY DELTA -->

- **Tokenizer:** A versioned algorithm and vocabulary that maps input text or bytes to token IDs and maps IDs back to output representations.
- **Vocabulary:** The tokenizer's finite mapping between token representations and numeric IDs.
- **Special token:** A reserved token representing protocol structure such as sequence, role, padding, tool, or document boundaries.
- **Chat template:** Versioned serialization logic that converts structured messages and related control data into the token sequence expected by a chat model.
- **Token embedding:** A learned vector representation associated with a token ID before contextual processing.
- **Positional information:** Information that represents token order, including learned positions, fixed encodings, or rotary position embeddings (RoPE).
- **Attention head:** One learned query-key-value projection and weighted information-flow operation within multi-head attention.
- **Causal mask:** A constraint that prevents a decoder position from attending to future positions during next-token prediction.
- **Logit:** An unnormalized model output score for a candidate token. This chapter specializes the Chapter 3 definition for language-model vocabularies.
- **Softmax:** A transformation that converts a vector of scores into normalized non-negative values that sum to one.
- **Context window:** The bounded token sequence available to a request, including input, selected context, and generated tokens subject to the product's accounting rules.
- **Truncation policy:** The deterministic rule for rejecting, removing, summarizing, or selecting content when a request exceeds its context budget.
- **KV cache:** Cached attention keys and values for earlier positions used to accelerate autoregressive generation.
- **Greedy decoding:** Selecting the highest-scoring available token at each generation step.
- **Temperature:** A generation parameter that rescales logits before sampling; it changes output distribution but does not provide correctness or authorization.
- **Top-k sampling:** Restricting token selection to the `k` highest-scoring candidates.
- **Top-p sampling:** Restricting token selection to the smallest candidate set whose cumulative probability reaches `p`.
- **Stop sequence:** A configured token pattern that ends generation when matched under the serving implementation's rules.
- **Repetition penalty:** A logit adjustment based on previously generated tokens, intended to reduce repetition.
- **Grammar-constrained generation:** Restricting token choices so output follows a formal grammar; it improves syntax, not semantic correctness or authority.
- **Direct prompt injection:** Adversarial instruction supplied through the application's interactive input channel.
- **Indirect prompt injection:** Adversarial instruction supplied through separate content later ingested into model context.
- **Triggered prompt injection:** A planted instruction activated later by a user action or system event.
- **Context leakage:** Disclosure of protected data present in request context and unavailable to the requester through authorized means.
- **Model extraction:** Using target-service outputs to approximate or recover model behavior or parameters under a stated access and query budget. This amends Chapter 3 by explicitly including artifact recovery as distinct from ordinary output imitation.

<a id="follow-my-work"></a>
## 22. Follow My Work

I publish practical cybersecurity research, CTI workflows, detection engineering notes, malware-analysis projects, AI-security research, open-source tools, labs, and technical guides.

- [Website — 1200km.com](https://1200km.com/)
- [Medium — @1200km](https://medium.com/@1200km)
- [LinkedIn — Andrey Pautov](https://www.linkedin.com/in/andrey-pautov/)
- [GitHub — tools and labs](https://github.com/anpa1200)
- [Contact — 1200km@gmail.com](mailto:1200km@gmail.com)
