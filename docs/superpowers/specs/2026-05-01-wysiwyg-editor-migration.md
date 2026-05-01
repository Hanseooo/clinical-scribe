# WYSIWYG Editor Migration Design Spec

- **Date**: 2026-05-01
- **Status**: Draft — Pending Review
- **Workstream**: WYSIWYG Editor Migration
- **Author**: AI Assistant
- **Owner**: Hans

## 1. Overview

Replace `@uiw/react-md-editor` with Tiptap v3 to provide a true rich-text editing experience for clinical staff. Markdown remains the source of truth, but users interact with it through a familiar WYSIWYG interface.

## 2. Background

### 2.1 Current Implementation

- **Editor**: `@uiw/react-md-editor` renders a split-pane markdown source editor.
- **Preview**: `react-markdown` + `SafetyHighlighter` renders the structured handover with safety warnings (numbers, units, times, `[UNCLEAR]`, `[VERIFY]`).
- **Flow**: `app-client.tsx` holds `handover` state (Markdown string) → `HandoverEditor` → Edit/Preview tabs.

### 2.2 Pain Point

Clinical staff see raw Markdown syntax (`#`, `*`, `-`, `|`) while editing. This creates cognitive load and intimidates non-technical users. The goal is to make editing feel like Google Docs or Notion.

## 3. Requirements

- **Primary**: Rich-text editing without exposing Markdown syntax by default.
- **Secondary**: Preserve ability to view/edit raw Markdown for edge cases.
- **Support**: Headings (H1–H3), bold, italic, bullet lists, ordered lists, tables.
- **Preserve**: Custom clinical tags (`[UNCLEAR: ...]`, `[VERIFY]`) must survive round-trips.
- **Non-breaking**: Existing `Preview` tab with `SafetyHighlighter` stays functional during migration.

## 4. Architecture

```
┌─────────────────────────────────────┐
│         HandoverEditor.tsx          │
│  ┌──────────┬─────────────────────┐ │
│  │  Edit    │      Preview        │ │
│  │  (Tiptap)│  (SafetyHighlighter)│ │
│  │          │                     │ │
│  │ [View    │                     │ │
│  │  Source] │                     │ │
│  └──────────┴─────────────────────┘ │
└─────────────────────────────────────┘
```

### 4.1 New/Modified Components

| File | Role |
|------|------|
| `src/features/editor/TiptapEditor.tsx` | Core Tiptap wrapper. Handles MD→Editor and Editor→MD conversion. `'use client'`. |
| `src/features/editor/TiptapToolbar.tsx` | Floating/fixed toolbar. Uses `EditorContext.Provider` + `useCurrentEditor`. |
| `src/features/editor/HandoverEditor.tsx` | Modified shell. Hosts Tiptap + View Source toggle + Preview tab. |
| `src/features/editor/SafetyHighlighter.tsx` | **Unchanged** in Phase 1. Still used in Preview tab. |
| `src/lib/safety/tiptapHighlightMark.ts` | **Phase 2 only.** Custom Tiptap Mark for inline safety warnings. |

### 4.2 Data Flow

1. `app-client.tsx` holds `handover` state (Markdown string).
2. On generation success, `handover` is passed to `<HandoverEditor value={handover} onChange={handleEditorChange} template={template}>`.
3. `TiptapEditor` initializes with `editor.commands.setContent(handover, { contentType: 'markdown' })`.
4. User edits trigger `editor.getMarkdown()` via a debounced `onUpdate` callback (300ms).
5. `HandoverEditor` propagates the new Markdown string to `app-client.tsx`, which sets `isDirty`.
6. "View Source" toggle swaps Tiptap for a read-only `<textarea>` showing raw `handover`.

## 5. Technology Choice: Tiptap v3

### 5.1 Why Tiptap?

- **Native Markdown**: Official `@tiptap/markdown` extension provides bidirectional parsing (MarkedJS) and serialization.
- **ProseMirror Core**: Battle-tested for complex documents.
- **React Integration**: `@tiptap/react` with `useEditor`, `EditorContext`, `useCurrentEditor`.
- **Extensibility**: Easy to add custom Nodes/Marks for clinical tags.

### 5.2 Why Not Alternatives?

- **Plate**: Slate-based, Notion-like. Markdown is secondary. Overkill.
- **Lexical**: Smaller ecosystem, less seamless Markdown support.
- **Novel**: Pre-built Tiptap wrapper with AI features. Too opinionated; conflicts with existing Gemini backend.
- **Milkdown**: Remark-based, but smaller community.

