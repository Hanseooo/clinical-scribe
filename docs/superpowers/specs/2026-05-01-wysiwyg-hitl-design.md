# Clinical Scribe Design Spec

- **Date**: 2026-05-01
- **Status**: Draft — Pending Review
- **Related Workstreams**: WYSIWYG Editor Migration, HITL Transcription Correction
- **Author**: AI Assistant
- **Owner**: Hans

## 1. Overview & Goals

This spec covers two independent workstreams for the Clinical Scribe application:

1. **WYSIWYG Editor Migration**: Replace `@uiw/react-md-editor` with Tiptap v3 to reduce cognitive load for clinical staff who are not familiar with Markdown syntax.
2. **HITL Transcription Correction**: Introduce a human-in-the-loop step after audio transcription to improve accuracy for low-confidence words, homophones, and words with similar pronunciations.

Both workstreams are non-breaking additions. Existing audio/text → handover generation remains functional.

## 2. Background

### 2.1 Current Stack

- **Editor**: `@uiw/react-md-editor` (Edit tab) + `react-markdown` (Preview tab).
- **AI Backend**: Langchain + Gemini 2.5 Flash. Single-call audio pipeline: upload audio → Gemini returns `TRANSCRIPT` + `HANDOVER`.
- **Voice Mode**: `MediaRecorder` → FFmpeg Web Worker → Base64 WAV → `POST /api/generate`.
- **UI**: Next.js 16, React 19, TypeScript, TailwindCSS v4, shadcn/ui.

### 2.2 Pain Points

1. **Cognitive Load**: Clinical staff see raw Markdown syntax while editing. This is intimidating for non-technical users.
2. **Transcription Accuracy**: Voice inputs in clinical settings often involve drug names with similar pronunciations (e.g., "metoprolol" vs "metformin"). The current single-pass generation offers no chance for user correction before the handover is finalized.

## 3. Workstream 1: WYSIWYG Editor Migration

### 3.1 Requirements

- Provide a rich-text editing experience where users never see Markdown syntax by default.
- Preserve the ability to view and edit raw Markdown for edge cases.
- Support the full range of clinical formatting: headings, lists, tables, bold/italic, and custom tags (`[UNCLEAR: ...]`, `[VERIFY]`).
- Maintain the existing Edit/Preview tab structure, but replace the editor component.
- Ensure round-trip fidelity: Markdown in → edit → Markdown out must not silently corrupt clinical data.

### 3.2 Architecture

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

**New/Modified Components:**

| File | Role |
|------|------|
| `src/features/editor/TiptapEditor.tsx` | Core Tiptap wrapper. Handles MD→Editor and Editor→MD conversion. |
| `src/features/editor/TiptapToolbar.tsx` | Floating/fixed toolbar for formatting commands. |
| `src/features/editor/HandoverEditor.tsx` | Modified shell. Hosts Tiptap + View Source toggle + Preview tab. |
| `src/features/editor/SafetyHighlighter.tsx` | **Unchanged** for Phase 1. Still used in Preview tab. |
| `src/lib/safety/tiptapHighlightMark.ts` | **Phase 2 only.** Custom Tiptap Mark for inline safety warnings. |

### 3.3 Data Flow

1. `app-client.tsx` holds `handover` state (Markdown string).
2. On generation success, `handover` is passed to `<HandoverEditor value={handover} onChange={handleEditorChange}>`.
3. `TiptapEditor` initializes with `editor.commands.setContent(handover, { contentType: 'markdown' })`.
4. User edits trigger `editor.getMarkdown()` via a debounced `onUpdate` callback.
5. `HandoverEditor` propagates the new Markdown string to `app-client.tsx`, which sets `isDirty`.
6. "View Source" toggle swaps Tiptap for a read-only `<textarea>` showing raw `handover`.

### 3.4 Technology Choice: Tiptap v3

**Why Tiptap?**

- Native bidirectional Markdown support via `@tiptap/markdown` (official extension).
- ProseMirror-based = battle-tested for complex document editing.
- Excellent React integration (`@tiptap/react`).
- Large extension ecosystem; easy to add custom Nodes/Marks for clinical tags.

**Why not Plate, Lexical, Novel, or Milkdown?**

