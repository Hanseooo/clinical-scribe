# Modularity Guide — ClinicalScribe

> This document defines the structural philosophy of this codebase. Follow these rules consistently to keep the project refactorable as it grows. Read this before adding any new file or feature.

---

## Why This Matters

This project is designed to grow: more input types, auth, storage, new templates, new export formats. Without a clear structure, every addition creates coupling that makes the next addition harder. The rules here are chosen specifically to keep each feature independently replaceable.

---

## The Core Principle: Boundary Over Coupling

Every module should be replaceable without touching its neighbours. The way to achieve this is to define **clear boundaries** — the interface between modules — and keep the internals of each module private.

In practice: **no feature should import from another feature.**

```
✅ features/editor imports from lib/safety/patterns
✅ features/export imports from types/index
❌ features/editor imports from features/input
❌ features/export imports from features/generation
```

If two features need to share something, it belongs in `src/lib/` or `src/types/` — not in either feature.

---

## Folder Roles

### `features/`
Each folder is a self-contained vertical slice of functionality.

```
features/
├── input/          What goes in (audio record, audio upload, text)
├── generation/     The AI call (useGeneration hook + types)
├── source-viewer/  Displaying raw source content
├── editor/         Markdown editing + safety highlighting
├── export/         Exporting finished docs
└── settings/       User-configurable settings
```

Rules for feature folders:
- A feature folder owns its UI components, hooks, local utilities, and local types
- It exports only what other parts of the app need (usually just the top-level component and any shared types)
- It imports only from `src/lib/`, `src/types/`, `src/components/ui/`, or its own subfolders
- Hooks that are only used within one feature live inside that feature folder, not in `hooks/`

### `src/lib/`
Shared infrastructure with no UI and no React.

```
src/lib/
├── langchain/      AI chain logic and input adapters
├── templates/      Handover template configs and registry
└── safety/         Safety highlight regex patterns
```

Rules for `lib/`:
- No React components, no hooks, no JSX
- No imports from `features/`
- Pure functions and configuration objects only
- Everything here should be independently testable

### `src/components/ui/`
shadcn/ui generated components only. Never hand-edit these files. Add new components via the CLI:

```bash
npx shadcn-ui@latest add [component-name]
```

### `hooks/`
Only for hooks that are used by **multiple** features. Currently:
- `useUnsavedWarning.ts` — used by the page-level orchestrator

If a hook is only used within one feature, it lives in that feature's folder.

### `types/`
Global shared TypeScript types only — types that cross feature boundaries.

```ts
// types/index.ts
export type TemplateId = 'sbar' | 'isbar' | 'isobar'
export type OutputLanguage = 'en'
export type InputModality = 'audio-record' | 'audio-upload' | 'text'

export interface GenerationResult {
  source: string
  handover: string
  modality: InputModality
  model: string
}
```

Do not put feature-local types here. If a type is only used within one feature, define it in that feature's `types.ts`.

### `app/page.tsx`
The only file that composes features together. It:
- Owns top-level application state
- Passes props down to features
- Handles the `useGeneration` hook's callbacks
- Does not contain any business logic — delegates to features and lib

Think of it as the conductor: it knows what everyone plays, but doesn't play any instrument itself.

---

## The Input Adapter Pattern

This is the most important modularity pattern in this project. It isolates the complexity of adding new input modalities.

```
New input modality checklist:
1. Add feature folder: features/input/[new-type]/
2. Add InputModality type: types/index.ts
3. Add adapter: lib/langchain/inputAdapters.ts
4. Wire into InputPanel: features/input/InputPanel.tsx
5. Done — nothing else changes
```

The adapter is the **seam**. Everything downstream (the chain, the source viewer, the editor, the export) operates on `ChainInput` and `GenerationResult` — they never see the raw input.

---

## Adding a New Feature (checklist)

When adding something that doesn't fit into an existing feature:

```
1. Create: features/[new-feature]/
2. Define: what this feature exports (its public surface area)
3. Define: what this feature needs (props from page.tsx or lib/)
4. Build: components, hooks, utilities — all inside the feature folder
5. Wire: only in app/page.tsx
6. Check: does anything in lib/ need to be created or extended?
7. Update: docs/ARCHITECTURE.md v2 extension points
```

Never add a new feature by modifying the internals of an existing feature unless there's no other way.

---

## Adding a New Template

Templates are the simplest extension point:

```
1. Create: lib/templates/[name].ts
2. Implement: HandoverTemplate interface
3. Add to: lib/templates/index.ts TEMPLATES registry
4. Add prompt: docs/PROMPTS.md
5. Done — UI selector auto-populates, chain auto-uses correct prompt
```

---

## Adding a New Export Format

```
1. Create: features/export/export[Format].ts
2. Add button: features/export/ExportBar.tsx
3. Done — no other files change
```

---

## State Management Rules

v1 uses React `useState` only. Rules:

- **Feature-local state** lives inside the feature component or its hook
- **Cross-feature state** (template, language, generation result, editor content) lives in `app/page.tsx`
- **Never use Context** for state that only one feature cares about
- **If state is needed in 3+ features** and prop drilling is becoming painful, introduce Zustand — but only then

Migration to Zustand in v2 is straightforward because all cross-feature state is already centralised in `page.tsx`. Extract it to a Zustand store, replace `useState` calls, update props.

---

## File Naming Conventions

| Type | Convention | Example |
|---|---|---|
| React components | PascalCase | `HandoverEditor.tsx` |
| Hooks | camelCase with `use` prefix | `useAudioRecorder.ts` |
| Utilities / lib | camelCase | `exportMd.ts`, `highlighter.ts` |
| Config / data | camelCase | `isbar.ts`, `patterns.ts` |
| Types files | `types.ts` per feature, `index.ts` globally | `features/generation/types.ts` |

---

## What Counts as Tech Debt Here

These patterns create tech debt — avoid them:

| Anti-pattern | Why it's debt | Fix |
|---|---|---|
| Feature importing from another feature | Creates coupling; can't refactor one without the other | Move shared code to `lib/` or `types/` |
| Business logic in `page.tsx` | Page becomes unmaintainable as features grow | Move logic into the owning feature |
| Inline prompt strings in `route.ts` | Prompts need iteration; mixing with routing code = tangled changes | Keep prompts in `lib/templates/` |
| Modality branches scattered across the codebase | Every new modality requires hunting down every branch | All modality branching happens in `inputAdapters.ts` only |
| Large components (> 200 lines) | Hard to test, hard to read, hard to refactor | Split into smaller components or extract logic to a hook |
| `any` types | Defeats TypeScript; hides bugs | Always define explicit types |

---

## When to Break These Rules

These rules exist to reduce friction, not to be a bureaucracy. It's acceptable to break them when:

- A strict separation would require 3× more code for no real gain
- You're in a prototype/exploratory phase — mark it with a `// TODO: refactor` comment
- The project is so small that the abstraction is overkill

But document the deviation and why. The goal is a codebase where the *next* thing you build is easier than the last, not one where the rules are followed for their own sake.