### 5.3 Installation

```bash
pnpm install @tiptap/react @tiptap/pm @tiptap/starter-kit @tiptap/markdown
```

## 6. SSR & Hydration

- `TiptapEditor.tsx` is `'use client'`.
- `useEditor({ immediatelyRender: false })` prevents hydration mismatches.
- Toolbar uses `EditorContext.Provider` + `useCurrentEditor` to avoid prop drilling.

## 7. Round-Trip Fidelity & Edge Cases

### 7.1 The Problem

`@tiptap/markdown` is beta. Complex tables and custom tags may not round-trip perfectly.

### 7.2 Mitigations

1. **View Source Toggle**: Always available as an escape hatch.
2. **Round-Trip Guard**: After `setContent` → `getMarkdown`, perform a strict equality check against the input. If not equal, auto-enable "View Source" and log to console (not Sentry, to avoid noise). This is a **boolean check**, not a threshold.
3. **Graceful Degradation**: Unknown tags fall back to plain text rather than being stripped.

### 7.3 Custom Tags Strategy

- **Phase 1**: `[UNCLEAR: ...]` and `[VERIFY]` remain plain text in Tiptap. They are visible as literal strings in the editor. This guarantees they survive round-trips.
- **Phase 2**: Build `UnclearNode` and `VerifyNode` custom extensions that render them as styled callout badges. These extensions define `renderMarkdown`, `parseMarkdown`, and `markdownTokenizer` hooks.

## 8. UI/UX Design

### 8.1 Editor Toolbar

Minimal, context-aware toolbar with only essential formatting:

- Heading dropdown (H1, H2, H3, Paragraph)
- Bold, Italic
- Bullet List, Ordered List
- Table (insert/remove)
- Undo, Redo

No Markdown syntax buttons.

### 8.2 View Source Toggle

- Small text link "View Source" below the editor, right-aligned.
- Clicking replaces Tiptap with a monospace `<textarea>` (read-only by default).
- To edit raw source, user clicks an "Enable Editing" button which triggers a `shadcn/ui AlertDialog` confirmation: "Editing raw Markdown may break formatting. Continue?"
- A "Back to Editor" link returns to WYSIWYG.

### 8.3 Styling

- Editor canvas: white background, 1px border, subtle shadow.
- Typography: Inter or system sans-serif, 16px base size.
- Line height: 1.6 for readability.
- Focus ring: 2px ring using `ring-primary` (shadcn pattern).

## 9. Migration Phases

### 9.1 Phase 1 (MVP)

- [ ] Install Tiptap dependencies.
- [ ] Create `TiptapEditor.tsx` with `StarterKit` + `Markdown`.
- [ ] Create `TiptapToolbar.tsx` with essential commands.
- [ ] Modify `HandoverEditor.tsx` to host Tiptap in Edit tab.
- [ ] Add "View Source" toggle.
- [ ] Wire `onChange` to `app-client.tsx` (same contract as today).
- [ ] Verify round-trip fidelity with sample handovers.
- [ ] Remove `@uiw/react-md-editor` dependency.

### 9.2 Phase 2 (Polish)

- [ ] Build `UnclearNode` and `VerifyNode` extensions.
- [ ] Migrate `SafetyHighlighter` to a Tiptap Mark extension for inline warnings.
- [ ] Evaluate removing `react-markdown` dependency.

## 10. Testing Strategy

- **Unit**: Round-trip fidelity. Input sample Markdown → `setContent` → `getMarkdown` → strict equality assertion.
- **Component**: Render `TiptapEditor`, simulate typing, assert `onChange` emits valid Markdown.
- **Edge Case**: Input with `[UNCLEAR: ...]`, tables, nested lists. Verify plain-text fallback.

## 11. Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Markdown extension mangles custom tags | Medium | High | "View Source" escape hatch; Phase 2 custom extensions. |
| SSR hydration errors | Low | Medium | `immediatelyRender: false`; `'use client'`. |
| Users accidentally corrupt tables in WYSIWYG | Low | High | Round-trip guard; View Source for complex tables. |

## 12. Open Questions

1. Should Phase 2 custom tags render as inline badges or block-level callouts?
2. Do we want collaborative editing (e.g., Y.js) in the future?

---

**Next Step:** Review this spec. If approved, proceed to implementation planning.