- **Plate**: Great, but built on Slate and primarily targets Notion-like block editors. Markdown is secondary.
- **Lexical**: Modern, but smaller ecosystem and less seamless Markdown support than Tiptap.
- **Novel**: Pre-built Tiptap wrapper with AI autocompletion. Too opinionated; conflicts with existing Gemini backend.
- **Milkdown**: Remark-based, but smaller community and fewer pre-built extensions.

**Installation:**

```bash
pnpm install @tiptap/react @tiptap/pm @tiptap/starter-kit @tiptap/markdown
```

### 3.5 SSR & Hydration

Tiptap requires the DOM. In Next.js App Router:

- Mark `TiptapEditor.tsx` as `'use client'`.
- Pass `immediatelyRender: false` to `useEditor` to prevent hydration mismatches.
- Use `EditorContext.Provider` + `useCurrentEditor` to decouple toolbar from editor tree.

### 3.6 Round-Trip Fidelity & Edge Cases

**Challenge:** `@tiptap/markdown` is beta. Complex tables and custom tags may not round-trip perfectly.

**Mitigations:**

1. **View Source Toggle**: Always available as an escape hatch.
2. **Round-Trip Guard**: After `setContent` → `getMarkdown`, compare output to input. If divergence > threshold, auto-enable View Source and log.
3. **Custom Extensions (Phase 2)**: Build `UnclearNode` and `VerifyNode` extensions so `[UNCLEAR: ...]` and `[VERIFY]` are native document nodes, not plain text.
4. **Graceful Degradation**: Unknown tags fall back to plain text rather than being stripped.

### 3.7 Migration Phases

**Phase 1 (MVP):**
- Replace `@uiw/react-md-editor` with Tiptap + `@tiptap/markdown`.
- Keep Preview tab with existing `react-markdown` + `SafetyHighlighter`.
- Add "View Source" toggle.
- Remove `@uiw/react-md-editor` dependency.

**Phase 2 (Polish):**
- Migrate `SafetyHighlighter` logic into a Tiptap Mark extension for inline warnings while editing.
- Optionally remove `react-markdown` dependency if Preview is no longer needed.

### 3.8 UI/UX Design Principles

- **Minimalism**: Toolbar shows only essential formatting (headings, bold, italic, lists, table). No Markdown syntax buttons.
- **Familiarity**: Layout resembles Google Docs/Notion to reduce training time.
- **Safety**: "View Source" is visually subtle but always accessible. Warning colors (amber/red) match existing Preview tab conventions.

## 4. Workstream 2: HITL Transcription Correction

### 4.1 Requirements

- After audio input, present a **draft transcript** for user review *before* generating the final handover.
- Flag low-confidence words/phrases with alternatives.
- Allow user to select an alternative, type a custom correction, or skip.
- Mobile-first UX: bottom sheets, large touch targets, thumb-friendly interactions.
- Non-breaking: existing single-pass audio generation continues to work.

### 4.2 Architecture

```
┌─────────────────────────────────────────────┐
│              Audio Upload / Record          │
│                    ↓                        │
│         POST /api/transcribe                │
│                    ↓                        │
│         DraftTranscript (JSON)              │
│                    ↓                        │
│  ┌─────────────────────────────────────┐    │
│  │      TranscriptReviewPanel          │    │
│  │  • Highlighted uncertain words      │    │
│  │  • Tap word → Sheet/Popover         │    │
│  │  • Progress bar + Generate button   │    │
│  └─────────────────────────────────────┘    │
│                    ↓                        │
│      POST /api/generate (modality=text)     │
│                    ↓                        │
│           Final Handover (Markdown)         │
└─────────────────────────────────────────────┘
```

**New Endpoints:**

| Endpoint | Method | Input | Output |
|----------|--------|-------|--------|
| `/api/transcribe` | `POST` | `{ audio: base64, templateId }` | `{ draftTranscript: TranscriptSegment[] }` |

**New/Modified Components:**

| File | Role |
|------|------|
| `src/app/api/transcribe/route.ts` | New API route. Handles audio upload, Gemini transcription with structured output. |
| `src/lib/langchain/transcribeChain.ts` | New chain. Prompts Gemini for transcript with uncertainty markers + alternatives. |
| `src/features/hitl/TranscriptReviewPanel.tsx` | Main review UI container. |
| `src/features/hitl/UncertaintyBadge.tsx` | Renders highlighted word + confidence indicator. |
| `src/features/hitl/CorrectionPopover.tsx` | Desktop popover with alternatives. |
| `src/features/hitl/CorrectionSheet.tsx` | Mobile bottom sheet with alternatives. |
| `src/features/hitl/useTranscriptReview.ts` | Hook managing review state, corrections map, progress. |
| `src/features/hitl/types.ts` | Domain types for segments, corrections, draft transcript. |

