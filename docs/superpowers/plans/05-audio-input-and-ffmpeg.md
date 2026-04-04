# ClinicalScribe: 05 Audio Input & ffmpeg Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement the Audio modality UI (`AudioRecorder`, `AudioUploader`), and integrate client-side `ffmpeg.wasm` to convert to `16kHz mono .wav` inside a Web Worker.

**Architecture:** Heavily client-side logic. The Web Worker isolates ffmpeg loading and execution from the React UI thread to prevent blocking.

**Context & References:**
- **Spec:** `src/docs/SPEC.md`
- **Modularity:** `src/docs/MODULARITY.md`
- **Previous Plan:** `docs/superpowers/plans/04-text-input-and-hooks.md`
- **Next Plan:** `docs/superpowers/plans/06-editor-and-source-viewer.md`

**Tech Stack:** `@ffmpeg/ffmpeg` (v0.12.x recommended), `MediaRecorder` API, Web Workers, React hooks.

---

### Task 1: ffmpeg Web Worker

**Files:**
- Create: `src/features/input/audio/converter.worker.ts`
- Create: `src/features/input/audio/converter.ts`

- [ ] **Step 1: Write Converter Tests (Mocking `Worker` constructor)**
  - Ensure `converter.ts` correctly creates a Worker, posts a message with a Blob, and resolves a promise when the Worker responds with a `.wav` base64 string.

- [ ] **Step 2: Implement ffmpeg Worker Logic**
  - Create `converter.worker.ts`. Import `FFmpeg` from `@ffmpeg/ffmpeg`.
  - Load the `coreURL` and `wasmURL` (from `unpkg` or public folder).
  - Write file (`ffmpeg.writeFile`), execute `ffmpeg.exec(['-i', 'input.webm', '-ac', '1', '-ar', '16000', 'output.wav'])`.
  - Read file, convert to base64, and `postMessage` the result.

- [ ] **Step 3: Implement Promise Wrapper**
  - Create `converter.ts`. Export async function `convertToWavBase64(blob: Blob): Promise<string>`.
  - Spawn the worker, await the `postMessage` response, then terminate the worker.

### Task 2: Audio Hooks & UI Components

**Files:**
- Create: `src/features/input/audio/useAudioRecorder.ts`
- Create: `src/features/input/audio/AudioRecorder.tsx`
- Create: `src/features/input/audio/AudioUploader.tsx`

- [ ] **Step 1: Implement `useAudioRecorder` Hook**
  - Use `navigator.mediaDevices.getUserMedia({ audio: true })`.
  - Manage state: `status` ('idle', 'recording', 'stopped'), `duration`, `audioBlob`.
  - Limit recording to 10 minutes.

- [ ] **Step 2: Implement AudioRecorder UI**
  - Create `AudioRecorder.tsx` accepting `onSubmit(base64: string)`.
  - Show pulsing red dot when recording.
  - Show `<audio>` element for playback when stopped.
  - On submit, show "Converting..." state and call `convertToWavBase64`.

- [ ] **Step 3: Implement AudioUploader UI**
  - Create `AudioUploader.tsx` using `<input type="file" accept="audio/*" />`.
  - Support drag-and-drop. Size limit 50MB.
  - Validate file size and type.
  - On submit, call `convertToWavBase64` and invoke `onSubmit(base64: string)`.

### Task 4: Root Audio Panel & Input Panel

**Files:**
- Create: `src/features/input/audio/AudioPanel.tsx`
- Create: `src/features/input/InputPanel.tsx`
- Modify: `app/page.tsx`

- [ ] **Step 1: Assemble Audio Panel**
  - Create `AudioPanel.tsx`.
  - Provide sub-tabs ("Record" | "Upload") rendering the appropriate component.

- [ ] **Step 2: Assemble Parent Input Panel**
  - Create `InputPanel.tsx`.
  - Provide parent tabs ("Audio" | "Text") rendering `AudioPanel` or `TextPanel`.
  - Pass the respective `onSubmit` and `isLoading` props down.

- [ ] **Step 3: Wire into Page**
  - Update `app/page.tsx` to render the unified `<InputPanel />`.
  - Provide an `onSubmit` handler that dispatches either text or audio-record/upload payloads to `generate()`.