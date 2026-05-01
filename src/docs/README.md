# ClinicalScribe — AI-Powered Clinical Handover Generator

A web application that converts voice recordings or typed/pasted text of clinical handovers into structured, formatted handover documents using AI. Designed primarily for nursing students in the Philippines but applicable to any clinical or allied health education context.

---

## What It Does

1. Student or instructor provides input via one of three modalities:
   - **Record** — in-browser microphone recording
   - **Upload Audio** — upload an existing audio file
   - **Type / Paste Text** — directly type or paste a handover transcript
2. Input is processed by Gemini 2.5 Flash:
   - Audio → transcribed + structured in a single call
   - Text → structured directly (no transcription step)
3. A formatted handover document is generated in the selected template (SBAR / ISBAR / ISOBAR)
4. The document renders as editable Markdown with safety warnings highlighted
5. Student reviews, edits, and exports as **Markdown** or **PDF**

---

## Tech Stack

| Layer | Choice | Reason |
|---|---|---|
| Framework | Next.js 16.2.2 (App Router) | Full-stack, Vercel-native |
| AI Orchestration | LangChain.js | Familiar to dev, clean chain abstraction |
| AI Model | Gemini 2.5 Flash (AI Studio) | Free tier, native audio + text input |
| UI Components | shadcn/ui + Tailwind CSS | Headless, composable, accessible |
| Markdown Editor | Tiptap v3 | WYSIWYG rich-text editing with Markdown as source of truth |
| PDF Export | Browser `window.print()` + print CSS | Zero dependencies, reliable |
| MD Export | Native `Blob` download | No library needed |
| Audio (client) | Web Audio API + MediaRecorder | In-browser recording |
| Audio conversion | `ffmpeg.wasm` (client-side) | Convert `.webm` → `.wav` before sending |
| Hosting | Vercel (free tier) | Seamless Next.js deployment |
| Dev tooling | OpenCode CLI + VS Code | AI-assisted terminal-first development |
| Storage (future) | Vercel Blob | For large audio files beyond base64 limit |
| Auth (future) | Firebase Auth | Deferred to v2 |
| DB (future) | Firestore | Deferred to v2 |

---

## Handover Templates

Four templates supported in v1. **FDAR is the default as of 2024.**

| Template | Sections |
|---|---|
| SBAR | Situation, Background, Assessment, Recommendation |
| ISBAR | Identity, Situation, Background, Assessment, Recommendation |
| ISOBAR | Identity, Situation, Observations, Background, Assessment, Recommendation |

Templates are isolated config objects in `src/lib/templates/`. Adding a new template requires only a new config file and one registry entry — zero changes to application logic.

---

## Key Features (v1)

**Input**
- 🎙️ **In-browser audio recording** via MediaRecorder API
- 📁 **Audio file upload** (`.wav`, `.mp3`, `.m4a`, `.ogg`, `.flac`, `.webm`)
- ⌨️ **Type / paste text** — direct text input with character count
- 🔄 **Client-side audio conversion** to `.wav` via `ffmpeg.wasm`

**Processing**
- 🤖 **Dual AI pipeline** — transcribe + structure for audio; structure-only for text
- 📋 **Source panel** — shows raw transcript (audio) or source text (text input), contextually labelled and collapsible

**Output**
- ✏️ **Editable markdown** with tab-based Edit / Preview UX
- ⚠️ **Safety highlighting** — numbers, dosages, units, and unclear values flagged in Preview
- 📤 **Export to MD and PDF**

**Settings**
- 🌐 **Output language config** — English only; dropdown ready for future languages
- 🏥 **Template selector** — SBAR / ISBAR / ISOBAR, default ISBAR
- 🚨 **Unsaved changes warning** before navigation or tab close

---

## Deferred to v2

- User authentication (Firebase Auth)
- Document storage and history (Firestore)
- DOCX export
- PDF text upload (extract text client-side from uploaded PDF)
- Multi-language audio input (auto-detect)
- Multi-patient segmentation
- Custom template builder

---

## Project Structure

Feature-based modular layout. Each feature owns its own UI, logic, hooks, and local types. Shared primitives live in `src/lib/` and `src/components/ui/`. See `src/docs/MODULARITY.md` for the full philosophy and rules.

```
/src/
├── app/
│   ├── layout.tsx
│   ├── page.tsx                        # Root — composes features, owns top-level state
│   └── api/
│       └── generate/
│           └── route.ts                # Single API route, routes by input modality
│
├── features/
│   ├── input/
│   │   ├── InputPanel.tsx              # Parent tabs: Audio | Text
│   │   ├── audio/
│   │   │   ├── AudioPanel.tsx          # Sub-tabs: Record | Upload
│   │   │   ├── AudioRecorder.tsx
│   │   │   ├── AudioUploader.tsx
│   │   │   ├── useAudioRecorder.ts
│   │   │   └── converter.ts            # ffmpeg.wasm Web Worker wrapper
│   │   └── text/
│   │       ├── TextPanel.tsx
│   │       └── useTextInput.ts
│   ├── generation/
│   │   ├── useGeneration.ts            # Calls /api/generate, manages loading/error
│   │   └── types.ts
│   ├── source-viewer/
│   │   ├── SourceViewer.tsx            # Contextual label: "Transcript" or "Source Text"
│   │   └── useSourceLabel.ts
│   ├── editor/
│   │   ├── HandoverEditor.tsx
│   │   ├── SafetyHighlighter.tsx
│   │   └── highlighter.ts
│   ├── export/
│   │   ├── ExportBar.tsx
│   │   ├── exportMd.ts
│   │   └── exportPdf.ts
│   └── settings/
│       ├── SettingsBar.tsx
│       ├── TemplateSelector.tsx
│       └── OutputSettings.tsx
│
├── lib/
│   ├── langchain/
│   │   ├── handoverChain.ts
│   │   └── inputAdapters.ts            # Normalise all modalities → unified ChainInput
│   ├── templates/
│   │   ├── index.ts                    # Registry + DEFAULT_TEMPLATE
│   │   ├── isbar.ts
│   │   ├── sbar.ts
│   │   └── isobar.ts
│   └── safety/
│       └── patterns.ts                 # Safety regex used by highlighter + prompts
│
├── components/
│   └── ui/                             # shadcn/ui only — never hand-edit
│
├── hooks/
│   └── useUnsavedWarning.ts
│
├── types/
│   └── index.ts                        # Global types: TemplateId, OutputLanguage, etc.
│
├── public/
│   └── print.css
│
└── docs/
    ├── README.md
    ├── SPEC.md
    ├── ARCHITECTURE.md
    ├── DECISIONS.md
    ├── EDGE_CASES.md
    ├── MODULARITY.md
    ├── PROJECT_CONTEXT.md
    └── PROMPTS.md
```

---

## Environment Variables

```env
GEMINI_API_KEY=your_key_here
```

---

## Getting Started

```bash
pnpm install
pnpm dev
```

For AI-assisted development with OpenCode:

```bash
opencode
```

Point OpenCode to `src/docs/PROJECT_CONTEXT.md` as your project rules file.

---

## Safety Disclaimer

This tool is for **educational purposes only**. All AI-generated documents must be reviewed by a qualified clinical instructor. Numbers, dosages, units, and `[VERIFY]` tags must be manually confirmed. Do not submit real patient data.