### 4.3 AI Prompt & Output Format

The transcription prompt should request a structured JSON response using Gemini's JSON mode / `response_schema`.

**Desired Output Schema:**

```json
{
  "draftTranscript": {
    "segments": [
      {
        "id": "seg_001",
        "text": "Patient was given metoprolol",
        "confidence": 0.95,
        "alternatives": [],
        "startTime": 0.0,
        "endTime": 2.5
      },
      {
        "id": "seg_002",
        "text": "metoprolol",
        "confidence": 0.62,
        "alternatives": ["metformin", "metroprolol"],
        "startTime": 2.5,
        "endTime": 3.8
      }
    ]
  }
}
```

**Prompt Instructions for Gemini:**

- Transcribe the audio verbatim.
- For each word/phrase, estimate confidence (0.0–1.0).
- If confidence < 0.80, provide 2–3 alternatives (common homophones, similar drug names, phonetic variants).
- Return strict JSON matching the schema above.
- Use Filipino English and Tagalog/Bisaya code-switching context as per existing prompts.

### 4.4 Data Flow

1. User records/uploads audio.
2. Frontend calls `POST /api/transcribe` with base64 audio.
3. Backend uploads audio to Gemini File API, invokes `transcribeChain` with JSON mode.
4. Backend parses structured transcript and returns to frontend.
5. Frontend enters `review` mode, rendering `TranscriptReviewPanel`.
6. User taps flagged words, selects alternatives or types custom text.
7. `useTranscriptReview` maintains a `CorrectionMap: Record<segmentId, correctedText>`.
8. User clicks "Generate Handover".
9. Frontend reconstructs the corrected transcript string from `CorrectionMap`.
10. Frontend calls `POST /api/generate` with `modality: 'text'` and `text: correctedTranscript`.
11. Existing text generation pipeline produces the final handover.

### 4.5 UI/UX Details (Mobile-First)

**Desktop:**
- Uncertain words have an amber underline + small warning icon.
- Clicking opens a `shadcn/ui` **Popover** anchored to the word.
- Popover shows alternatives as buttons + "Other..." button.
- "Other..." expands to a focused text input.
- Clicking outside dismisses without applying.

**Mobile:**
- Uncertain words have the same amber underline + warning icon.
- Tapping opens a `shadcn/ui` **Sheet** (bottom sheet, 60–70% height).
- Large touch targets (min 44px) for alternatives.
- "Other..." expands inline to a text input with auto-focus and keyboard visible.
- Swipe-down on sheet handle dismisses.
- Sticky footer shows progress ("Resolved 3 of 7") + primary "Generate Handover" CTA.

**Accessibility:**
- All interactive elements have `aria-label`.
- Focus is trapped in Sheet/Popover while open.
- `Escape` key closes overlays.

### 4.6 Replaying Audio Segments

Each uncertain segment has a small "Play" icon. Clicking it seeks the hidden `<audio>` element to the segment's `startTime` and plays. This helps users verify pronunciation.

**Implementation:**
- Store the original audio Blob in `useTranscriptReview` state.
- Use a ref to the `<audio>` element.
- `audio.currentTime = segment.startTime; audio.play()`.

### 4.7 State Management

```typescript
// src/features/hitl/types.ts

interface TranscriptSegment {
  id: string;
  text: string;
  confidence: number;
  alternatives: string[];
  startTime?: number;
  endTime?: number;
}

interface DraftTranscript {
  segments: TranscriptSegment[];
}

interface CorrectionMap {
  [segmentId: string]: string; // corrected text
}

interface ReviewState {
  draft: DraftTranscript;
  corrections: CorrectionMap;
  skipped: Set<string>;
  isComplete: boolean;
}
```

### 4.8 API Contract

**`POST /api/transcribe`**

```typescript
// Request
interface TranscribeRequest {
  audio: string; // base64 WAV
  templateId: string;
  language?: 'en';
}

// Response
interface TranscribeResponse {
  draftTranscript: DraftTranscript;
  model: string;
}
```

