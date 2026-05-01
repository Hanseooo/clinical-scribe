# HITL Transcription Correction Design Spec

- **Date**: 2026-05-01
- **Status**: Draft — Pending Review
- **Workstream**: Human-in-the-Loop Transcription Correction
- **Author**: AI Assistant
- **Owner**: Hans

## 1. Overview

Introduce a pre-generation review step where clinical staff can correct low-confidence transcription segments before the final handover is generated. This improves accuracy for drug names, numbers, and words with similar pronunciations.

## 2. Background

### 2.1 Current Implementation

- Audio is recorded/uploaded → FFmpeg converts to WAV → base64 sent to `POST /api/generate`.
- Gemini transcribes and generates the handover in a **single call**.
- The user sees the final handover immediately. Any transcription errors must be manually corrected in the editor.

### 2.2 Pain Point

Voice inputs are often inaccurate for:
- Drug names with similar pronunciations ("metoprolol" vs "metformin").
- Numbers and units ("fifteen" vs "fifty").
- Code-switching (Filipino English + Tagalog/Bisaya).

By the time the user sees the handover, the error is embedded in the structured Markdown and harder to spot.

## 3. Requirements

- After audio input, present a **draft transcript** for review *before* generating the final handover.
- Flag **phrase-level segments** with low confidence.
- Provide 2–3 alternatives per flagged segment.
- Allow user to: select an alternative, type a custom correction, skip, or replay the audio segment.
- **Mandatory review**: If the transcript contains any flagged segments (confidence < 0.80), the review step is mandatory. Users cannot bypass it entirely. Individual suggestions can be skipped. If there are NO flagged segments, the review step is skipped automatically and generation proceeds immediately. When the user clicks "Generate Handover" after skipping one or more segments, a confirmation dialog appears: "You skipped N suggestions. These may contain errors. Proceed?"
- Mobile-first UX: bottom sheets, large touch targets.
- Non-breaking: existing single-pass audio generation (`POST /api/generate` with `modality: audio-*`) continues to work.

## 4. Architecture

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
│  │  • Highlighted uncertain phrases    │    │
│  │  • Tap phrase → Sheet/Popover       │    │
│  │  • Progress bar + Generate button   │    │
│  └─────────────────────────────────────┘    │
│                    ↓                        │
│      POST /api/generate (modality=text)     │
│                    ↓                        │
│           Final Handover (Markdown)         │
└─────────────────────────────────────────────┘
```

### 4.1 New API Endpoint

| Endpoint | Method | Input | Output |
|----------|--------|-------|--------|
| `/api/transcribe` | `POST` | `{ audio: base64, language? }` | `{ draftTranscript: DraftTranscript, model: string }` |

### 4.2 New/Modified Components

| File | Role |
|------|------|
| `src/app/api/transcribe/route.ts` | New API route. Uploads audio, calls `transcribeChain`, returns structured transcript. |
| `src/lib/langchain/transcribeChain.ts` | New chain. Prompts Gemini for JSON transcript with uncertainty markers. |
| `src/features/hitl/TranscriptReviewPanel.tsx` | Main review UI container. |
| `src/features/hitl/UncertaintyBadge.tsx` | Renders highlighted phrase + confidence indicator. |
| `src/features/hitl/CorrectionPopover.tsx` | Desktop popover with alternatives. |
| `src/features/hitl/CorrectionSheet.tsx` | Mobile bottom sheet with alternatives. |
| `src/features/hitl/useTranscriptReview.ts` | Hook managing review state, corrections map, progress. |
| `src/features/hitl/types.ts` | Domain types for segments, corrections, draft transcript. |

## 5. Segment Granularity

Segments are **phrase-level**, not word-level.

- A segment is a contiguous sequence of 1–5 words flagged by the AI.
- **Example**: `"was given metoprolol"` might be one segment, not three separate words.
- **Rationale**: Phrases provide context. "metoprolol" in isolation is ambiguous; "was given metoprolol" makes it clearly a drug administration.
- **Highlighting**: The entire phrase is underlined in amber. Clicking/tapping any word in the phrase opens the correction UI for that segment.

## 6. AI Prompt & Output Format

### 6.1 Prompt

```
You are a medical transcription assistant. Transcribe the following audio verbatim.

