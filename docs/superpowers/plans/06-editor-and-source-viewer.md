# ClinicalScribe: 06 Editor & Source Viewer Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement the Markdown editor (`@uiw/react-md-editor`) and the safety highlighting mechanism via a custom `react-markdown` renderer. Build the collapsible Source Viewer.

**Architecture:** Client-side rendering only. The safety highlighter acts purely as a presentation layer and never mutates the underlying Markdown string.

**Context & References:**
- **Spec:** `src/docs/SPEC.md`
- **Modularity:** `src/docs/MODULARITY.md`
- **Previous Plan:** `docs/superpowers/plans/05-audio-input-and-ffmpeg.md`
- **Next Plan:** `docs/superpowers/plans/07-export-and-unsaved-warnings.md`

**Tech Stack:** `@uiw/react-md-editor`, `react-markdown`, regex-based text processing.

---

### Task 1: Source Viewer Component

**Files:**
- Create: `src/features/source-viewer/useSourceLabel.ts`
- Create: `src/features/source-viewer/SourceViewer.tsx`
- Run: `npx shadcn-ui@latest add accordion`

- [ ] **Step 1: Install shadcn UI Accordion**
  - Run `npx shadcn-ui@latest add accordion`.

- [ ] **Step 2: Implement Source Label Hook**
  - Create `src/features/source-viewer/useSourceLabel.ts` accepting `modality` (`InputModality`).
  - Return "Transcript" if `audio-*`, else "Source Text".

- [ ] **Step 3: Implement Source Viewer UI**
  - Create `src/features/source-viewer/SourceViewer.tsx` accepting `result: GenerationResult | null`.
  - Render an Accordion panel containing a read-only textarea or pre-wrap `div`.
  - Display "Copy" button.

### Task 2: Safety Highlighting Logic

**Files:**
- Create: `src/features/editor/highlighter.ts`
- Create: `src/features/editor/highlighter.test.ts`
- Create: `src/features/editor/SafetyHighlighter.tsx`

- [ ] **Step 1: Write Highlighter Unit Tests**
  - Create `src/features/editor/highlighter.test.ts` testing the replacement logic.
  - Given a text node with units, ensure it returns an array of strings and React elements (`<mark className="...">`).

- [ ] **Step 2: Implement Highlighter Parsing**
  - Create `src/features/editor/highlighter.ts` using `SAFETY_PATTERNS` from `src/lib/safety/patterns.ts`.
  - Write a function that tokenizes a string into an array of unhighlighted strings and highlighted `<mark>` objects based on the regex priorities.

- [ ] **Step 3: Implement SafetyHighlighter React Component**
  - Create `src/features/editor/SafetyHighlighter.tsx` accepting `markdown` string.
  - Use `react-markdown` with a custom `components.text` or `components.p` renderer that applies the highlighter function to text nodes.

### Task 3: Handover Editor Component

**Files:**
- Run: `pnpm add @uiw/react-md-editor`
- Create: `src/features/editor/HandoverEditor.tsx`

- [ ] **Step 1: Install Dependencies**
  - Run `pnpm add @uiw/react-md-editor next-remove-imports`. Note that `@uiw/react-md-editor` requires specific styling configuration for Next.js app router.

- [ ] **Step 2: Implement Editor Component**
  - Create `src/features/editor/HandoverEditor.tsx` accepting `value` and `onChange(value: string)`.
  - Dynamically import the editor `import('@uiw/react-md-editor')` with `ssr: false` since it relies on DOM APIs.
  - Render `SafetyHighlighter` inside the editor's preview panel or tab.

- [ ] **Step 3: Mount Editor & SourceViewer in Page**
  - Modify `app/page.tsx` to conditionally render `<SourceViewer result={generationResult} />` and `<HandoverEditor value={handover} onChange={setHandover} />` when `handover` is truthy.