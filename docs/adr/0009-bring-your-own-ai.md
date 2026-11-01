# ADR-0009: Bring-your-own AI provider

- **Status**: Accepted
- **Date**: 2026-10-31

## Context

Planned AI features: floor plan from a photo or sketch, automatic furnishing, natural-language assistant, restyling of a render. The project has no server (ADR-0002) and must not pay for its users' AI usage. The audience is broad: some users have an account with a provider, others prefer a local model for privacy.

## Decision

- **Users bring their own access**: an API key (Anthropic, OpenAI, Google, Mistral…), an OpenAI-compatible endpoint, or a **local model via Ollama**. AI is entirely **optional**: the application is complete without it.
- The multi-provider abstraction relies on the **Vercel AI SDK** (Apache-2.0), in the `ai` package.
- **The AI acts only through `core` commands** (ADR-0004), exposed as tools (tool calling). It never generates raw geometry or document state directly. Every AI action is therefore validated, visible and undoable with Ctrl+Z.
- **API keys** are encrypted with Electron's **`safeStorage`** (OS keychain) and never leave the `main` process in clear text, except toward the chosen provider.
- Network calls to providers are made from the `main` process: no key exposed in the renderer, and no CORS issues.
- **Image generation** (restyling) goes through a separate interface, since providers differ (OpenAI Images, fal, Replicate, local ComfyUI…).
- In CI, the AI is **always mocked** (AI SDK mock model): no real calls, no cost, deterministic tests.

## Alternatives considered

- **AI proxy hosted by the project**: contradicts ADR-0002, with costs and responsibility for user data.
- **A single mandatory provider**: simpler, but excludes part of the audience and the local option.
- **AI generating geometry or document JSON directly**: unpredictable, hard to validate, impossible to undo cleanly.

## Consequences

**Positive**
- Zero AI cost for the project; privacy possible with Ollama.
- AI capabilities grow automatically with the command catalog.
- AI actions are safe: validated and undoable.

**Negative / risks**
- Quality varies with the chosen model: prompts must be tested across several providers and recommended models documented.
- Users must configure a key: the settings UI must be polished.
- Vision features (plan from a photo) require multimodal models, which not all local models offer.
