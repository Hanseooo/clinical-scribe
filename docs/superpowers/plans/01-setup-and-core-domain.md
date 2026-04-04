# ClinicalScribe: 01 Setup, Config & Core Domain Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Establish the foundational test configuration, Next.js header requirements for ffmpeg.wasm, and the core domain types/constants (safety patterns, templates).

**Architecture:** Next.js 16.2.2 App Router, React 19. Tests use Vitest + jsdom + MSW.

**Context & References:**
- **Spec:** `src/docs/SPEC.md`
- **Modularity:** `src/docs/MODULARITY.md`
- **Architecture:** `src/docs/ARCHITECTURE.md`
- **Next Plan:** `docs/superpowers/plans/02-settings-and-orchestration.md`

**Tech Stack:** Next.js 16, Vitest, TypeScript. Note on testing: pnpm warns about React 19 vs Testing Library React 18 peer deps. Proceed with the installed versions.

---

### Task 1: Next.js Configuration & Test Setup

**Files:**
- Modify: `next.config.js` or `next.config.mjs`
- Create: `vitest.config.ts`
- Create: `test/setup.ts`

- [ ] **Step 1: Configure Next.js Headers & Body Size**
  - Add COOP and COEP headers to `next.config.js` to allow `SharedArrayBuffer` (required by `@ffmpeg/ffmpeg`).
  - Add `serverActions: { bodySizeLimit: '20mb' }` to allow large audio uploads.
  - Set `NEXT_PUBLIC_APP_URL` as an optional env reference.

- [ ] **Step 2: Create Vitest Config**
  - Create `vitest.config.ts` using `jsdom` environment.
  - Include `setupFiles: ['./test/setup.ts']`.

- [ ] **Step 3: Create Test Setup File**
  - Create `test/setup.ts` and import `@testing-library/jest-dom`.

### Task 2: Core Domain Types

**Files:**
- Create: `src/types/index.ts`

- [ ] **Step 1: Define Global Types**
  - Create `src/types/index.ts`.
  - Define `TemplateId` ('sbar' | 'isbar' | 'isobar'), `OutputLanguage` ('en').
  - Define `InputModality` ('audio-record' | 'audio-upload' | 'text').
  - Define `InputPayload` (modality, content: Blob | string).
  - Define `HandoverTemplate` interface.
  - Define `GenerationResult` interface.

### Task 3: Safety Patterns

**Files:**
- Create: `src/lib/safety/patterns.ts`
- Create: `src/lib/safety/patterns.test.ts`

- [ ] **Step 1: Write Safety Patterns Tests**
  - Create `src/lib/safety/patterns.test.ts` to verify the regex patterns match numbers, units, time, and `[VERIFY: ...]` flags correctly.
  - Run test to verify it fails (files don't exist yet).
  - Run: `npx vitest run src/lib/safety/patterns.test.ts`

- [ ] **Step 2: Implement Safety Patterns**
  - Create `src/lib/safety/patterns.ts`.
  - Export `SAFETY_PATTERNS` array with objects containing `pattern` (RegExp), `className`, and `priority`.

- [ ] **Step 3: Verify tests pass**
  - Run: `npx vitest run src/lib/safety/patterns.test.ts`

### Task 4: Templates Registry

**Files:**
- Create: `src/lib/templates/isbar.ts`
- Create: `src/lib/templates/index.ts`

- [ ] **Step 1: Create ISBAR Template**
  - Create `src/lib/templates/isbar.ts` exporting an `isbarTemplate` object conforming to `HandoverTemplate` (Identification, Situation, Background, Assessment, Recommendation).

- [ ] **Step 2: Create Templates Registry**
  - Create `src/lib/templates/index.ts`.
  - Export `TEMPLATES` record containing at least `isbar`. Export `DEFAULT_TEMPLATE = 'isbar'`.
