# ClinicalScribe: 08 React-PDF Export Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the "Export PDF" button with `@react-pdf/renderer` for reliable cross-platform PDF generation (mobile + desktop). Keep `window.print()` as a secondary option.

**Architecture:** Client-side PDF generation using `pdf().toBlob()`. Markdown content converted to react-pdf components via remark AST parsing. All PDF components in `'use client'` files.

**Context & References:**
- **Spec:** `src/docs/SPEC.md` (4.8 Export)
- **Modularity:** `src/docs/MODULARITY.md`
- **Previous Plan:** `docs/superpowers/plans/07-export-and-unsaved-warnings.md`

**Tech Stack:** `@react-pdf/renderer` v4.x, `remark` + `remark-gfm` for markdown AST parsing.

---

### Task 1: Install & Font Registration

**Files:**
- Run: `pnpm add @react-pdf/renderer remark remark-gfm`

- [ ] **Step 1: Install Dependencies**
  - Run `pnpm add @react-pdf/renderer remark remark-gfm`

- [ ] **Step 2: Create PDF Document Styles**
  - Create `src/features/export/pdf/styles.ts`
  - Define `StyleSheet.create()` with: page, header, heading1-3, body, list, listItem, verify, disclaimer, footer

- [ ] **Step 3: Create Markdown-to-PDF Converter**
  - Create `src/features/export/pdf/mdToPdf.tsx`
  - Parse markdown string via `remark().use(remarkGfm).parse(markdown)`
  - Map AST nodes to react-pdf components:
    - `heading` → `<Text style={styles.h1/h2/h3}>`
    - `paragraph` → `<Text style={styles.body}>`
    - `list` → `<View style={styles.list}>` with `<Text style={styles.listItem}>` children
    - `blockquote` → `<View style={styles.blockquote}>` with italic text
    - `thematicBreak` → `<View style={styles.hr} />`
    - `code` → `<Text style={styles.code}>`
    - `strong` → nested `<Text style={{ fontWeight: 'bold' }}>`
    - `emphasis` → nested `<Text style={{ fontStyle: 'italic' }}>`
  - Handle `[VERIFY: ...]` patterns with red highlight style

### Task 2: PDF Document Component

**Files:**
- Create: `src/features/export/pdf/ClinicalDocument.tsx`

- [ ] **Step 1: Create Document Component**
  - Create `ClinicalDocument.tsx` accepting `handover: string`, `source: string`, `modality: string`, `model: string`, `date: string`
  - Structure:
    ```
    <Document title="Clinical Handover" author="ClinicalScribe">
      <Page size="A4" style={styles.page}>
        {/* Fixed header */}
        <View fixed style={styles.header}>
          <Text>ClinicalScribe — AI-generated draft</Text>
        </View>

        {/* Fixed footer with page numbers */}
        <Text render={({ pageNumber, totalPages }) => ...} fixed style={styles.footer} />

        {/* Document title */}
        <Text style={styles.title}>Clinical Handover Document</Text>
        <Text style={styles.meta}>Model: {model} | {modality} | {date}</Text>

        {/* Source/Transcript section */}
        <Text style={styles.h2}>Source</Text>
        <Text style={styles.source}>{source}</Text>

        {/* Handover content (parsed markdown) */}
        <MdToPdf markdown={handover} />

        {/* Disclaimer */}
        <View style={styles.disclaimer}>
          <Text>⚠ AI-generated draft. All values must be verified before clinical use.</Text>
        </View>
      </Page>
    </Document>
    ```

### Task 3: Export PDF Function

**Files:**
- Modify: `src/features/export/exportPdf.ts`

- [ ] **Step 1: Replace window.print() with pdf().toBlob()**
  - Import `pdf` from `@react-pdf/renderer`
  - Import `ClinicalDocument` component
  - Create async `exportPdf(handover, source, modality, model)` function
  - Generate blob via `await pdf(<ClinicalDocument ... />).toBlob()`
  - Trigger download with `URL.createObjectURL` + invisible `<a>` tag
  - Filename: `handover-{date}.pdf`

### Task 4: ExportBar Update

**Files:**
- Modify: `src/features/export/ExportBar.tsx`

- [ ] **Step 1: Update ExportBar Props**
  - Add `source: string`, `modality: string`, `model: string` props
  - Pass these to the new `exportPdf` function

- [ ] **Step 2: Add Loading State for PDF Generation**
  - Show "Generating PDF…" while `pdf().toBlob()` is in progress
  - Disable button during generation

### Task 5: Wire into Page

**Files:**
- Modify: `src/app/app/app-client.tsx`

- [ ] **Step 1: Pass New Props to ExportBar**
  - Pass `source={generationResult.source}`, `modality={generationResult.modality}`, `model={generationResult.model}` to `<ExportBar>`

### Task 6: Verification

- [ ] **Step 1: Type Checking**
  - Run `npx tsc --noEmit`

- [ ] **Step 2: Build**
  - Run `pnpm run build`

- [ ] **Step 3: Lint**
  - Run `pnpm run lint`

- [ ] **Step 4: Test**
  - Run `npx vitest run`

---

### Technical Notes

- **Font:** Use built-in `Times-Roman` (no custom font files needed). Register bold/italic variants via `Font.register()` if needed, but built-in fonts handle this automatically.
- **Client-side only:** All PDF components must be in `'use client'` files.
- **No server rendering:** Use `pdf().toBlob()` exclusively — avoid `renderToStream` (broken in Next.js 15+).
- **Markdown parsing:** Use `remark` AST directly, NOT `react-markdown`, to avoid unhandled HTML element crashes in react-pdf.
- **Safety highlights:** Parse `[VERIFY: ...]` patterns in the AST converter and render with red text style.
- **Bundle impact:** ~60KB gzipped for `@react-pdf/renderer` + ~15KB for `remark` + `remark-gfm`.
