# ClinicalScribe: 02 Settings Feature & Orchestration Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Establish the root UI (`app/page.tsx`) state management and build the Settings Bar (Template & Language selection) utilizing `shadcn/ui`.

**Architecture:** Features compose in `page.tsx` keeping cross-feature state localized using React `useState`.

**Context & References:**
- **Spec:** `src/docs/SPEC.md`
- **Modularity:** `src/docs/MODULARITY.md`
- **Previous Plan:** `docs/superpowers/plans/01-setup-and-core-domain.md`
- **Next Plan:** `docs/superpowers/plans/03-langchain-and-api.md`

**Tech Stack:** Next.js 16, TailwindCSS v4, shadcn/ui.

---

### Task 1: Initialize shadcn Select Component

**Files:**
- Run: `npx shadcn-ui@latest add select`

- [ ] **Step 1: Install Select component**
  - Run `npx shadcn-ui@latest add select`. This will create the component in `src/components/ui/select.tsx`.
  - Accept defaults for styles if prompted.

### Task 2: Settings Feature Component

**Files:**
- Create: `src/features/settings/SettingsBar.tsx`
- Create: `src/features/settings/SettingsBar.test.tsx` (MSW not needed for this UI test)

- [ ] **Step 1: Write SettingsBar Test**
  - Create `SettingsBar.test.tsx` using `@testing-library/react` to verify rendering of template dropdown with correct `TEMPLATES` keys from `src/lib/templates/index.ts`.

- [ ] **Step 2: Implement SettingsBar**
  - Create `src/features/settings/SettingsBar.tsx` accepting props: `template` (TemplateId), `onTemplateChange`, `outputLanguage` (OutputLanguage), `onOutputLanguageChange`.
  - Use shadcn Select. Output Language dropdown should only enable English ('en'), showing "Coming soon" for others if listed.

- [ ] **Step 3: Verify Test**
  - Run: `npx vitest run src/features/settings/SettingsBar.test.tsx`

### Task 3: Root Orchestrator State

**Files:**
- Modify: `app/page.tsx`

- [ ] **Step 1: Setup React state hooks in Page**
  - Make `app/page.tsx` a `"use client"` component.
  - Setup 7 core state variables:
    1. `template` (`useState<TemplateId>(DEFAULT_TEMPLATE)`)
    2. `outputLanguage` (`useState<OutputLanguage>('en')`)
    3. `inputPayload` (`useState<InputPayload | null>(null)`)
    4. `isGenerating` (`useState(false)`)
    5. `generationResult` (`useState<GenerationResult | null>(null)`)
    6. `handover` (`useState<string>('')`)
    7. `isDirty` (`useState(false)`)

- [ ] **Step 2: Mount SettingsBar**
  - Render the `<SettingsBar />` component in the main layout wrapper.
  - Test compiling via `npx tsc --noEmit`.