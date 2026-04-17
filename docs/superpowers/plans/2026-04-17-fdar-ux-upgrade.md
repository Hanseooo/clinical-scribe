# FDAR Template & UX Upgrade Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add robust FDAR handover template support, overhaul dynamic button labeling, helper copy, and markdown rendering, to deliver better clinical clarity, accessibility, and maintainable code.

**Architecture:** Enhancements target the template engine (FDAR prompt, registration, example), UI composition (input helpers and section tips per template/modality), and markdown output/presentation (heading/copy/print clarity), respecting project modularity boundaries throughout.

**Tech Stack:** Next.js, React, TypeScript, TailwindCSS, shadcn/ui, markdown rendering (custom/highlight), Vitest/@testing-library/react (for any test scaffolding).

---

## Task 1: Template Button Labeling & Selector

**Files:**
- Modify: `features/input/TemplateSelector.tsx` (UI selector logic, "New" badges)
- Modify: `features/input/GenerateButton.tsx` (button label/appearance)
- Modify: `src/lib/templates/registry.ts` (default selection logic)

- [ ] Refactor selector to make FDAR default, display "New" badge per design
- [ ] Update button to use dynamic label: `Generate ${templateLabel}`, styled bold/larger
- [ ] Ensure selector & button labels are derived from registry, not hardcoded
- [ ] Update registry to prioritize FDAR

## Task 2: Input Helper and Structure Guidance

**Files:**
- Modify: `features/input/InputPanel.tsx` (Show instructional/helper lines per modality)
- Modify: `features/editor/EditorPanel.tsx` (Add collapsible/dismissible "Structure Tip")
- Modify: `src/lib/templates/registry.ts` (templateKey-to-helper copy)
- Utilize: shadcn/ui `<Tooltip>` and `<Info>` components

- [ ] Attach one-line helper text for Record, Upload, and Text entry—template-aware (FDAR: extra Subjective/Objective copy)
- [ ] In EditorPanel, render "Structure Tip" collapsible box when FDAR selected, per spec instructional language
- [ ] Ensure all instruction/tooltips use shadcn/ui components for accessibility compliance

## Task 3: FDAR Template Implementation

**Files:**
- Create: `src/lib/templates/fdar.ts` (prompt config, output rules, dev comments)
- Modify: `src/lib/templates/registry.ts` (register FDAR)
- (if needed) Update: `src/types/index.ts` (type updates for new template keys/structure)

- [ ] Scaffold fdar.ts with full prompt (FOCUS, DATA (Subjective, Objective), ACTION, RESPONSE)
- [ ] Output structure uses strict markdown: headings, bold subheadings, bullets
- [ ] Add helpful comments for maintainers
- [ ] Register in main template registry as default

## Task 4: Output Formatting & Markdown Rendering

**Files:**
- Modify: `features/editor/MarkdownPreview.tsx` (heading size/boldness, add section visual separation)
- Modify: `features/editor/SafetyHighlighter.tsx` (if extra styling for section headers/lists needed)
- Update: Any shared `src/lib/markdown.ts` helpers if present

- [ ] Update parser/render logic: section headings (`##`, bold), data/output bullets
- [ ] Add spacing/margin, border-left or horizontal rule between sections for web
- [ ] For print/PDF, fallback: distinguish with spacing/rules, not color
- [ ] Ensure clear vertical gap in bulleted/numbered lists

## Task 5: Documentation

**Files:**
- Modify: `src/docs/PROMPTS.md` (FDAR prompt, output, full example)
- Modify: `README.md` (call out new FDAR template, structure-tip, etc if appropriate)
- Write: comments in `src/lib/templates/fdar.ts` (internal documentation)

- [ ] Document FDAR: prompt, structure expectations, output example
- [ ] Add notes for structure tip, headings, bullets, accessibility conventions

## Task 6: Validation & Accessibility

**Files:** (no code, but may touch all above)

- [ ] Manually test all combos: input modes, template switches, FDAR generation, markdown output
- [ ] Print and PDF: check for readable section delineation (spacing/rules, no color)
- [ ] Check all headings, buttons, tooltips for accessibility (screen reader, keyboard nav)
- [ ] Clinical review: does FDAR output match sample? Subjective/Objective split?

---

**Chunk Boundaries:**  
- Task 1: Selector/Button  
- Task 2: Helpers/Structure tip  
- Task 3: FDAR template logic  
- Task 4: Markdown renderer/section separation  
- Task 5: Documentation  
- Task 6: Validation & review

---

**Upon saving this plan:**  
Ready for execution by subagent-driven-development, with checkpoint/review protocol after each major chunk.
