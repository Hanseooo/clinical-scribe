'use client'

import { useState } from 'react'
import { SettingsBar } from '@/features/settings/SettingsBar'
import { InputPanel } from '@/features/input/InputPanel'
import { SourceViewer } from '@/features/source-viewer/SourceViewer'
import { HandoverEditor } from '@/features/editor/HandoverEditor'
import { ExportBar } from '@/features/export/ExportBar'
import { Footer } from '@/components/layout/Footer'
import { TranscriptReviewPanel } from '@/features/hitl/TranscriptReviewPanel'
import { useGeneration } from '@/features/generation/useGeneration'
import { useUnsavedWarning } from '@/hooks/useUnsavedWarning'
import { DEFAULT_TEMPLATE } from '@/lib/templates'
import type { TemplateId, OutputLanguage, GenerationResult } from '@/types'
import type { GenerateSuccessResponse } from '@/features/generation/types'
import type { DraftTranscript } from '@/features/hitl/types'

export function AppClient() {
  const [template, setTemplate] = useState<TemplateId>(DEFAULT_TEMPLATE)
  const [outputLanguage, setOutputLanguage] = useState<OutputLanguage>('en')
  const [generationResult, setGenerationResult] = useState<GenerationResult | null>(null)
  const [handover, setHandover] = useState<string>('')
  const [isDirty, setIsDirty] = useState(false)
  const [reviewDraft, setReviewDraft] = useState<DraftTranscript | null>(null)
  const [reviewAudioBlob, setReviewAudioBlob] = useState<Blob | null>(null)
  const [transcribeError, setTranscribeError] = useState<string | null>(null)
  const [isTranscribing, setIsTranscribing] = useState(false)

  useUnsavedWarning(isDirty)

  const handleSuccess = (result: GenerateSuccessResponse) => {
    setGenerationResult({
      source: result.source,
      handover: result.handover,
      modality: result.modality,
      model: result.model,
    })
    setHandover(result.handover)
    setIsDirty(false)
  }

  const handleError = () => {
    // Error is handled by the hook; page-level state can react here
  }

  const { isLoading, error, generate } = useGeneration({
    onSuccess: handleSuccess,
    onError: handleError,
  })

  const handleTextSubmit = (text: string) => {
    generate({ modality: 'text', text, template, outputLanguage })
  }

  const handleAudioSubmit = async (audioBlob: Blob, audioBase64: string) => {
    setIsTranscribing(true)
    setTranscribeError(null)

    try {
      const response = await fetch('/api/transcribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ audio: audioBase64 }),
      })

      const data = await response.json()

      if (!response.ok) {
        setTranscribeError(data.error || 'Transcription failed')
        return
      }

      setReviewDraft(data.draftTranscript as DraftTranscript)
      setReviewAudioBlob(audioBlob)
    } catch {
      setTranscribeError('Network error during transcription')
    } finally {
      setIsTranscribing(false)
    }
  }

  const handleEditorChange = (value: string) => {
    setHandover(value)
    if (generationResult) {
      setIsDirty(value !== generationResult.handover)
    }
  }

  const handleExportComplete = () => {
    setIsDirty(false)
  }

  return (
    <main className="mx-auto max-w-6xl px-4 py-6">
      <div className="space-y-5">
        {/* Settings */}
        <div data-print-hide="true">
          <SettingsBar
            template={template}
            onTemplateChange={setTemplate}
            outputLanguage={outputLanguage}
            onOutputLanguageChange={setOutputLanguage}
          />
        </div>

        {/* Input or Review */}
        {reviewDraft && reviewAudioBlob ? (
          <div data-print-hide="true">
            <TranscriptReviewPanel
              draft={reviewDraft}
              audioBlob={reviewAudioBlob}
              isGenerating={isLoading}
              onComplete={(correctedText) => {
                setReviewDraft(null)
                setReviewAudioBlob(null)
                generate({ modality: 'text', text: correctedText, template, outputLanguage })
              }}
            />
          </div>
        ) : (
          <div data-print-hide="true">
            <InputPanel
              onTextSubmit={handleTextSubmit}
              onAudioSubmit={handleAudioSubmit}
              isLoading={isLoading || isTranscribing}
              template={template}
            />
          </div>
        )}

        {/* Transcription loading overlay */}
        {isTranscribing && (
          <div className="flex items-center justify-center rounded-xl border border-slate-200 bg-white p-8 shadow-sm" data-print-hide="true">
            <div className="flex flex-col items-center gap-3">
              <svg className="h-8 w-8 animate-spin text-teal-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              <p className="text-sm font-medium text-slate-600">Transcribing audio…</p>
              <p className="text-xs text-slate-400">Please wait while we process your recording</p>
            </div>
          </div>
        )}

        {/* Generation loading overlay */}
        {isLoading && (
          <div className="flex items-center justify-center rounded-xl border border-slate-200 bg-white p-8 shadow-sm" data-print-hide="true">
            <div className="flex flex-col items-center gap-3">
              <svg className="h-8 w-8 animate-spin text-teal-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              <p className="text-sm font-medium text-slate-600">Generating handover note…</p>
              <p className="text-xs text-slate-400">This may take a few seconds</p>
            </div>
          </div>
        )}

        {/* Transcribe Error */}
        {transcribeError && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700" data-print-hide="true">
            {transcribeError}
          </div>
        )}

        {/* Generation Error */}
        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700" data-print-hide="true">
            {error.error}
          </div>
        )}

        {/* Results */}
        {generationResult && (
          <div className="space-y-5 animate-in fade-in duration-500">
            <SourceViewer result={generationResult} />
            <HandoverEditor value={handover} onChange={handleEditorChange} template={template} />
            <div data-print-hide="true">
              <ExportBar
                content={handover}
                source={generationResult.source}
                modality={generationResult.modality}
                model={generationResult.model}
                disabled={!handover}
                onExportComplete={handleExportComplete}
              />
            </div>
          </div>
        )}

        {/* Empty state */}
        {!generationResult && !isLoading && (
          <div className="rounded-xl border border-dashed border-slate-200 bg-white p-12 text-center" data-print-hide="true">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-teal-50">
              <svg className="h-6 w-6 text-teal-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
              </svg>
            </div>
            <h3 className="font-heading text-lg font-semibold text-slate-800">
              No handover yet
            </h3>
            <p className="mx-auto mt-2 max-w-sm text-sm text-slate-500">
              Record an audio handover or type your notes above, then hit Generate to get a structured document.
            </p>
          </div>
        )}

        {/* Unsaved changes indicator */}
        {isDirty && (
          <div className="fixed bottom-4 right-4 flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-4 py-2.5 text-sm text-amber-700 shadow-sm" data-print-hide="true">
            <svg className="h-4 w-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
            </svg>
            Unsaved changes — export before leaving
          </div>
        )}
      </div>
      <Footer />
    </main>
  )
}
