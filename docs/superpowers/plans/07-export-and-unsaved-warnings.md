# ClinicalScribe: 07 Export & App Wiring Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement MD and PDF exports utilizing client-side print CSS and `Blob`. Set up unsaved changes warnings (`isDirty` tracking) to prevent data loss.

**Architecture:** Client-side operations leveraging `window.print()` and `URL.createObjectURL()`.

**Context & References:**
- **Spec:** `src/docs/SPEC.md`
- **Modularity:** `src/docs/MODULARITY.md`
- **Previous Plan:** `docs/superpowers/plans/06-editor-and-source-viewer.md`

**Tech Stack:**16, Web APIs (`Blob`, `window.print`, `beforeunload`).

---

### Task 1: Unsaved Changes Warning Hook

**Files:**
- Create: `src/hooks/useUnsavedWarning.ts`
- Create: `src/hooks/useUnsavedWarning.test.ts` (using `vi.spyOn(window, 'addEventListener')`)

- [ ] **Step 1: Write Hook Tests**
  - Verify `beforeunload` is added when `isDirty` is true and removed when false.
  - Test event manipulation (`e.preventDefault()`).

- [ ] **Step 2: Implement `useUnsavedWarning`**
  - Accept `isDirty: boolean` argument.
  - Register `window.addEventListener('beforeunload', handleUnload)` inside a `useEffect`.

### Task 2: Export Functions

**Files:**
- Create: `src/features/export/exportMd.ts`
- Create: `src/features/export/exportPdf.ts`
- Create: `public/print.css`
- Modify: `app/layout.tsx`

- [ ] **Step 1: Implement Markdown Export**
  - Create `src/features/export/exportMd.ts`.
  - Accept `content: string`. Create a Blob of type `text/markdown`.
  - Use an invisible `<a>` tag with `URL.createObjectURL` to trigger a download named `handover-{Date.now()}.md`.

- [ ] **Step 2: Implement PDF Export**
  - Create `src/features/export/exportPdf.ts`.
  - Call `window.print()`.

- [ ] **Step 3: Define Print Styles**
  - Create `public/print.css`.
  - Hide all non-printable UI chrome (buttons, inputs, margins).
  - Add `@page { margin: 2cm; @bottom-center { content: "AI-generated draft..." } }`.
  - Convert highlights to bold `[VERIFY]` prefixes for ink safety.
  - Link `print.css` in `app/layout.tsx`.

### Task 3: Export Bar UI

**Files:**
- Create: `src/features/export/ExportBar.tsx`

- [ ] **Step 1: Implement Export Bar**
  - Create `src/features/export/ExportBar.tsx` accepting `content: string` and `disabled: boolean`.
  - Add "Export MD" and "Export PDF" buttons utilizing `exportMd` and `exportPdf`.

- [ ] **Step 2: Wire Unsaved Changes Dialog in Page**
  - Modify `app/page.tsx` to handle dirty state confirmation.
  - Add `useUnsavedWarning(isDirty)`.
  - In `setHandover`, also `setIsDirty(true)`. In export handlers, `setIsDirty(false)`.
  - Render the `<ExportBar disabled={!handover} content={handover} />` at the bottom of the layout.

### Task 4: Final Quality Sweep

**Files:**
- Run: `pnpm run build`
- Run: `pnpm run lint`

- [ ] **Step 1: Type Checking**
  - Run `npx tsc --noEmit` to verify strict mode typing across the entire project. Ensure zero `any` types.

- [ ] **Step 2: Build Verification**
  - Run `pnpm run build` to confirm Next.js correctly compiles the API route and the Web Worker (ffmpeg) integrations.
  - Fix any outstanding ESLint or Vitest failures.