# Prompt Engineering

All production prompts live in [`src/lib/ai/prompts.ts`](../src/lib/ai/prompts.ts).
This doc explains the design choices and how to evolve them safely.

## Why a central library

- One source of truth keeps voice consistent across exam items, tutor replies,
  flashcards, and summaries.
- Every prompt is referenced by an ID (`name@version`) stored on the
  generated row (`ExamQuestion.promptVersion`, `AIGeneration.promptVersion`),
  so we can A/B and roll back.
- The `PromptVersion` table mirrors the active version so DB-level audits
  match the deployed code.

## Style conditioning

The exam-question system prompt encodes Microsoft's certification voice:

- Scenario-first stems with named fictitious companies (Contoso, Fabrikam, ...)
- Third-person neutral register
- Real product names ("Microsoft Entra ID", not "Azure AD")
- Distractors that map to realistic misconfigurations
- Explicit objective tagging (`IDENTITIES_GOVERNANCE`, `STORAGE`, …)
- JSON-only output to make parsing deterministic

A few-shot example with full structure (stem → options → correctIds →
explanation → distractor rationale → references) gives the model a concrete
template without locking it into one topic.

## Grounding (RAG)

Before generation, the platform pulls 3–6 top-relevance content blocks from
pgvector and embeds them as a `Grounding context from Microsoft Learn` section
in the user prompt. The system prompt instructs the model:

> "Never invent Azure features, SKUs, or limits. If unsure, fall back to a
> different concept."

This shifts the cost of hallucination: the model knows it has authoritative
source material and is rewarded for sticking to it.

## Prompt caching

Anthropic's prompt-cache breakpoints (`cache_control: { type: "ephemeral" }`)
are applied to the system prompt. Tutor conversations and consecutive exam
generations within ~5 minutes pay only for the new user message portion.

## Validation gates

LLM output is parsed with `extractJson` (handles fenced + raw replies) and
validated with **Zod**. Items that fail are silently dropped from the batch
and logged at WARN — we never persist malformed exam questions.

A second sanity gate enforces that every `correctIds[]` value references an
existing option, catching the most common hallucination pattern.

## Hallucination mitigation strategy

1. **RAG grounding** — see above.
2. **Strict schema validation** — Zod rejects ill-formed items.
3. **Stem-prefix deduplication** — prevents the model from regenerating
   slight variants of the same item.
4. **Human review gate** — items default to `NEEDS_REVIEW`. They only feed
   into student-facing exams when an instructor flips to `APPROVED`.
5. **Quality scoring** — `ExamQuestion.qualityScore` is set by instructors
   during review and used to bias sampling.

## Evolving prompts

1. Add a new export (`EXAM_QUESTION_SYSTEM_V2`, etc.) — never edit the live one.
2. Bump the version key passed to `complete({ promptVersion })`.
3. Add a `PromptVersion` row via migration.
4. Shadow-test by routing 10% of traffic, measuring `qualityScore` deltas in
   the admin dashboard.
5. Flip `active: true` when satisfied; deprecate the old key.

## Tutor system prompt

The tutor prompt emphasises:
- Concrete examples + CLI/PowerShell over abstractions
- Explaining the *why* behind wrong answers
- Honest "out of scope" / "uncertain" responses
- Inline citations (`[1]`, `[2]`) when grounding context is provided
- Tight replies that lead with the answer

These choices were tuned to make the tutor feel like a competent senior
engineer, not a chatbot.