**`POST /api/generate` (Modified)**

No breaking changes. Existing `modality: 'audio-record' | 'audio-upload' | 'text'` still works.
When called with `modality: 'text'`, the `text` field may now contain a user-corrected transcript from the HITL flow.

### 4.9 Error Handling

- **Transcription failure**: Show inline error banner. Allow retry or fallback to single-pass generation.
- **No uncertain words**: Skip review step entirely, proceed directly to generation.
- **User skips all**: Use best-guess transcript. Show a subtle banner: "Skipped 5 suggestions. Please review the handover carefully."
- **Gemini JSON parse failure**: Fallback to text parsing of `TRANSCRIPT:` block.

### 4.10 Performance & Cost

- **Latency**: Two Gemini calls (transcribe + generate) add ~2–4 seconds vs. single call.
- **Cost**: Slightly higher token usage, but transcription tokens are cheap relative to structured handover generation.
- **Offline**: Not supported. Both calls require Gemini API connectivity.

## 5. Integration Points

### 5.1 Between Workstreams

These workstreams are **independent**.

- WYSIWYG migration affects `src/features/editor/` and `app-client.tsx`.
- HITL affects `src/features/hitl/`, `src/app/api/transcribe/`, and `src/lib/langchain/`.
- They can be developed, tested, and deployed in either order.

### 5.2 Shared Dependencies

| Dependency | Workstream | Note |
|------------|------------|------|
| `@tiptap/react` | WYSIWYG | New. |
| `@tiptap/markdown` | WYSIWYG | New. |
| `@tiptap/starter-kit` | WYSIWYG | New. |
| `shadcn/ui` Sheet | HITL | Already installed. |
| `shadcn/ui` Popover | HITL | Already installed. |
| `lucide-react` | Both | Already installed. |

## 6. Testing Strategy

### 6.1 WYSIWYG

- **Unit**: Round-trip fidelity tests. Input a sample clinical handover Markdown → `setContent` → `getMarkdown` → assert equality.
- **Component**: Render `TiptapEditor`, simulate typing, assert `onChange` emits valid Markdown.
- **Edge Case**: Input containing `[UNCLEAR: ...]`, tables, nested lists. Verify graceful degradation.

### 6.2 HITL

- **Unit**: `useTranscriptReview` hook. Simulate selecting alternatives, typing custom text, skipping. Assert final reconstructed transcript.
- **Component**: Render `TranscriptReviewPanel` with mock `DraftTranscript`. Tap/click uncertain words. Assert Sheet/Popover opens and applies corrections.
- **Integration**: Mock `POST /api/transcribe` with MSW. Full flow: upload mock audio → review → generate handover.

## 7. Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Tiptap Markdown extension mangles custom tags | Medium | High | "View Source" escape hatch; custom extensions in Phase 2. |
| Transcription confidence scoring is unreliable | Medium | Medium | Tune threshold (0.80); allow user to manually flag words. |
| Mobile Sheet UX feels clunky | Low | Medium | Use shadcn/ui Sheet (Radix-based); test on real devices. |
| Two Gemini calls feels slow | Medium | Low | Add loading skeletons; consider streaming for transcription. |
| Clinical staff ignore HITL step | Medium | High | Make it mandatory (can't skip all); show accuracy warning. |

## 8. Implementation Order

1. **HITL API layer** (`/api/transcribe`, `transcribeChain.ts`).
2. **HITL UI** (`TranscriptReviewPanel`, `CorrectionSheet`, `useTranscriptReview`).
3. **WYSIWYG Phase 1** (`TiptapEditor`, `TiptapToolbar`, replace `@uiw/react-md-editor`).
4. **WYSIWYG Phase 2** (custom extensions for `[UNCLEAR]` / `[VERIFY]`, inline safety highlighting).
5. **Cleanup** (remove old dependencies, update tests, update docs).

## 9. Open Questions

1. Should the HITL review step be mandatory, or can users opt out entirely?
2. For WYSIWYG Phase 2, do we want to render `[UNCLEAR: ...]` as a styled callout block or inline badge?
3. Should we persist draft transcripts and corrections to the database, or keep them purely client-side?

---

**Next Step:** Review this spec. If approved, we will proceed to write the implementation plan using `writing-plans`.