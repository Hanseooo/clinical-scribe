# ClinicalScribe: 03 LangChain Pipeline & API Route Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement the AI backend utilizing LangChain and Gemini 2.5 Flash, including the modular Input Adapters and the Next.js API route.

**Architecture:**16 API Route proxying to Gemini. Adapters handle all modality branching (`src/lib/langchain/inputAdapters.ts`).

**Context & References:**
- **Spec:** `src/docs/SPEC.md`
- **Modularity:** `src/docs/MODULARITY.md`
- **Previous Plan:** `docs/superpowers/plans/02-settings-and-orchestration.md`
- **Next Plan:** `docs/superpowers/plans/04-text-input-and-hooks.md`

**Tech Stack:** `@langchain/google-genai`, `@langchain/core`, `formidable` (if parsing files, though Next.js body limits might handle it via JSON base64).

---

### Task 1: Input Adapters

**Files:**
- Create: `src/lib/langchain/inputAdapters.ts`
- Create: `src/lib/langchain/inputAdapters.test.ts` (Mock MSW for Gemini API upload if needed)

- [ ] **Step 1: Write Adapter Tests**
  - Create tests for `adaptRequest` normalizing `GenerateRequest` (Text vs Audio-Record) into `ChainInput`.
  - Stub `uploadToGeminiFileApi` with `vi.mock()` for audio tests.

- [ ] **Step 2: Implement Input Adapter**
  - Export `ChainInput` type.
  - Implement `adaptRequest`. For text, return `{ modality, text, template, outputLanguage }`.
  - For audio, call a helper to upload the `audioBase64` string to Gemini File API and return the resulting `fileUri`.

- [ ] **Step 3: Verify Test**
  - Run: `npx vitest run src/lib/langchain/inputAdapters.test.ts`

### Task 2: LangChain Handover Chains

**Files:**
- Create: `src/lib/langchain/handoverChain.ts`

- [ ] **Step 1: Write Handover Chain Functions**
  - Setup `ChatGoogleGenerativeAI` using `GEMINI_API_KEY`.
  - Create `generateFromText` using `RunnableSequence` with a text-only prompt (expecting just `HANDOVER:`).
  - Create `generateFromAudio` using `RunnableSequence` with a transcription + structure prompt (expecting `TRANSCRIPT:` and `HANDOVER:`). Delete file from Gemini File API afterward.

### Task 3: Next.js API Route

**Files:**
- Create: `app/api/generate/route.ts`
- Create: `app/api/generate/route.test.ts` (MSW to mock Gemini endpoint)

- [ ] **Step 1: Write Route Integration Test**
  - Setup MSW server to mock the API behavior of `/api/generate`.

- [ ] **Step 2: Implement Route Handler**
  - Create `POST` handler in `app/api/generate/route.ts`.
  - Extract payload (text or audio base64).
  - Call `adaptRequest`.
  - Switch on `modality` inside the route: if `text`, await `generateFromText`; if `audio-*`, await `generateFromAudio`.
  - Return `{ source, handover, modality, model: 'gemini-2.5-flash-lite' }`.

- [ ] **Step 3: Verify Test**
  - Run: `npx vitest run app/api/generate/route.test.ts`