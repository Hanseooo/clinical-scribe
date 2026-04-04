# Architecture — ClinicalScribe v1

---

## System Overview

ClinicalScribe is a **stateless, single-page web application** built on Next.js 16.2.2 App Router. No database, no auth, no server-side state in v1. All processing is either client-side or handled by a single Next.js API route proxying to Gemini.

The architecture is **modality-agnostic after the input layer**. Audio and text inputs are normalised at the boundary (`inputAdapters.ts`) into a unified `ChainInput` type. Everything downstream — the LangChain chain, source panel, editor, export — operates on this unified type and does not branch on modality.

---

## Data Flow

```
┌──────────────────────────────────────────────────────────────┐
│  CLIENT                                                      │
│                                                              │
│  ┌─────────────────┐    ┌──────────────────┐                │
│  │  AudioRecorder  │    │   TextPanel      │                │
│  │  AudioUploader  │    │   (textarea)     │                │
│  └────────┬────────┘    └────────┬─────────┘                │
│           │ Blob                 │ string                   │
│           ▼                      │                          │
│  [ffmpeg.wasm Worker]            │                          │
│  → .wav 16kHz mono base64        │                          │
│           │                      │                          │
│           └──────────┬───────────┘                          │
│                      ▼                                       │
│            POST /api/generate                                │
│            { modality, audioBase64 | text,                  │
│              template, outputLanguage }                      │
└──────────────────────┬───────────────────────────────────────┘
                       │ HTTPS
┌──────────────────────▼───────────────────────────────────────┐
│  SERVER (Next.js API Route)                                  │
│                                                              │
│  inputAdapters.ts                                            │
│    → normalise request → ChainInput                          │
│           │                                                  │
│           ├─ modality: audio-* → generateFromAudio()         │
│           │     1. Upload to Gemini File API → fileUri       │
│           │     2. Prompt: transcribe + structure            │
│           │     3. Parse TRANSCRIPT: / HANDOVER:             │
│           │     4. Delete file from Gemini File API          │
│           │                                                  │
│           └─ modality: text → generateFromText()             │
│                 1. Prompt: structure only                    │
│                 2. Parse HANDOVER:                           │
│                 3. Echo input text as source                 │
│           │                                                  │
│           ▼                                                  │
│  Return { source, handover, modality, model }                │
└──────────────────────┬───────────────────────────────────────┘
                       │
┌──────────────────────▼───────────────────────────────────────┐
│  CLIENT — post-generation                                    │
│                                                              │
│  SourceViewer  ◄── source string (label driven by modality) │
│  HandoverEditor ◄── handover markdown string                 │
│    ├── Edit tab: raw markdown editor                         │
│    └── Preview tab: SafetyHighlighter (react-markdown)       │
│                                                              │
│  ExportBar                                                   │
│    ├── exportMd() → Blob download                            │
│    └── exportPdf() → window.print()                          │
└──────────────────────────────────────────────────────────────┘
```

---

## Feature Module Map

```
features/
├── input/               Owns: getting content into the app
│   ├── audio/           Owns: recording, uploading, converting audio
│   └── text/            Owns: textarea input, validation
├── generation/          Owns: API call, loading state, error state
├── source-viewer/       Owns: displaying raw source, contextual label
├── editor/              Owns: markdown editing, safety highlighting
├── export/              Owns: MD and PDF export
└── settings/            Owns: template selection, output language
```

Each feature module:
- Has no knowledge of other feature modules
- Communicates only via props or shared types in `types/index.ts`
- Is composed together in `app/page.tsx`

This means any feature can be replaced, refactored, or extracted independently.

---

## Component Composition (`app/page.tsx`)

`page.tsx` is the only file that knows about all features. It owns the top-level application state and wires features together via props.

```tsx
// app/page.tsx — state shape
const [template, setTemplate] = useState<TemplateId>('isbar')
const [outputLanguage, setOutputLanguage] = useState<OutputLanguage>('en')
const [inputPayload, setInputPayload] = useState<InputPayload | null>(null)
const [isGenerating, setIsGenerating] = useState(false)
const [generationResult, setGenerationResult] = useState<GenerationResult | null>(null)
const [handover, setHandover] = useState<string>('')
const [isDirty, setIsDirty] = useState(false)

// Composed:
<SettingsBar template={template} onTemplateChange={setTemplate} ... />
<InputPanel onSubmit={handleSubmit} isLoading={isGenerating} />
<SourceViewer result={generationResult} />
<HandoverEditor value={handover} onChange={handleEditorChange} />
<ExportBar value={handover} disabled={!handover} />
```

No prop drilling beyond one level — each feature receives only what it needs.

---

## Input Adapter Pattern

`src/lib/langchain/inputAdapters.ts` is the modularity seam for adding new input types.

```ts
export interface ChainInput {
  modality: InputModality
  audioFileUri?: string    // set for audio modalities after Gemini File API upload
  text?: string            // set for text modality
  template: HandoverTemplate
  outputLanguage: OutputLanguage
}

export async function adaptRequest(req: GenerateRequest): Promise<ChainInput> {
  if (req.modality === 'text') {
    return { modality: 'text', text: req.text, template, outputLanguage }
  }
  // audio: upload to Gemini File API first
  const fileUri = await uploadToGeminiFileApi(req.audioBase64)
  return { modality: req.modality, audioFileUri: fileUri, template, outputLanguage }
}
```

