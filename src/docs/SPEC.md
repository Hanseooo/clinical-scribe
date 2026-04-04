# Feature Specification — ClinicalScribe v1

---

## 1. Input Modalities

There are three input modalities. They share a common output interface: `{ type: InputModality, content: string | Blob }`. The rest of the pipeline does not care which modality was used.

```ts
type InputModality = 'audio-record' | 'audio-upload' | 'text'

interface InputPayload {
  modality: InputModality
  content: Blob | string   // Blob for audio, string for text
}
```

---

## 2. User Flows

### Audio Flow (Record or Upload)
```
Select template + language settings
→ Audio tab → Record sub-tab OR Upload sub-tab
→ Record/select audio
→ [Client] ffmpeg.wasm converts to .wav (16kHz mono)
→ Submit → POST /api/generate { audioBase64, template, outputLanguage, modality: 'audio-*' }
→ Gemini: transcribe + structure in one call
→ Source panel labelled "Transcript" (collapsible, read-only)
→ Handover doc rendered in editor (Preview tab default)
→ Student edits in Edit tab
→ Safety highlights visible in Preview
→ Export MD or PDF
```

### Text Flow (Type / Paste)
```
Select template + language settings
→ Text tab → type or paste handover notes
→ Submit → POST /api/generate { text, template, outputLanguage, modality: 'text' }
→ Gemini: structure only (no transcription)
→ Source panel labelled "Source Text" (collapsible, shows the submitted text)
→ Handover doc rendered in editor (Preview tab default)
→ Student edits in Edit tab
→ Safety highlights visible in Preview
→ Export MD or PDF
```

---

## 3. UI Layout

```
┌──────────────────────────────────────────────────────┐
│  [Logo / App Name]                    [Settings ⚙️]  │
├──────────────────────────────────────────────────────┤
│  Template: [ISBAR ▼]     Output: [English ▼]         │
├──────────────────────────────────────────────────────┤
│  ┌────────────────────────────────────────────────┐  │
│  │  [🎵 Audio]          [✏️ Text]                  │  │  ← Parent tabs
│  │  ┌──────────────────────────────────────────┐  │  │
│  │  │  [🎙 Record]   [📁 Upload]               │  │  │  ← Audio sub-tabs (hidden in Text tab)
│  │  │  ┌────────────────────────────────────┐  │  │  │
│  │  │  │  Recording UI / Upload dropzone    │  │  │  │
│  │  │  │  OR Textarea (Text tab)            │  │  │  │
│  │  │  └────────────────────────────────────┘  │  │  │
│  │  └──────────────────────────────────────────┘  │  │
│  │  [Generate Handover ▶]                          │  │
│  └────────────────────────────────────────────────┘  │
├──────────────────────────────────────────────────────┤
│  ▼ Transcript / Source Text (collapsible)            │  ← label changes by modality
├──────────────────────────────────────────────────────┤
│  ┌────────────────────────────────────────────────┐  │
│  │  [Edit]   [Preview]                            │  │
│  │  ┌────────────────────────────────────────┐    │  │
│  │  │  Markdown editor / Highlighted preview │    │  │
│  │  └────────────────────────────────────────┘    │  │
│  └────────────────────────────────────────────────┘  │
├──────────────────────────────────────────────────────┤
│  ⚠️ Highlight legend        [Export MD] [Export PDF] │
└──────────────────────────────────────────────────────┘
```

---

## 4. Feature Specifications

### 4.1 Input Panel — Audio Tab

**Record sub-tab**
- `MediaRecorder` API, output MIME: `audio/webm`
- States: Idle → Recording (pulsing red dot) → Stopped
- Controls: Start Recording, Stop, Re-record (clears blob), Submit
- Max duration: 10 minutes (warning at 8 min, hard stop at 10 min)
- Playback: `<audio>` element shown after stopping — student reviews before submitting

**Upload sub-tab**
- Accepted: `.wav`, `.mp3`, `.m4a`, `.aac`, `.ogg`, `.flac`, `.webm`
- Max size: 50MB
- Drag-and-drop + click-to-browse
- File name + duration shown after selection
- Playback preview before submitting

**Shared audio behaviour**
- ffmpeg.wasm converts to `.wav` 16kHz mono before sending
- Conversion progress shown as loading state: *"Preparing audio…"*
- Estimated base64 size checked before sending — if > 18MB, show error

### 4.2 Input Panel — Text Tab

- Large `<textarea>` with monospace font (feels like a notes input, not a form)
- Placeholder: *"Paste or type the handover report here…"*
- Character count shown below (soft limit: 8000 chars with warning; hard limit: 12000)
- Min length: 50 characters (prevent empty/trivial submissions)
- Submit disabled if below min or above hard limit
- No audio conversion step — text is sent directly

### 4.3 API Route — `POST /api/generate`

**Request:**
```ts
// Audio modality
{
  modality: 'audio-record' | 'audio-upload'
  audioBase64: string         // .wav, 16kHz mono, base64-encoded
  template: TemplateId
  outputLanguage: OutputLanguage
}

// Text modality
{
  modality: 'text'
  text: string                // raw text, max 12000 chars
  template: TemplateId
  outputLanguage: OutputLanguage
}
```

**Response (success):**
```ts
{
  source: string              // raw transcript (audio) or echo of input text (text modality)
  handover: string            // structured markdown
  modality: InputModality     // echoed back — client uses this to label the source panel
  model: string
}
```

**Response (error):**
```ts
{
  error: string
  code: 'NO_SPEECH' | 'NO_CONTENT' | 'RATE_LIMIT' | 'TIMEOUT' | 'FORMAT_ERROR' | 'UNKNOWN'
}
```

