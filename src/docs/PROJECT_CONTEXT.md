# Project Context — ClinicalScribe

> For AI pair programming tools (OpenCode, Cursor, Copilot).
> Read this entire file before generating any code. It overrides generic instincts.

---

## What This Project Is

A Next.js 16.2.2 web app converting clinical handover recordings or typed text into structured ISBAR/SBAR/ISOBAR documents using Gemini 2.5 Flash. Primary user: Philippine nursing students.

Three input modalities: record audio, upload audio file, type/paste text.
One output: structured markdown with safety highlights, exportable as MD or PDF.

---

## Hard Constraints

1. **Free tier only.** `GEMINI_API_KEY` is the only external service. No paid APIs.
2. **Stateless v1.** No database, no auth, no server-side persistence. In-memory only.
3. **Client-side audio conversion.** ffmpeg.wasm in a Web Worker. Never on the main thread. Never server-side.
4. **No DOCX in v1.** MD and PDF export only.
5. **No streaming in v1.** API route returns full response synchronously.
6. **English output only in v1.** Language dropdown is UI-only; only English prompt implemented.
7. **App Router only.** No `getServerSideProps`, no `getStaticProps`, no Pages Router patterns.
8. **TypeScript strict.** No `any`. All types explicit.

---

## Folder Structure — Where Things Live

```
app/
  page.tsx              ← Root page. Composes all features. Owns top-level state.
  layout.tsx            ← Root layout, fonts, metadata
  api/generate/route.ts ← ONLY API route. POST only. Calls Gemini via LangChain.

features/               ← Self-contained feature modules. No cross-feature imports.
  input/
    InputPanel.tsx      ← Parent tabs: Audio | Text
    audio/
      AudioPanel.tsx    ← Sub-tabs: Record | Upload
      AudioRecorder.tsx ← MediaRecorder UI
      AudioUploader.tsx ← File drag-drop
      useAudioRecorder.ts
      converter.ts      ← ffmpeg.wasm wrapper, runs in Web Worker
    text/
      TextPanel.tsx     ← Textarea, char count, submit
      useTextInput.ts
  generation/
    useGeneration.ts    ← Calls /api/generate, manages loading/error/result state
    types.ts            ← GenerateRequest, GenerateResponse (feature-local)
  source-viewer/
    SourceViewer.tsx    ← Collapsible. Label = "Transcript" or "Source Text" by modality.
    useSourceLabel.ts
  editor/
    HandoverEditor.tsx  ← Tiptap v3 wrapper, Edit|Preview tabs
    SafetyHighlighter.tsx ← Custom react-markdown renderer with <mark> injection
    highlighter.ts      ← Applies lib/safety/patterns to rendered text
  export/
    ExportBar.tsx       ← MD and PDF export buttons
    exportMd.ts
    exportPdf.ts
  settings/
    SettingsBar.tsx     ← Template selector + language dropdown
    TemplateSelector.tsx
    OutputSettings.tsx

src/lib/                    ← Shared, no React, no JSX, no feature imports
  langchain/
    handoverChain.ts    ← Two chain functions: generateFromAudio, generateFromText
    inputAdapters.ts    ← Normalise request → ChainInput. ALL modality branching here. (path: `src/lib/langchain/inputAdapters.ts`)
  templates/
    index.ts            ← TEMPLATES registry + DEFAULT_TEMPLATE = 'isbar' (path: `src/lib/templates/index.ts`)
    isbar.ts / sbar.ts / isobar.ts
  safety/
    patterns.ts         ← SAFETY_PATTERNS array. Used by highlighter + prompts.

src/components/ui/          ← shadcn/ui only. Never hand-edit. Add via CLI.
hooks/
  useUnsavedWarning.ts  ← Used by page.tsx. beforeunload + dirty state dialog.
types/
  index.ts              ← Global types: TemplateId, OutputLanguage, InputModality, etc.
public/
  print.css             ← Print stylesheet for PDF export
```

---

## Key Types

```ts
// types/index.ts

export type TemplateId = 'sbar' | 'isbar' | 'isobar'
export type OutputLanguage = 'en'
export type InputModality = 'audio-record' | 'audio-upload' | 'text'

export interface HandoverTemplate {
  id: TemplateId
  name: string
  sections: string[]
  systemPrompt: string
  sectionInstructions: string
}

export interface GenerationResult {
  source: string          // raw transcript (audio) or echo of input text (text)
  handover: string        // structured markdown
  modality: InputModality // used to label the source panel
  model: string
}
```

---

## API Route Contract

`POST /api/generate`

**Audio request:**
```ts
{ modality: 'audio-record' | 'audio-upload', audioBase64: string, template: TemplateId, outputLanguage: OutputLanguage }
```