For each phrase in the transcript, assign a confidence score (0.0–1.0).
If confidence < 0.80, provide 2–3 alternative phrases that the speaker might have said.
Focus on: drug names, numbers, units, and words with similar pronunciations.

Return strict JSON matching this schema:
{
  "segments": [
    {
      "id": "seg_001",
      "text": "the full phrase text",
      "confidence": 0.95,
      "alternatives": [],
      "startTime": 0.0,
      "endTime": 2.5
    }
  ]
}

Use Filipino English and Tagalog/Bisaya code-switching context as needed.
```

### 6.2 Output Schema

```typescript
interface TranscriptSegment {
  id: string;           // e.g., "seg_001"
  text: string;         // The transcribed phrase
  confidence: number;   // 0.0–1.0
  alternatives: string[]; // Empty if confidence >= 0.80
  startTime?: number;   // Seconds from audio start
  endTime?: number;     // Seconds from audio start
}

interface DraftTranscript {
  segments: TranscriptSegment[];
}
```

## 7. Data Flow

1. User records/uploads audio.
2. Frontend calls `POST /api/transcribe` with base64 audio.
3. Backend uploads audio to Gemini File API, invokes `transcribeChain` with JSON mode.
4. Backend parses JSON and returns `DraftTranscript`.
5. Frontend enters `review` mode, rendering `TranscriptReviewPanel`.
6. User taps flagged phrases, selects alternatives or types custom text.
7. `useTranscriptReview` maintains a `CorrectionMap: Record<segmentId, correctedText>`.
8. User clicks "Generate Handover".
9. Frontend reconstructs the corrected transcript string by iterating segments and applying corrections.
10. Frontend calls `POST /api/generate` with `modality: 'text'` and `text: correctedTranscript`.
11. Existing text generation pipeline produces the final handover.

## 8. UI/UX Details (Mobile-First)

### 8.1 Transcript Display

- Segments render as inline text. Normal segments are plain black text.
- Flagged segments (confidence < 0.80) have an **amber underline** + a small `AlertTriangle` icon at the end of the phrase.
- All segments (flagged or not) have a small `Play` icon on the right side for audio replay. Flagged segments therefore display both `AlertTriangle` and `Play` icons side by side.
- A sticky header shows the audio filename/duration + a "Replay Full Audio" button.
- A sticky footer shows: `"Resolved 3 of 7"` + primary **"Generate Handover"** CTA.

### 8.2 Desktop: Correction Popover

- Clicking a flagged phrase opens a `shadcn/ui` **Popover** anchored to the phrase.
- Popover content:
  - Title: "Did you mean...?"
  - Alternatives as `shadcn/ui` **Button** (ghost variant, full width).
  - "Other..." button expands to a focused `<input>`.
  - "Skip" button (subtle, secondary).
- Clicking outside dismisses without applying.
- `Escape` key closes.

### 8.3 Mobile: Correction Sheet

- Tapping a flagged phrase opens a `shadcn/ui` **Sheet** (bottom sheet, 60–70% viewport height).
- Large touch targets (min 48px height) for alternatives.
- "Other..." expands inline to a text input with auto-focus and keyboard visible.
- "Skip" button at bottom.
- Swipe-down on sheet handle dismisses.
- Sheet does **not** close on backdrop tap (to prevent accidental dismissal).

### 8.4 Audio Replay

- Each segment has a small "Play" icon (right side of the phrase).
- Clicking seeks a hidden `<audio>` element to `segment.startTime` and plays until `segment.endTime`.
- If `startTime`/`endTime` are missing, play from 2 seconds before the segment's estimated position.

### 8.5 Progress & Mandatory Review

- Footer shows `"Resolved X of Y"`.
- **"Generate Handover"** is disabled until all flagged segments have been either corrected or explicitly skipped.
- When the user clicks **"Generate Handover"** after skipping one or more segments, show a `shadcn/ui AlertDialog` confirmation: `"You skipped N suggestions. These may contain errors. Proceed?"`.

## 9. State Management

### 9.1 Client-Side Only (MVP)

All review state is held in React state (`useTranscriptReview`). No server-side persistence.

**Rationale**: Simplicity. The review step is ephemeral — once the handover is generated, the draft transcript is discarded.

**Future Enhancement**: Persist draft transcripts to allow resuming review after page refresh.

### 9.2 State Shape

```typescript
interface CorrectionMap {
  [segmentId: string]: string; // corrected text
}