**Route config:**
```ts
export const maxDuration = 60
export const dynamic = 'force-dynamic'
// Body size limit raised in next.config.js:
// api: { bodyParser: { sizeLimit: '20mb' } }
```

### 4.4 LangChain Chain — Dual Pipeline

```ts
// src/lib/langchain/handoverChain.ts

// Two separate chain functions, same output shape
export async function generateFromAudio(input: AudioChainInput): Promise<ChainOutput>
export async function generateFromText(input: TextChainInput): Promise<ChainOutput>
```

**Audio chain:**
1. Upload `.wav` to Gemini File API → `fileUri`
2. Prompt: transcribe + structure in one pass
3. Parse `TRANSCRIPT:` / `HANDOVER:` delimiters
4. Delete file from Gemini File API
5. Return `{ source: transcript, handover }`

**Text chain:**
1. No file upload needed
2. Prompt: structure the provided text (skip transcription instruction)
3. Parse `HANDOVER:` delimiter only (`SOURCE:` delimiter echoes back the input text)
4. Return `{ source: inputText, handover }`

**Input adapters** (`src/lib/langchain/inputAdapters.ts`) normalise the raw request into a typed `ChainInput` before any chain is invoked. The API route calls the adapter, then dispatches to the correct chain. This is the modularity seam — adding a new modality (e.g. PDF upload) means adding a new adapter and chain, not modifying existing ones.

### 4.5 Source Panel (formerly Transcript Viewer)

Component: `features/source-viewer/SourceViewer.tsx`

- Collapsible accordion panel
- Label is dynamic:
  - `modality === 'audio-*'` → **"Transcript"**
  - `modality === 'text'` → **"Source Text"**
- Read-only content area
- "Copy" button
- Only shown after a successful generation
- For text modality: shows the submitted text back to the user (confirmation of what was sent)

### 4.6 Handover Editor

- Library: `@uiw/react-md-editor`
- Tabs: **Edit** | **Preview** (default: Preview)
- Edit tab: full markdown editor toolbar + raw content
- Preview tab: rendered HTML + safety highlights applied via `SafetyHighlighter`
- State: single `handover` string in React state — single source of truth
- Export always reads from current state

### 4.7 Safety Highlighting

Post-processing in `SafetyHighlighter.tsx` — never modifies stored markdown.

Pattern priority (most specific first):

| Priority | Pattern | CSS Class | Colour |
|---|---|---|---|
| 1 | Numbers + clinical units (e.g. `10mg`, `2L`, `120/80`) | `warn-unit` | Amber |
| 2 | Time expressions (e.g. `08:30`, `2 hours`) | `warn-time` | Yellow |
| 3 | `[UNCLEAR: …]` / `[VERIFY: …]` AI flags | `warn-verify` | Red |
| 4 | Bare numbers (e.g. `15`, `0.5`) | `warn-number` | Yellow |

Legend shown below Preview at all times when generated content is present.

### 4.8 Export

**Markdown** — reads current editor state → `Blob` download as `handover-[timestamp].md`

**PDF** — `window.print()` with `print.css`:
- Hides all UI chrome
- Converts colour highlights to `[VERIFY]` bracketed bold text (ink-safe)
- Adds footer on every page: *"AI-generated draft — verify all values before clinical use"*
- Uses CSS `@page` for margins

### 4.9 Settings

**Template selector** — `shadcn/ui Select`, options: SBAR / ISBAR / ISOBAR, default ISBAR

**Output language** — `shadcn/ui Select`, options:
- English (active)
- Filipino — Tagalog (disabled, "Coming soon" tooltip)
- Auto-detect (disabled, "Coming soon" tooltip)

### 4.10 Unsaved Changes Warning

Hook: `hooks/useUnsavedWarning.ts`
- `isDirty` = true when editor content has been modified after generation
- `isDirty` resets to false on successful export
- `window.beforeunload` fires when `isDirty === true`
- In-app: "Generate new" / "Re-record" actions check `isDirty` → `shadcn/ui AlertDialog` confirmation with "Export first" and "Discard" actions

---

## 5. Error States

| Scenario | Code | UI Response |
|---|---|---|
| Gemini API error | `UNKNOWN` | Toast + retry button |
| No speech in audio | `NO_SPEECH` | Inline state: "No speech detected. Try again." |
| Text too short | `NO_CONTENT` | Inline validation, submit disabled |
| Rate limit (429) | `RATE_LIMIT` | Toast: "Limit reached, try again shortly" |
| Timeout | `TIMEOUT` | Toast: "Took too long. Try a shorter input." |
| Format parse error | `FORMAT_ERROR` | Toast + raw response shown for manual recovery |
| File too large | — | Client-side, pre-upload |
| Unsupported file | — | Client-side, on file selection |
| Browser no MediaRecorder | — | Record tab hidden, Upload-only shown |
| Network offline | — | Toast: "No connection. Check your network." |

---

## 6. Non-Functional Requirements

| Requirement | Target |
|---|---|
| Audio conversion time | < 5s for recordings ≤ 5 min |
| AI generation time (audio) | < 15s |
| AI generation time (text) | < 8s |
| Mobile responsiveness | Yes — single-column stacked layout |
| Accessibility | shadcn/ui ARIA baseline; keyboard navigation |
| Browser support | Chrome, Edge, Firefox, Safari (latest 2 versions) |
| No server-side persistence | All state in-memory per session |
| TypeScript strict mode | Enforced — no `any` |
