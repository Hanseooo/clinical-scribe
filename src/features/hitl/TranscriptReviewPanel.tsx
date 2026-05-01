'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogAction,
  AlertDialogCancel,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { useTranscriptReview } from './useTranscriptReview'
import { UncertaintyBadge } from './UncertaintyBadge'
import { CorrectionPopover } from './CorrectionPopover'
import { CorrectionSheet } from './CorrectionSheet'
import type { DraftTranscript } from './types'

interface TranscriptReviewPanelProps {
  draft: DraftTranscript
  audioBlob: Blob
  onComplete: (correctedText: string) => void
  isGenerating?: boolean
}

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  return isMobile
}

export function TranscriptReviewPanel({ draft, audioBlob, onComplete, isGenerating }: TranscriptReviewPanelProps) {
  const {
    state,
    applyCorrection,
    skipSegment,
    reconstructTranscript,
    skippedCount,
    resolvedCount,
    totalFlagged,
  } = useTranscriptReview(draft)

  const isMobile = useIsMobile()
  const audioUrl = useMemo(() => URL.createObjectURL(audioBlob), [audioBlob])

  useEffect(() => {
    return () => {
      URL.revokeObjectURL(audioUrl)
    }
  }, [audioUrl])

  const [showConfirm, setShowConfirm] = useState(false)

  const handleFinish = useCallback(() => {
    const correctedText = reconstructTranscript()
    onComplete(correctedText)
  }, [reconstructTranscript, onComplete])

  return (
    <div className="space-y-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-heading text-lg font-semibold text-slate-800">
            Review Transcription
          </h2>
          <p className="text-sm text-slate-500">
            {resolvedCount} of {totalFlagged} uncertain segments reviewed
            {skippedCount > 0 && ` (${skippedCount} skipped)`}
          </p>
        </div>
        <audio controls src={audioUrl} className="h-8 w-48" />
      </div>

      <div className="space-y-2">
        {draft.segments.map((segment) => {
          const isFlagged = segment.confidence < 0.8
          const isCorrected = state.corrections[segment.id] !== undefined
          const isSkipped = state.skipped.has(segment.id)

          const flaggedTrigger = (
            <button
              type="button"
              className="inline-flex cursor-pointer items-center gap-1.5 rounded px-1 py-0.5 transition-colors hover:bg-amber-100 bg-amber-50 text-amber-800"
            >
              {isCorrected ? state.corrections[segment.id] : segment.text}
              <UncertaintyBadge confidence={segment.confidence} />
            </button>
          )

          const normalTrigger = (
            <button
              type="button"
              className={`inline-flex cursor-pointer items-center gap-1.5 rounded px-1 py-0.5 transition-colors hover:bg-slate-100 ${
                isCorrected
                  ? 'bg-teal-50 text-teal-800'
                  : isSkipped
                  ? 'bg-slate-50 text-slate-500 line-through'
                  : ''
              }`}
            >
              {isCorrected ? state.corrections[segment.id] : segment.text}
            </button>
          )

          const trigger = isFlagged ? flaggedTrigger : normalTrigger

          const correctionComponent = isMobile ? (
            <CorrectionSheet
              key={segment.id}
              segment={segment}
              onCorrect={(text) => applyCorrection(segment.id, text)}
              trigger={trigger}
            />
          ) : (
            <CorrectionPopover
              key={segment.id}
              segment={segment}
              onCorrect={(text) => applyCorrection(segment.id, text)}
              trigger={trigger}
            />
          )

          return (
            <span key={segment.id} className="inline-flex items-center gap-1">
              {correctionComponent}
              {isFlagged && !isCorrected && !isSkipped && (
                <button
                  type="button"
                  onClick={() => skipSegment(segment.id)}
                  className="text-xs text-slate-400 hover:text-slate-600 underline"
                >
                  Skip
                </button>
              )}
              {isFlagged && isSkipped && (
                <span className="text-xs text-slate-400">(skipped)</span>
              )}
            </span>
          )
        })}
      </div>

      <div className="flex justify-end gap-2 pt-2">
        {isGenerating ? (
          <Button disabled>
            <svg className="mr-2 h-4 w-4 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            Generating handover…
          </Button>
        ) : state.isComplete ? (
          <AlertDialog open={showConfirm} onOpenChange={setShowConfirm}>
            <AlertDialogTrigger asChild>
              <Button>Continue</Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Confirm transcription</AlertDialogTitle>
                <AlertDialogDescription>
                  You have reviewed all flagged segments. Continue to generate the handover note?
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleFinish}>Continue</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        ) : (
          <Button disabled>Review all flagged segments to continue</Button>
        )}
      </div>
    </div>
  )
}
