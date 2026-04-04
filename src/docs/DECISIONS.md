# Architecture Decision Records — ClinicalScribe v1

Each entry follows the format: **Context → Options considered → Decision → Tradeoffs**

---

## ADR-001: Single Gemini call for transcription + structuring

**Context:** We need to convert audio to a structured handover doc. The question is whether to use separate STT → LLM steps or one combined call.

**Options:**
| Option | Pros | Cons |
|---|---|---|
| Google Cloud STT → Gemini | Word-level confidence scores; STT is best-in-class | 60 min/month free limit; two API keys; two points of failure; added latency |
| Whisper (local/cloud) → Gemini | Good transcription quality; open source | Requires Python or separate service; deployment complexity |
| **Gemini 2.5 Flash (single call)** | Native audio input; free tier generous; one API key; simpler pipeline | No word-level confidence; slightly lower STT quality than dedicated STT |

**Decision:** Single Gemini 2.5 Flash call for both transcription and structuring.

**Accepted tradeoff:** We lose word-level confidence scores. Mitigated by prompt engineering — Gemini is instructed to emit `[UNCLEAR: value]` tags when uncertain, and all numbers/units are highlighted by the client-side safety highlighter regardless.

---

## ADR-002: LangChain.js over direct Gemini SDK calls

**Context:** We need to call Gemini from a Next.js API route. Options are LangChain.js, the official `@google/generative-ai` SDK, or Vercel AI SDK.

**Options:**
| Option | Pros | Cons |
|---|---|---|
| **LangChain.js** | Developer familiarity; abstracts prompt templates; easy to add chains later | Larger bundle; abstraction overhead for a simple pipeline |
| `@google/generative-ai` SDK | Official; minimal; fastest | No abstraction; prompt management is manual; harder to extend |
| Vercel AI SDK | First-class Vercel integration; streaming built-in | Less familiar; ties us to Vercel AI SDK patterns |

**Decision:** LangChain.js.

**Accepted tradeoff:** Slightly larger dependency footprint. Justified by developer familiarity and easier future extensibility (adding chains, memory, RAG).

---

## ADR-003: Client-side audio conversion via ffmpeg.wasm

**Context:** Browser `MediaRecorder` outputs `.webm`. Gemini accepts `.wav`, `.mp3`, `.flac`, etc. but `.webm` support is inconsistent. Uploaded files may be any format.

**Options:**
| Option | Pros | Cons |
|---|---|---|
| **ffmpeg.wasm (client-side)** | No server needed; zero cost; works for all formats | Heavy download (~30MB WASM); blocks UI if not in Worker |
| Server-side conversion (ffmpeg on API route) | Thin client | Vercel functions have no persistent binary; need a separate service |
| Accept only `.wav` uploads | Simple | Bad UX; most phones record `.m4a` |
| Send `.webm` and hope Gemini handles it | No conversion needed | Unreliable; `.webm` not officially listed in Gemini audio support |

**Decision:** ffmpeg.wasm in a Web Worker.

**Accepted tradeoff:** ~30MB initial WASM download. Mitigated by lazy loading ffmpeg only when the user initiates conversion. Web Worker prevents UI freeze.

---

## ADR-004: PDF export via window.print() over jsPDF

**Context:** Students need to export the handover as a PDF.

**Options:**
| Option | Pros | Cons |
|---|---|---|
| **window.print() + print CSS** | Zero dependencies; always matches rendered output; browser handles pagination | Less control over exact layout; requires good print CSS |
| jsPDF + html2canvas | Programmatic; consistent output | Heavy libraries; html2canvas is brittle with complex layouts |
| react-pdf/renderer | Full layout control | Requires rebuilding the entire doc as PDF components — double maintenance |
| Server-side PDF (Puppeteer) | Perfect rendering | Needs a separate server; too complex for v1 |

**Decision:** `window.print()` with a dedicated `print.css`.

**Accepted tradeoff:** Less control over output. Acceptable because the handover is simple prose/markdown — no complex layout requirements. The print stylesheet handles safety highlights gracefully (converts colors to bracketed text).

---

## ADR-005: shadcn/ui as component library

**Context:** We need a component library for the UI.

**Options:**
| Option | Pros | Cons |
|---|---|---|
| **shadcn/ui** | Headless; copy-paste into repo; full control; Tailwind-native; accessible | Must add components one by one |
| Chakra UI / Mantine | Batteries-included; faster initial setup | Opinionated styling; harder to customise |
| Tailwind CSS only | Maximum control | Must build everything from scratch |
| Ant Design | Rich component set | Heavy; design system doesn't fit clinical-clean aesthetic |

**Decision:** shadcn/ui.

**Accepted tradeoff:** Slightly more setup per component. Justified by design control, accessibility baseline, and no runtime CSS-in-JS overhead.

---

## ADR-006: State management with React useState (no Zustand)

**Context:** App has non-trivial shared state (audio blob, transcript, handover content, template, settings).

**Options:**
| Option | Pros | Cons |
|---|---|---|
| **React useState lifted to page.tsx** | No extra dependency; simple; easy to reason about | Prop drilling for deeply nested components |
| Zustand | Minimal; no prop drilling | Extra dependency; overkill for v1 scope |
| React Context | Built-in; avoids prop drilling | Context re-renders can be a footgun |

**Decision:** `useState` lifted to `page.tsx` for v1.

**Accepted tradeoff:** Some prop drilling in the component tree. Acceptable given the shallow component hierarchy. Migrate to Zustand in v2 when adding history, auth state, etc.

