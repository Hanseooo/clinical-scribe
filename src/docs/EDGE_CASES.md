# Edge Cases, Concerns & Handling — ClinicalScribe v1

---

## 1. Audio Quality Issues

### Background noise in recordings
**Risk:** Students may record in noisy clinical simulation labs.
**Handling:** Gemini 2.5 Flash handles moderate background noise well. Prompt instructs Gemini to emit `[UNCLEAR: best_guess]` for unintelligible segments rather than hallucinating values. UI shows a tip: *"For best results, record in a quiet environment."*

### Multiple speakers / overlapping speech
**Risk:** If an instructor and student speak simultaneously.
**Handling:** Gemini will attempt to transcribe all speech. The handover structure prompt forces it to extract only clinically relevant information, reducing noise from chatter. Edge case — no special handling in v1.

### Very soft speech / low microphone gain
**Risk:** Transcript is empty or near-empty.
**Handling:** API route checks if transcript length < 50 characters → returns a specific error code → UI shows: *"No speech was detected. Please speak clearly and try again."*

### Strong accents / Filipino English
**Risk:** Gemini may mishear Filipino-English pronunciation (e.g. "hypertension" said with a local accent).
**Handling:** Gemini 2.5 Flash handles Filipino English reasonably well. Prompt includes: *"The speaker may have a Filipino English accent. Prioritise clinical context when interpreting unclear words."* Common clinical terms unlikely to be misheard catastrophically.

---

## 2. AI Output Quality Issues

### Gemini hallucinating values not in the audio
**Risk:** Model invents a dosage or vital sign not mentioned.
**Handling:** System prompt strictly instructs: *"Only include information explicitly stated in the audio. If a section has no information, write 'Not mentioned.' Do not infer or fabricate."* Safety highlights provide a visual double-check layer.

### Gemini not following the output format
**Risk:** Response doesn't include `TRANSCRIPT:` / `HANDOVER:` delimiters, breaking parsing.
**Handling:** Prompt uses few-shot formatting examples. API route has a fallback parser: if delimiter not found, treat entire response as handover and set transcript to `"[Transcript unavailable — see handover]"`. Toast warning shown to user.

### Section missing from handover
**Risk:** Gemini omits a required ISBAR section if the audio has no relevant content.
**Handling:** Prompt instructs: *"All sections must be present. If no information is available for a section, write: '**[Section]:** Not mentioned in handover.'"* Client-side validation checks rendered markdown for expected section headings and warns if any are missing.

### Gemini returns markdown inconsistently
**Risk:** Sometimes uses `##`, sometimes `**Bold:**`, sometimes plain text for sections.
**Handling:** Prompt specifies exact markdown format with an example. Output parser can normalise headings if needed. Edge case — accept minor formatting variation in v1.

---

## 3. Audio File Edge Cases

### File is not actually audio (wrong extension)
**Risk:** User uploads a `.wav` that is actually a renamed `.exe` or a corrupted file.
**Handling:** ffmpeg.wasm will fail to decode → catch error → show: *"This file could not be processed. Please upload a valid audio file."*

### Audio file has no speech (e.g. silence, music)
**Risk:** File is valid audio but contains no clinical content.
**Handling:** Same as "very soft speech" — transcript will be near-empty. UI shows "No speech detected" error state.

### Very long audio file (> 10 min)
**Risk:** Exceeds the 20MB body limit or Gemini's audio duration limits.
**Handling:** Client-side duration check after file selection / after recording stops. If > 10 minutes: show warning banner *"Recording is over 10 minutes. Consider trimming for best results. Long recordings may fail."* Hard block at 15 minutes.

### Audio file contains multiple patients
**Risk:** Instructor hands over 3 patients in one recording; AI generates one blended doc.
**Handling:** In v1, this is a known limitation. Add a notice in the UI: *"This tool generates one handover per submission. For multiple patients, submit separately."* Multi-patient segmentation is a v2 feature.

### Browser doesn't support MediaRecorder
**Risk:** Safari on older iOS versions, some mobile browsers.
**Handling:** Feature detect `typeof MediaRecorder !== 'undefined'` on component mount. If unsupported, hide the Record tab entirely and show only the Upload tab with a note: *"Audio recording is not supported in this browser. Please upload an audio file."*

---

## 4. Network & API Edge Cases

### Gemini API rate limit hit (free tier: 15 RPM)
**Risk:** If multiple people share the same API key (e.g. a class all using the same deployment).
**Handling:** API route catches 429 errors → returns specific error code → UI shows: *"Too many requests. Please wait a moment and try again."* In v1, single-user assumption — not a major concern.

