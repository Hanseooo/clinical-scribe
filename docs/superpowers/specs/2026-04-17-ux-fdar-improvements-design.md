# UX & Prompt Improvement Design Spec
_ClinicalScribe Handover Generation — ISBAR / SBAR / FDAR (2026-04-17)_

## 1. Context
This document outlines a comprehensive plan to address recent user feedback for the ClinicalScribe app, with a focus on UX improvements, markdown readability, clear structure for all supported handover types, and new FDAR template support. All changes align with the current modular, clinical-focused architecture and style.

---

## 2. Core Goals
- **Dynamic Button Labeling:** Submit button always matches selected template (FDAR default).
- **Instructional Text:** Context-specific helper text for all data entry (audio, upload, text), with a structure-tip for first-time FDAR users.
- **Improved Output Formatting:** Bullet points, bold section headers, and clearer substructure (especially DATA: subjective/objective) for all templates.
- **Enhanced Section Separation:** Stronger visual boundaries for Data, Action, Response (especially in markdown preview/export).
- **FDAR Template Foundation:** Implement robust clinical FDAR structure; prompt distinguishes Subjective/Objective, and output uses semantic markdown.
- **Accessibility & Clarity:** Large, bold section markers; friendly tooltips; compliant markdown rendering; strong print/PDF render.

---

## 3. Detailed Feature Design

### 3.1 Dynamic Button Labeling
- The submit (generation) button label will auto-update to display the selected template (e.g. "Generate FDAR", "Generate SBAR").
- FDAR is the default. No mention of unselectable formats.
- Label to use bold, slightly larger text for visibility.
- Logic is contained inside the input/generation feature; button label is derived from template state.

### 3.2 Input Helper & Instructional Text
- Each modality receives a single instructional line:
  - **Record:** "Record your bedside handover. Pause to review before submitting."
  - **Upload:** "Upload an audio recording in .wav, .mp3, or supported formats."
  - **Text:** "Paste or type your handover notes. For FDAR, enter Subjective and Objective data clearly—see below."
- In the markdown editor, a collapsible/dismissible "Structure Tip" will appear when FDAR is active, clarifying:
  > DATA must be split into **Subjective** (direct patient quote; _as verbalized by the patient_) and **Objective** (all clinical findings). ACTION and RESPONSE should be clear bullet lists.
- Tooltips use shadcn/ui Info/Tooltip components for a11y and clarity.

### 3.3 Output Formatting & Readability
- All prompt templates are updated to enforce:
  - Bullet points or numbered lists for multiple data/actions/responses.
  - Section headings use markdown (#, ##) and are styled larger/bolder in preview/editor.
- For FDAR, under DATA:
  - Explicit subheadings: **Subjective** (always includes "as verbalized by the patient") and **Objective**.
  - Example:
    ```
    ## DATA
    **Subjective**
    - “I noticed that the stream ...,” as verbalized by the patient.
    **Objective**
    - (+) gush of clear vaginal fluid noted
    ...
    ```
- Custom renderer (SafetyHighlighter, etc.) may apply extra styling for section headers and bullets—extra indent, spacing, or divider.

### 3.4 Enhanced Section Separation
- Markdown renderer will visually separate DATA, ACTION, and RESPONSE (in all templates), using:
  - Increased padding/margin.
  - Possible border-left accent or horizontal rule.
  - For print/PDF: fall back to font/horizontal rule, avoid color.
- Bulleted/numbered lists get a small vertical gap for clarity.

### 3.5 FDAR Template Support
- New template file (`lib/templates/fdar.ts`), registered as default in the template registry.
- PROMPTS.md and fdar.ts will:
  - Define four sections: FOCUS, DATA, ACTION, RESPONSE (with explicit Subjective/Objective split and clear output chevrons/bullets).
  - Give clear examples and markdown structure—no table output.
  - Prompt instructs for quotes and clinical findings, always grouping as shown in the provided FDAR reference.
- Template selector: FDAR is default, marked “New” (optional: badge or hint).
- Other templates remain selectable/unchanged.

### 3.6 Documentation
- Update PROMPTS.md with full FDAR prompt, notes, and examples.
- Dev comments in fdar.ts to clarify how prompts, section instructions, and output structure work.
- Update README for new/changed conventions.

### 3.7 Validation
- Validate:
  - Labeling logic (button always matches template)
  - Instructional text shown in correct context
  - Sample generated outputs: clinical review for template structure, headings, bullet clarity
  - Print/PDF exports: visual separation, no excess color, all sections distinguished
- Accessibility: headings, labels, and tooltips are screen readable and keyboard accessible.

---

## 4. Outstanding Questions to Monitor
- (Answered for now) — Future: Should returning users have template persisted? Where best to surface “structure tip” (per editor, global help?)

---

## 5. Acceptance Criteria
- Dynamic labels match user selection; FDAR is default.
- Prompts and helpers clarify data entry and output structure, especially for FDAR.
- Output markdown is visually scannable and aids high-pressure workflows.
- Section headings and bullets are clear in all modes (web, print, PDF export).
- All changes follow modular constraints and style/aesthetic rules defined in docs.

---

## 6. Appendix: FDAR Sample Structure (for Prompt Reference)

```
## FOCUS
Risk for infection

## DATA
**Subjective**
- “I noticed ...,” as verbalized by the patient.
**Objective**
- (+) gush of clear vaginal fluid
- ... other clinical findings ...

## ACTION
- Assessed vital signs every 4 hours
- ...

## RESPONSE
- Patient’s temperature decreased ...
- ...
```

---