---

## ADR-007: ISBAR as default template

**Context:** We support SBAR, ISBAR, and ISOBAR. One must be the default.

**Options:**
| Option | Rationale |
|---|---|
| SBAR | Simpler; internationally common |
| **ISBAR** | Most common in Philippine nursing schools; adds patient Identity which is clinically important |
| ISOBAR | Most comprehensive but more complex for students |

**Decision:** ISBAR as default.

**Rationale:** The primary user is a Philippine nursing student. ISBAR is the format most likely taught in their curriculum. Students can switch to SBAR or ISOBAR freely.

---

## ADR-008: No Vercel Blob for v1 (base64 inline for audio)

**Context:** Audio needs to reach the API route. Options are base64 in request body or Vercel Blob upload.

**Options:**
| Option | Pros | Cons |
|---|---|---|
| **Base64 in POST body** | Simple; no extra service; no storage concerns | 4.5MB default body limit (mitigated by config); not ideal for large files |
| Vercel Blob | Handles large files cleanly; async-friendly | Extra complexity; Blob storage costs after free tier |

**Decision:** Base64 in POST body for v1, with body size limit raised to 20MB via route config.

**Accepted tradeoff:** A 5-minute `.wav` at 16kHz mono ≈ 9.6MB base64. This fits within 20MB. Recordings over ~10 minutes may fail. Soft cap at 10 minutes in the UI. Revisit with Vercel Blob if students need longer recordings.

---

## ADR-009: Tabs UX for markdown editor (Edit | Preview)

**Context:** Students need to both edit and preview the generated handover.

**Options:**
| Option | Pros | Cons |
|---|---|---|
| Split pane (side by side) | See both simultaneously | Cramped on mobile; complex responsive layout |
| **Tabs (Edit / Preview)** | Clean; works on mobile; familiar | Must switch to see highlights |
| Inline edit (click to edit) | Seamless | Complex to implement; easy to accidentally edit |

**Decision:** Tabs.

**Rationale:** Most users will be on mobile or smaller screens. Tabs scale well. Safety highlights are in Preview tab — switching is a natural review step anyway.

---

## ADR-010: Stateless v1 (no persistence)

**Context:** Should we store generated handovers server-side?

**Decision:** No. v1 is fully stateless. No database, no auth, no server-side storage.

**Rationale:** The primary use case is generate → review → export in a single session. Persistence adds auth complexity and database costs. Mitigated by clear UX warnings about unsaved state and easy export.

**Migration path:** v2 adds Firebase Auth + Firestore with minimal architectural change since the API route already returns clean JSON that is trivially storable.

---

## ADR-011: Text input as a first-class modality (not an afterthought)

**Context:** Adding typed/pasted text as an input method alongside audio.

**Decision:** Text is a fully separate input modality with its own pipeline branch, not a fallback or simplified version of audio. It gets its own feature folder, its own chain function, its own prompt, and its own tab in the UI.

**Rationale:** The text and audio paths diverge significantly — audio requires ffmpeg conversion and a Gemini transcription step; text does not. Treating them as the same path would require conditional logic scattered across the codebase. Separate modalities, unified output interface = clean separation.

**Accepted tradeoff:** Slightly more code up front (two chain functions instead of one). Paid back immediately in clarity and future extensibility (adding PDF upload is just another adapter branch).

---

## ADR-012: Feature-based folder structure over type-based

**Context:** Choosing how to organise files as the project grows.

**Options:**
| Option | Structure | Problem |
|---|---|---|
| Type-based | `components/`, `hooks/`, `utils/` | Related code scattered across folders; refactoring one feature touches many folders |
| **Feature-based** | `features/input/`, `features/editor/`, etc. | Related code co-located; each feature is independently replaceable |

**Decision:** Feature-based structure under `features/`, with `src/lib/` for shared non-React logic and `src/components/ui/` for shadcn primitives. (Note: some older docs still reference `lib/` and `components/ui/`; prefer `src/`-prefixed paths.)

**Rationale:** This project will grow. Type-based structures scale poorly — every new feature adds files to every type folder. Feature-based structures scale well — each new feature adds one new folder that other features don't need to know about.

---

## ADR-013: All modality branching isolated to `inputAdapters.ts`

**Context:** With multiple input modalities, branching logic (`if audio, else if text`) could appear in many places: the API route, the chain, the UI, the source panel.

**Decision:** All modality-specific logic (except UI rendering) is contained in `src/lib/langchain/inputAdapters.ts`. The adapter normalises any input into a `ChainInput`. Downstream code only handles `ChainInput` and `GenerationResult`.

**Rationale:** Without this rule, adding a fourth modality (e.g. PDF upload) would require hunting down every `if modality === 'audio'` branch across the codebase. With this rule, it's one new adapter branch and one new feature folder.

---

## ADR-014: Source panel with contextual label (not renamed component)

**Context:** The transcript panel only makes sense for audio inputs. For text input, showing "Transcript" is misleading — there's nothing to transcribe.

**Options:**
| Option | Problem |
|---|---|
| Hide panel for text input | Loses the confirmation of what was submitted |
| Rename component to "Source Text" always | Confusing for audio use case |
| **Contextual label driven by modality** | "Transcript" for audio, "Source Text" for text |

**Decision:** Single `SourceViewer` component with a `useSourceLabel` hook that returns the correct label based on modality returned from the API.

**Rationale:** The panel serves the same purpose regardless of modality — show the user what was sent to the AI. The label is the only thing that changes. One component, one responsibility.