interface ReviewState {
  draft: DraftTranscript;
  corrections: CorrectionMap;
  skipped: Set<string>;
  isComplete: boolean; // true when all flagged segments are resolved
}
```

## 10. API Contract

### 10.1 `POST /api/transcribe`

```typescript
// Request
interface TranscribeRequest {
  audio: string;        // base64 WAV
  language?: 'en';
}

// Response
interface TranscribeResponse {
  draftTranscript: DraftTranscript;
  model: string;        // e.g., "gemini-2.5-flash"
}
```

### 10.2 `POST /api/generate` (Unchanged Contract)

Existing `modality: 'audio-record' | 'audio-upload' | 'text'` still works exactly as before.
When called with `modality: 'text'`, the `text` field may now contain a user-corrected transcript from the HITL flow.

**Note on legacy behavior:** The old single-pass audio flow (`modality: 'audio-record'` or `'audio-upload'`) remains available at the API level. The frontend will route all new audio uploads through the two-step flow (`/api/transcribe` → review → `/api/generate?modality=text`). The legacy direct path is kept for backward compatibility and emergency fallback.

## 11. Error Handling

- **Transcription failure**: Show inline error banner. Allow retry or fallback to single-pass generation.
- **No uncertain words**: Skip review step entirely, proceed directly to generation.
- **Gemini JSON parse failure**: Fallback to text parsing of `TRANSCRIPT:` block (same as current `parseAudioOutput`).
- **Audio replay failure**: Show toast: "Could not replay segment." (Non-blocking.)

## 12. Performance & Cost

- **Latency**: Two Gemini calls (transcribe + generate) add ~2–4 seconds vs. single call.
- **Cost**: Higher token usage, but transcription is cheaper than structured generation.
- **Optimization**: Consider adding `maxDuration` to `/api/transcribe` route.

## 13. Testing Strategy

- **Unit**: `useTranscriptReview` hook. Simulate selecting alternatives, typing custom text, skipping. Assert final reconstructed transcript.
- **Component**: Render `TranscriptReviewPanel` with mock `DraftTranscript`. Tap/click uncertain phrases. Assert Sheet/Popover opens and applies corrections.
- **Integration**: Mock `POST /api/transcribe` with MSW. Full flow: upload mock audio → review → generate handover.

## 14. Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Transcription confidence scoring is unreliable | Medium | Medium | Tune threshold (0.80); allow manual flagging in UI. |
| Two Gemini calls feels slow | Medium | Low | Skeleton loaders; progress indicators. |
| Mobile Sheet UX feels clunky | Low | Medium | Use Radix-based shadcn Sheet; test on real devices. |
| Clinical staff rush through review | Medium | High | Mandatory review + skip confirmation. |

## 15. Implementation Order

1. `transcribeChain.ts` + `POST /api/transcribe` route.
2. `useTranscriptReview` hook + `types.ts`.
3. `UncertaintyBadge` + `TranscriptReviewPanel` (desktop + mobile).
4. `CorrectionPopover` + `CorrectionSheet`.
5. Wire into `app-client.tsx` (new "Review" step between upload and generation).
6. E2E test with mock audio.

---

**Next Step:** Review this spec. If approved, proceed to implementation planning.