To add **PDF upload** in v2: add `modality: 'pdf-upload'` to `InputModality`, add an adapter branch that extracts text from the PDF, then routes to `generateFromText()`. Zero changes to the chain or UI below the adapter.

---

## LangChain Chain Design

```ts
// src/lib/langchain/handoverChain.ts

const model = new ChatGoogleGenerativeAI({
  model: 'gemini-2.5-flash',
  apiKey: process.env.GEMINI_API_KEY,
})

// Audio chain
const audioChain = RunnableSequence.from([
  buildAudioPrompt,       // PromptTemplate with fileUri + template sections
  model,
  new StringOutputParser(),
  parseAudioOutput,       // splits TRANSCRIPT: / HANDOVER:
])

// Text chain
const textChain = RunnableSequence.from([
  buildTextPrompt,        // PromptTemplate with text + template sections
  model,
  new StringOutputParser(),
  parseTextOutput,        // splits HANDOVER: only
])
```

Both chains return the same `ChainOutput` type:
```ts
interface ChainOutput {
  source: string     // transcript or echo of input text
  handover: string   // structured markdown
}
```

---

## Template System

```ts
// src/lib/templates/index.ts
export const TEMPLATES: Record<TemplateId, HandoverTemplate> = {
  isbar: isbarTemplate,
  sbar:  sbarTemplate,
  isobar: isobarTemplate,
}
export const DEFAULT_TEMPLATE: TemplateId = 'isbar'

// Adding a new template:
// 1. Create src/lib/templates/soap.ts
// 2. Add to TEMPLATES registry
// 3. Done — UI selector auto-populates from registry
```

---

## Safety Highlighting Architecture

Client-side, presentation layer only. Never mutates stored markdown.

```ts
// src/lib/safety/patterns.ts — shared source of truth
export const SAFETY_PATTERNS: SafetyPattern[] = [
  {
    pattern: /\b\d+(\.\d+)?\s*(mg|mcg|g|kg|ml|L|mmHg|bpm|°C|°F|%|mEq|IU|units?)\b/gi,
    className: 'warn-unit',
    priority: 1,
  },
  {
    pattern: /\b\d{1,3}\/\d{1,3}\b/g,
    className: 'warn-number',
    priority: 2,
  },
  {
    pattern: /\b\d+:\d{2}\b/g,
    className: 'warn-time',
    priority: 3,
  },
  {
    pattern: /\[(?:UNCLEAR|VERIFY)[^\]]*\]/gi,
    className: 'warn-verify',
    priority: 4,
  },
  {
    pattern: /\b\d+(\.\d+)?\b/g,
    className: 'warn-number',
    priority: 5,
  },
]
```

`SafetyHighlighter.tsx` uses this as a custom `react-markdown` text renderer — wraps matched spans in `<mark className={pattern.className}>`.

---

## Export Architecture

**Markdown**
```ts
// features/export/exportMd.ts
export function exportMd(content: string) {
  const blob = new Blob([content], { type: 'text/markdown' })
  const url = URL.createObjectURL(blob)
  triggerDownload(url, `handover-${Date.now()}.md`)
  URL.revokeObjectURL(url)
}
```

**PDF** — print-targeted CSS approach:
```css
/* public/print.css */
@media print {
  body > *:not(#print-target) { display: none; }

  @page {
    margin: 2cm;
    @bottom-center {
      content: "AI-generated draft — verify all values before clinical use";
      font-size: 9pt;
      color: #555;
    }
  }

  .warn-unit, .warn-number, .warn-time {
    font-weight: bold;
  }
  .warn-verify::before { content: "[VERIFY] "; font-weight: bold; }
}
```

---

## Vercel Constraints & Mitigations

| Constraint | Limit | Mitigation |
|---|---|---|
| Request body | 4.5MB default | Raise to 20MB in `next.config.js` |
| Function timeout | 10s (Hobby) | Gemini Flash typically < 10s. Soft cap audio at 10min. |
| Cold start | ~1-2s | Acceptable. Show loading state immediately on submit. |
| Concurrent requests | Limited on free | Single-user assumption for v1 |

---

## v2 Extension Points

| Feature | Where to add | Impact on existing code |
|---|---|---|
| PDF upload input | `features/input/pdf/` + adapter | None — new adapter branch only |
| Auth | `app/middleware.ts` + route guards | None to existing features |
| Firestore save | `features/generation/useGeneration.ts` post-success | Additive only |
| DOCX export | `features/export/exportDocx.ts` + button in `ExportBar` | Additive only |
| Streaming | Replace `route.ts` return with `StreamingTextResponse` | Editor needs stream consumer |
| New template | `src/lib/templates/newtemplate.ts` + registry entry | Zero changes elsewhere |
| New language | Add adapter in `inputAdapters.ts`, update prompt | Isolated |
