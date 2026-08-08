---
title: "AI Security Course, Module 00 — Chapter 4: Transformers and LLM Generation"
description: "A security-focused foundation for tokenization, chat templates, embeddings, attention, Transformer blocks, next-token generation, decoding, context limits, prompt injection, evidence, controls, and reproducible LLM evaluation."
module: "00"
chapter: "4"
status: "Complete"
canonical: "https://1200km.com/ai-security-course/module-00/chapter-04.html"
author: "Andrey Pautov"
---

<a id="top"></a>
[AI Security Engineering](https://1200km.com/ai-security-course.html) / [Module 00](https://1200km.com/ai-security-course/module-00.html) / Chapter 4

**Module 00** · **Chapter 4** · **Complete** · **CTI evidence base**

Navigation: [Module 00](https://1200km.com/ai-security-course/module-00.html) · [Chapter 3](https://1200km.com/ai-security-course/module-00/chapter-03.html) · [Course syllabus](https://1200km.com/ai-security-course.html) · [Terminology dictionary](https://1200km.com/ai-security-course/glossary.html)

# AI Security Course, Module 00 — Chapter 4: Transformers and LLM Generation

**Trace an LLM request from structured messages to generated output, then place authorization, validation, and forensic evidence at the boundaries that actually enforce security.**

This chapter explains how an application turns messages into tokens, how a Transformer produces next-token scores, how decoding turns those scores into text, and where security controls and evidence must exist around the model.

It is written for security engineers, CTI analysts, detection engineers, incident responders, and technical leaders who need to investigate an LLM-enabled application without treating fluent output as proof. The objective is a repeatable request trace: identify each artifact and trust boundary, reproduce behavior under controlled conditions, and distinguish generated text from an authorized or executed action.

> **Scope and safety:** Use only course-owned systems or environments you are authorized to test. The practical uses harmless marker strings and does not require production data, reusable credentials, destructive tool calls, or attempts to extract another user's information. If a provider processes the test remotely, follow its data-handling rules and do not send confidential evidence.

> **Chapter status: Complete.** This learner-ready chapter was finalized on 13 August 2026 with a bounded practical, completion rubric, primary references, and an evidence-first security workflow.

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
17. [17. Key takeaways](#key-takeaways)
18. [18. What comes next](#next)
19. [19. Conclusion](#conclusion)
20. [20. References](#references)
21. [21. Follow My Work](#follow-my-work)

<a id="mechanism"></a>
## 1. Why the generation mechanism matters to security

An LLM does not receive a conversation as separate colored chat bubbles. The application serializes messages, retrieved text, tool descriptions, memory, and control markers into a model-specific sequence. A tokenizer converts that sequence into token IDs. The model produces scores for possible next tokens, and a decoding procedure chooses what to append. The process repeats until a stop condition is reached.

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

Every arrow is a potential source of changed behavior. A response can change because the application selected different context, an untrusted document entered the prompt, the tokenizer or template changed, earlier instructions were truncated, a model route changed, the decoding configuration changed, or a downstream parser interpreted output differently.

**Security consequence:** “The model ignored the system prompt” is not yet an incident description. Preserve the serialized prompt or an approved privacy-safe representation, token counts, truncation decisions, model and tokenizer identifiers, decoding configuration, output, parser result, policy decision, and any action taken.

> **Course rule:** The model generates candidate content. The application authenticates identities, authorizes access, validates data, enforces policy, approves actions, and records evidence.

<a id="request-path"></a>
## 2. The complete LLM request path

Treat the LLM as one component in a larger system. The security boundary begins before tokenization and continues after generation.

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

The same base model can behave differently behind two products because their templates, context assembly, tools, safety layers, decoding, and policies differ. Evaluate the deployed system, not only a model name.

<a id="tokenization"></a>
## 3. Tokenization and the model interface

A **tokenizer** maps text or bytes into token IDs from a versioned vocabulary. Tokens may represent a word, word fragment, punctuation mark, byte sequence, whitespace pattern, or special control marker. Tokenization is reversible only within the tokenizer's defined behavior; it is not a semantic security parser.

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

```text
Attention(Q, K, V) = softmax(QKᵀ / √d) V
```

In **self-attention**, queries, keys, and values are derived from positions in the same sequence. **Multi-head attention** performs several learned projections in parallel, allowing different patterns of information flow. A causal mask prevents a decoder-only language model from using future tokens when predicting the next token.

Attention weights are not permissions, citations, confidence scores, or guaranteed explanations. High weight does not prove that a source authorized an action or that a generated claim is true.

**Security consequence:** Do not build an authorization or forensic conclusion from an attention visualization alone. Use source provenance, controlled experiments, request traces, and deterministic application logs.

<a id="transformer-block"></a>
## 7. The Transformer block

A modern Transformer block commonly combines attention, a position-wise feed-forward network, residual connections, and normalization. Exact ordering and components vary by architecture.

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

When input plus requested output exceeds a limit, an application may reject the request, truncate content, summarize history, remove earlier messages, or select fewer documents. Each policy changes the effective security context.

**Security consequence:** Make truncation deterministic and observable. Protect high-priority policy from silent removal, but do not mistake retained policy text for enforcement. Record tokens included and excluded by source class.

### KV cache

Autoregressive serving often caches attention keys and values for prior positions so each new token does not recompute the full prefix. Cache reuse improves latency but creates sensitive runtime state.

**Security consequence:** Isolate cache entries by request, identity, tenant, model, adapter, and relevant configuration. Define eviction and zeroization behavior. Treat cross-request cache reuse as a security-sensitive optimization requiring evidence.

<a id="decoding"></a>
## 10. Decoding and generation controls

Decoding converts logits into a token choice. The model artifact does not uniquely determine the response.

| Control | Mechanism | Security limitation |
|---|---|---|
| Greedy decoding | Select the highest-scoring token | Can still vary across runtimes and does not ensure correctness |
| Temperature | Rescale logits before sampling | Lower values reduce randomness but do not create authorization or truth |
| Top-k | Restrict choices to the k highest-scoring tokens | Can remove a low-ranked correct token |
| Top-p | Use the smallest set reaching cumulative probability p | Candidate set changes at each step |
| Maximum new tokens | Bound response-token count | Does not bound retries, tool loops, or total workflow cost |
| Stop sequence | Stop when configured token patterns appear | Tokenization and streaming boundaries can affect matching |
| Repetition penalty | Change scores based on prior tokens | Can distort structured or security-sensitive output |

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
```

Sensitive prompts and outputs may require encryption, minimization, field-level redaction, or shorter retention. A digest proves equality only when the canonicalization method and protected original are available for authorized investigation.

**Security consequence:** Design evidence before an incident. If privacy policy prevents full prompt logging, retain a manifest of trusted/untrusted segments, stable digests, lengths, token counts, source references, and authorization decisions.

<a id="structured-output"></a>
## 12. Structured output is not authorization

Models can be prompted or constrained to produce JSON, XML, SQL, code, or tool-call arguments. Grammar-constrained generation and schema validation improve syntax. They do not prove semantic correctness, benign intent, object-level authorization, or safe side effects.

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

**Security consequence:** Treat model output as untrusted input even when it matches a schema. Bind human approval to the exact normalized action, target, arguments, identity, and expiration—not to a natural-language summary.

<a id="prompt-injection"></a>
## 13. Prompt injection and instruction conflicts

**Prompt injection** is an attack or test in which adversarially chosen input attempts to change a generative AI system's behavior contrary to the application owner's intent. In **direct prompt injection**, the adversary supplies instructions through an interactive input. In **indirect prompt injection**, instructions arrive through data the application retrieves or processes, such as a web page, email, document, issue, tool result, or memory entry.

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

| Claim | Required evidence |
|---|---|
| System-prompt disclosure | Match against the actual versioned instruction, accounting for guessable text |
| Context leakage | Proof that output contains data present in protected request context and unavailable to the attacker |
| Training-data memorization | Reproducible extraction with provenance and analysis of uniqueness or exposure |
| Model extraction | Demonstrated approximation or recovery under a stated query/access budget |
| Cross-tenant disclosure | Identity, tenant, authorization trace, source object, and output linkage |

Avoid putting reusable credentials, private keys, bearer tokens, or unrestricted secrets into model context. A system prompt is configuration, not an appropriate secret store.

**Security consequence:** Apply data minimization before context assembly, output filtering only as defense in depth, least privilege to retrieval and tools, and incident-ready provenance for every sensitive segment.

<a id="cti-case"></a>
## 15. CTI case study: indirect prompt injection

Consider a security assistant that reads external incident reports and can create tickets. A report contains hidden or visible text instructing the assistant to copy prior private context into a ticket controlled by the attacker.

```text
attacker-controlled report
  → authorized crawler stores content
  → analyst asks assistant to summarize report
  → retrieval adds report to model context
  → embedded instruction influences generation
  → model proposes ticket creation with sensitive content
  → weak application executes proposal
```

The report's inclusion may be authorized while the ticket content and destination are not. The security failure occurs when untrusted content influences a side effect without an independent authorization and policy boundary.

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

Using the MITRE ATLAS v2026.06 release as the reference point, this workflow can support investigation of:

- prompt injection through direct or indirectly supplied instructions;
- discovery of system or model information;
- collection of sensitive AI-system information;
- exfiltration through an inference or tool-enabled channel; and
- abuse of an AI agent or its tools where generated output can influence action.

Do not force every failed instruction-following test into an ATT&CK or ATLAS technique. Map observed attacker behavior and evidence, and record the ATLAS version used.

### Analyst practical: trace one request

Choose an authorized test application. Do not use production secrets or unauthorized targets.

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

<a id="key-takeaways"></a>
## 17. Key takeaways

- A chat application serializes structured state into a token sequence; inspect the serialization boundary.
- Tokenizer and chat template are versioned release artifacts, not invisible preprocessing details.
- Attention is learned information flow, not explanation, permission, provenance, or truth.
- An LLM repeatedly predicts a next-token distribution; decoding and application policy determine what happens next.
- Context limits, truncation, caches, routing, and generation configuration can change behavior and evidence.
- Structured output improves syntax but does not establish authorization or semantic safety.
- Prompt injection becomes a security incident when manipulated content crosses a protected confidentiality, integrity, or action boundary.
- Durable controls authenticate, authorize, validate, constrain, approve, execute, and log outside the model.

<a id="next"></a>
## 18. What comes next

[The next Module 00 chapter](https://1200km.com/ai-security-course/module-00.html#lifecycle) follows the LLM lifecycle from pre-training through instruction tuning, preference optimization, adapters, quantization, release, serving, monitoring, and retirement. It will show which artifacts change at each stage and how to preserve provenance across them.

<a id="conclusion"></a>
## 19. Conclusion

An LLM request is not one opaque model event. It is a chain of authenticated identities, selected context, serialization rules, tokenizer artifacts, model execution, decoding choices, parsers, policy decisions, and possible side effects. Investigations become defensible when each link is versioned and the analyst states exactly where the evidence ends.

The central security discipline is therefore simple: let the model propose content, but keep trust decisions outside generation. Authorize retrieval before context assembly, validate structured output as untrusted input, approve material actions precisely, execute with least privilege, and preserve enough evidence to reproduce the result. This approach remains useful even as architectures and providers change because it is grounded in system boundaries rather than confidence in generated prose.

<a id="references"></a>
## 20. References

1. Vaswani, A. et al., [Attention Is All You Need](https://arxiv.org/abs/1706.03762), 2017 (revised 2023).
2. Hugging Face Transformers, [Chat templates](https://huggingface.co/docs/transformers/main/chat_templating) and [Writing a chat template](https://huggingface.co/docs/transformers/main/chat_templating_writing).
3. Hugging Face Transformers, [Generation strategies](https://huggingface.co/docs/transformers/main/generation_strategies).
4. NIST, [Adversarial Machine Learning: A Taxonomy and Terminology of Attacks and Mitigations, NIST AI 100-2 E2025](https://doi.org/10.6028/NIST.AI.100-2e2025), 2025.
5. NIST, [Artificial Intelligence Risk Management Framework: Generative Artificial Intelligence Profile, NIST AI 600-1](https://doi.org/10.6028/NIST.AI.600-1), 2024.
6. MITRE, [ATLAS](https://atlas.mitre.org/) and [ATLAS data release v2026.06](https://github.com/mitre-atlas/atlas-data/releases/tag/v2026.06), accessed 13 August 2026.
7. Greshake, K. et al., [More than you've asked for: A Comprehensive Analysis of Novel Prompt Injection Threats to Application-Integrated Large Language Models](https://arxiv.org/abs/2302.12173), 2023.
8. OWASP, [Top 10 for Large Language Model Applications](https://genai.owasp.org/llm-top-10/), accessed 13 August 2026; use as community guidance rather than a substitute for a system-specific threat model.

<a id="follow-my-work"></a>
## 21. Follow My Work

I publish practical cybersecurity research, CTI workflows, detection engineering notes, malware-analysis projects, AI-security research, open-source tools, labs, and technical guides.

- [Website — 1200km.com](https://1200km.com/)
- [Medium — @1200km](https://medium.com/@1200km)
- [LinkedIn — Andrey Pautov](https://www.linkedin.com/in/andrey-pautov/)
- [GitHub — tools and labs](https://github.com/anpa1200)
- [Contact — 1200km@gmail.com](mailto:1200km@gmail.com)
