# ClinicalScribe: 04 Text Input & Generation Hook Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Create the reusable `useGeneration` hook for interacting with the backend and build the Text Input feature module with char limits and validation.

**Architecture:** Client-side form logic. Modular encapsulation (`features/input/text/`).

**Context & References:**
- **Spec:** `src/docs/SPEC.md`
- **Modularity:** `src/docs/MODULARITY.md`
- **Previous Plan:** `docs/superpowers/plans/03-langchain-and-api.md`
- **Next Plan:** `docs/superpowers/plans/05-audio-input-and-ffmpeg.md`

**Tech Stack:** React hooks, Fetch API, Tailwind.

---

### Task 1: Generation Hook

**Files:**
- Create: `src/features/generation/types.ts`
- Create: `src/features/generation/useGeneration.ts`
- Create: `src/features/generation/useGeneration.test.ts`

- [ ] **Step 1: Write Hook Tests (React Testing Library)**
  - Setup MSW mock for `/api/generate`.
  - Test initial state (`isLoading=false`, `error=null`).
  - Test state changes during and after a successful fetch.

- [ ] **Step 2: Define Types**
  - Create `src/features/generation/types.ts` with `GenerateRequest` (union of Audio and Text payload shapes) and `GenerateResponse` (success or error payload).

- [ ] **Step 3: Implement useGeneration**
  - Create `src/features/generation/useGeneration.ts`.
  - Accept `onSuccess` and `onError` callbacks.
  - Implement async `generate` function handling the `fetch` and setting `isLoading` and `error` state.

- [ ] **Step 4: Verify Tests**
  - Run: `npx vitest run src/features/generation/useGeneration.test.ts`

### Task 2: Text Panel

**Files:**
- Create: `src/features/input/text/useTextInput.ts`
- Create: `src/features/input/text/TextPanel.tsx`

- [ ] **Step 1: Implement Input Hook**
  - Create `src/features/input/text/useTextInput.ts`.
  - Manage string state, calculate char count.
  - Return `isValid` (>= 50, <= 12000 chars) and `isWarning` (>= 8000).

- [ ] **Step 2: Implement TextPanel UI**
  - Create `src/features/input/text/TextPanel.tsx`.
  - Accept `onSubmit(text: string)` and `isLoading` boolean.
  - Render a large `<textarea>` with monospace font.
  - Render dynamic char count below and disable submit button if `!isValid` or `isLoading`.

### Task 3: Root Composition (Text)

**Files:**
- Modify: `app/page.tsx`

- [ ] **Step 1: Connect hook and panel**
  - In `app/page.tsx`, call `useGeneration` passing handlers to update `isGenerating`, `generationResult`, and `handover` state on success.
  - Render `<TextPanel onSubmit={(text) => generate({ modality: 'text', text, template, outputLanguage })} />`.