**Text request:**
```ts
{ modality: 'text', text: string, template: TemplateId, outputLanguage: OutputLanguage }
```

**Success response:**
```ts
{ source: string, handover: string, modality: InputModality, model: string }
```

**Error response:**
```ts
{ error: string, code: 'NO_SPEECH' | 'NO_CONTENT' | 'RATE_LIMIT' | 'TIMEOUT' | 'FORMAT_ERROR' | 'UNKNOWN' }
```

**Route config (top of route.ts):**
```ts
export const maxDuration = 60
export const dynamic = 'force-dynamic'
```

**next.config.js:**
```js
module.exports = {
  experimental: {
    serverActions: { bodySizeLimit: '20mb' }
  }
}
```

---

## LangChain Chain Pattern

```ts
// lib/langchain/handoverChain.ts

// Two exported functions, same return type
export async function generateFromAudio(input: AudioChainInput): Promise<ChainOutput>
export async function generateFromText(input: TextChainInput): Promise<ChainOutput>

interface ChainOutput {
  source: string    // transcript or echoed text
  handover: string  // markdown
}
```

Audio chain output parsing:
```ts
const [, rest] = raw.split('TRANSCRIPT:')
const [source, handover] = rest.split('HANDOVER:')
```

Text chain output parsing:
```ts
const [, handover] = raw.split('HANDOVER:')
const source = inputText  // echo back what was submitted
```

---

## Modularity Rules (enforce these in generated code)

1. **No cross-feature imports.** `features/editor` must not import from `features/input`.
2. **All modality branching in `inputAdapters.ts` only.** No `if modality === 'audio'` anywhere else.
3. **`page.tsx` is composition only.** No business logic. No direct API calls. Delegates to `useGeneration`.
4. **Hooks inside their feature folder** unless used by 2+ features (then `hooks/`).
5. **`lib/` is no-React.** No JSX, no hooks, no component imports.
6. **`components/ui/` is never hand-edited.** Use shadcn CLI.
7. **Types that cross features** go in `types/index.ts`. Feature-local types stay in the feature.

---

## Things AI Tools Commonly Get Wrong on This Project

1. **API key in client.** `GEMINI_API_KEY` is server-only. Only `app/api/generate/route.ts` reads it. Client never sees it.
2. **ffmpeg on main thread.** Always in a Web Worker. See `features/input/audio/converter.ts`.
3. **Modifying stored markdown for safety highlights.** Highlights are in `SafetyHighlighter.tsx` (render only). The `handover` string in state is never modified by highlighting.
4. **Export reads from AI output, not editor state.** Always export from current `handover` state (which includes student edits).
5. **Source panel label is modality-driven.** `"Transcript"` for audio, `"Source Text"` for text. Use `useSourceLabel` hook.
6. **Text modality skips transcription.** The text chain prompt does NOT include transcription instructions. Different prompt, different chain function.
7. **Pages Router patterns.** This is App Router. Use Server Components, Route Handlers, `use client` directive.
8. **Inline prompt strings.** Prompts live in `lib/templates/`. Not in `route.ts`, not in chain functions.

---

## UI Design Direction

**Aesthetic:** Clean clinical utility. Precision over decoration. Think a well-designed medical reference tool — not a startup SaaS dashboard.

**Color tokens (use as Tailwind config or CSS vars):**
```
background:     #FAFAF9   (warm off-white)
surface:        #FFFFFF   (card/panel)
border:         #E2E8F0   (slate-200)
text-primary:   #1C2B3A   (deep slate)
text-muted:     #64748B   (slate-500)
accent:         #0D9488   (teal-600)
accent-hover:   #0F766E   (teal-700)
warn-unit:      #FEF3C7   (amber-100)
warn-number:    #FEF9C3   (yellow-100)
warn-verify:    #FEE2E2   (red-100)
```

**Typography:**
- UI: `DM Sans` (Google Fonts)
- Markdown editor / monospace: `DM Mono`

**Principles:**
- No gradients. No heavy drop shadows. No decorative elements.
- Generous whitespace — clinical docs need breathing room.
- `rounded-lg` radius. `border border-slate-200` borders.
- Motion: subtle only — fade-in for generated content, spinner for loading. No playful animations.
- Density: medium. Not sparse, not dense.

---

## Development Environment

- **Editor:** VS Code
- **AI terminal tool:** OpenCode CLI (`opencode` command)
- **Package manager:** pnpm
- **Node version:** 18+

```bash
# Setup
pnpm install
pnpm dev

# Add shadcn component
npx shadcn-ui@latest add [component]

# Run with OpenCode
opencode   # in a separate terminal alongside VS Code
```

---

## Environment Variables

```env
# .env.local
GEMINI_API_KEY=your_key_from_aistudio.google.com
```

Get key: https://aistudio.google.com/app/apikey