### Gemini File API upload fails
**Risk:** Audio upload to Gemini File API times out or returns an error.
**Handling:** Wrap in try/catch with retry logic (1 retry with 2s delay). If still fails → return error → UI shows retry button.

### Gemini File not deleted after response (cleanup failure)
**Risk:** Files accumulate in Gemini File API storage (though Gemini auto-deletes after 48h).
**Handling:** Log cleanup failures server-side. Not critical — Gemini enforces TTL automatically.

### Request body too large (audio > 20MB)
**Risk:** Vercel rejects the request before it hits the API route.
**Handling:** Client-side pre-check: estimate base64 size before sending (raw bytes × 1.37). If estimated size > 18MB → show error before sending. Suggest trimming audio or re-recording.

### Vercel function timeout (10s on hobby plan)
**Risk:** Long audio takes > 10s to process.
**Handling:** Gemini Flash is typically 5-10s. For safety, show a loading state with a progress message. If timeout → client receives network error → show: *"Generation timed out. Try a shorter recording."* Long-term: upgrade to Vercel Pro (60s timeout) or implement streaming.

---

## 5. UX & State Edge Cases

### User refreshes page mid-edit
**Risk:** All work lost (stateless app).
**Handling:** `beforeunload` event fires warning: *"You have unsaved changes. Export your document before leaving."* Cannot fully prevent refresh — this is a known limitation of stateless v1.

### User clicks Re-record with unsaved edited handover
**Risk:** Edited handover is overwritten by new generation.
**Handling:** `shadcn/ui AlertDialog` confirmation: *"Starting a new recording will replace your current handover. Export it first if you want to keep it."* Two buttons: "Export MD first" and "Discard and continue."

### Generated markdown is very long (verbose Gemini output)
**Risk:** Editor becomes unwieldy; PDF export is many pages.
**Handling:** Prompt instructs Gemini to be concise — clinical handovers should be brief. Add a character count / word count indicator in the editor. No hard truncation.

### User edits markdown to remove all safety-flagged content
**Risk:** Student deletes `[UNCLEAR]` tags manually — losing the warning.
**Handling:** The highlights are presentation-layer only (not stored in markdown). The raw markdown preserves `[UNCLEAR]` tags as plain text regardless of what the preview shows. If user deletes a tag in Edit mode, it's their deliberate choice. Not a technical problem.

### PDF print dialog is cancelled
**Risk:** `window.print()` is called, user cancels — no feedback that export didn't happen.
**Handling:** No reliable way to detect print cancellation cross-browser. Acceptable UX — the document is still in the editor.

---

## 6. Clinical Safety Concerns

### Student treats AI output as ground truth
**Risk:** Student uses an unverified handover in a clinical simulation.
**Handling:** Multi-layer mitigation:
1. Persistent disclaimer banner in the UI
2. Every `[UNCLEAR]` tag and safety highlight requires visual attention
3. PDF export footer: *"AI-generated draft — verify all values before clinical use"*
4. Onboarding tooltip on first load explaining the tool's limitations

### Number misrecognition creates dangerous dosage errors
**Risk:** "15mg" heard as "50mg" — both plausible, very different doses.
**Handling:** ALL numbers and units are highlighted in the preview regardless of confidence. The `[UNCLEAR]` tag system catches explicitly ambiguous values. Prompt instructs Gemini to prefer flagging over guessing when values are unclear.

### Confidential patient information in audio
**Risk:** If used in real clinical settings (not simulation), real patient data could be sent to Gemini.
**Handling:** Prominent disclaimer: *"Do not use real patient data. This tool is for educational simulation only."* This is a v1 product exclusively for student training scenarios, not clinical use. Auth and data governance are v2 concerns.

---

## 7. Development & Maintenance Concerns

### ffmpeg.wasm bundle size (~30MB)
**Concern:** Large initial download on first conversion.
**Handling:** Lazy load ffmpeg only when the user first attempts to convert. Show a loading state: *"Preparing audio converter..."* Cache in browser after first load (WASM modules cache well).


### Prompt drift over time
**Concern:** As Gemini models update, prompt output format may shift.
**Handling:** Prompt templates are in version-controlled config files. Output parsing is defensive (fallback parser). Add basic output validation in the API route to catch format regressions.

### API key exposed in client
**Concern:** The Gemini API key must never be exposed to the browser.
**Handling:** API key is server-side only — in `.env.local`, accessed only in `app/api/generate/route.ts`. The client never sees it. Standard Next.js server/client boundary.
