<img width="1900" height="865" alt="image" src="https://github.com/user-attachments/assets/d575478a-bdeb-42f1-8d93-3c1e85abebff" />


# ClinicalScribe

Structured clinical handover documentation for nursing students. Record a patient handover or paste your notes to get a clean, structured ISBAR document in seconds. Safety-critical values are automatically highlighted for review.

## Features

- **Three input modalities**: In-browser audio recording, audio file upload (drag-and-drop), or typed notes
- **AI-powered structuring**: Transcribes and organizes input into ISBAR, SBAR, or ISOBAR formats
- **Client-side audio conversion**: ffmpeg.wasm converts any audio to 16kHz mono .wav in a Web Worker (no server processing)
- **Markdown editor**: Full-featured editor with Edit/Preview tabs powered by `@uiw/react-md-editor`
- **Safety highlighting**: Numbers, units, time values, and `[VERIFY]` flags are automatically highlighted in the preview
- **Export**: Download as Markdown (.md) or generate a properly formatted PDF with `@react-pdf/renderer`
- **Unsaved changes warning**: Browser `beforeunload` protection when edits haven't been exported
- **Print-optimized**: Dedicated print stylesheet for clean paper output via `window.print()`

## Tech Stack

| Layer | Technology |
|---|---|
| **Framework** | Next.js 16.2.2 (App Router), React 19 |
| **Styling** | TailwindCSS v4, shadcn/ui, Radix UI |
| **AI** | LangChain, `@langchain/google-genai`, Gemini 2.5 Flash |
| **Audio** | `@ffmpeg/ffmpeg` (Web Worker), MediaRecorder API |
| **Editor** | `@uiw/react-md-editor`, `react-markdown` |
| **PDF** | `@react-pdf/renderer` (client-side vector PDF) |
| **Testing** | Vitest, jsdom, Testing Library, MSW |
| **Package Manager** | pnpm |

## Project Structure

```
src/
├── app/
│   ├── page.tsx              # Landing page
│   ├── about/page.tsx        # About page
│   ├── app/page.tsx          # Main app (client orchestrator)
│   ├── app/app-client.tsx    # App state management & composition
│   ├── api/generate/route.ts # AI generation API endpoint
│   └── layout.tsx            # Root layout with print stylesheet
├── components/ui/            # shadcn/ui components
├── features/
│   ├── settings/             # Template & language selection
│   ├── input/
│   │   ├── text/             # Text input panel & hook
│   │   └── audio/            # Audio recorder, uploader, ffmpeg converter
│   ├── generation/           # useGeneration hook (API interaction)
│   ├── editor/               # HandoverEditor, SafetyHighlighter
│   ├── source-viewer/        # Collapsible transcript/source panel
│   └── export/               # Markdown & PDF export, react-pdf document
├── hooks/                    # Shared hooks (useUnsavedWarning)
├── lib/
│   ├── langchain/            # Input adapters, handover chains
│   ├── safety/               # Safety pattern regexes
│   └── templates/            # ISBAR, SBAR, ISOBAR template registry
├── types/                    # Shared TypeScript types
└── docs/                     # Architecture, spec, modularity docs
```

## Getting Started

### Prerequisites

- Node.js 20+
- pnpm 10+
- A Gemini API key (get one at [Google AI Studio](https://aistudio.google.com/))

### Installation

```bash
pnpm install
```

### Environment Setup

Copy the example environment file and add your API key:

```bash
cp .env.example .env.local
```

```env
GEMINI_API_KEY=your_api_key_here
```

### Development

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) for the landing page, or [http://localhost:3000/app](http://localhost:3000/app) to start using the app.

### Build

```bash
pnpm run build
```

### Lint

```bash
pnpm run lint
```

### Test

```bash
pnpm test          # watch mode
pnpm test:run      # run once
pnpm test:coverage # with coverage report
```

## Architecture

### Input Adapters

`src/lib/langchain/inputAdapters.ts` is the modularity seam for adding new input types. It normalizes raw requests into a typed `ChainInput` before any LangChain chain is invoked. Adding a new modality (e.g. PDF upload) means adding a new adapter branch — zero changes to the chain or UI below the adapter.

### LangChain Pipeline

Two separate chains share the same output shape:
- **Audio chain**: Uploads audio to Gemini File API → transcribe + structure in one pass → parse `TRANSCRIPT:` / `HANDOVER:` delimiters → clean up uploaded file
- **Text chain**: Structures provided text → parse `HANDOVER:` delimiter → return echo + structured output

Both return `{ source: string, handover: string }`.

### Safety Highlighting

Post-processing via `SafetyHighlighter.tsx` — never modifies stored markdown. Uses regex patterns from `src/lib/safety/patterns.ts` to highlight numbers, units, time values, and `[VERIFY]` flags with color-coded `<mark>` elements.

### PDF Export

Client-side vector PDF generation using `@react-pdf/renderer`. Markdown is parsed via `remark` AST and mapped to react-pdf components. Works identically on mobile and desktop — no browser print dialog needed.

## Handover Templates

| Template | Sections | Default |
|---|---|---|
| **ISBAR** | Identity, Situation, Background, Assessment, Recommendation | Yes |
| **SBAR** | Situation, Background, Assessment, Recommendation | No |
| **ISOBAR** | Identity, Situation, Observations, Background, Assessment, Recommendation | No |

## Safety Patterns

The following clinical values are automatically highlighted for manual verification:

| Pattern | Class | Example |
|---|---|---|
| Number + unit | `warn-unit` | `10mg`, `120/80mmHg`, `500ml` |
| Time | `warn-time` | `08:30`, `14:00` |
| VERIFY flag | `warn-verify` | `[VERIFY: unclear dosage]` |
| Bare numbers | `warn-number` | `7`, `10` |

## Deployment

The easiest way to deploy is via the [Vercel Platform](https://vercel.com/new). Set the `GEMINI_API_KEY` environment variable in your deployment settings.

## License

Educational tool — not for clinical use without verification.
