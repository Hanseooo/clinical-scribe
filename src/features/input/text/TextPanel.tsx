'use client'

import { Button } from '@/components/ui/button'
import { useTextInput } from './useTextInput'

interface TextPanelProps {
  onSubmit: (text: string) => void
  isLoading: boolean
  initialValue?: string
  templateLabel: string
}

export function TextPanel({ onSubmit, isLoading, initialValue, templateLabel }: TextPanelProps) {
  const isFdar = templateLabel === 'FDAR'
  const {
    text,
    setText,
    charCount,
    isValid,
    isWarning,
    isOverLimit,
    statusMessage,
    hardLimit,
  } = useTextInput(initialValue)

  const handleSubmit = () => {
    if (isValid && !isLoading) {
      onSubmit(text)
    }
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="mb-2 text-sm text-slate-600">
        {isFdar
          ? 'Paste or type your handover notes. For FDAR, enter Subjective and Objective data clearly.'
          : 'Paste or type your handover report here…'}
      </p>
      <textarea
        className={`w-full resize-none rounded-md border bg-stone-50 p-3 font-mono text-sm leading-relaxed text-slate-800 outline-none transition-colors focus:border-teal-600 focus:ring-1 focus:ring-teal-600/20 ${
          isOverLimit
            ? 'border-red-300 focus:border-red-500 focus:ring-red-500/20'
            : isWarning
              ? 'border-amber-300'
              : 'border-slate-200'
        }`}
        rows={10}
        maxLength={hardLimit + 100}
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={isFdar ? 'Subjective: "I noticed..." (as verbalized by the patient)\n\nObjective: clinical findings here...' : 'Paste or type the handover report here…'}
        disabled={isLoading}
        aria-label="Handover notes"
        aria-describedby="text-status"
      />

      <div className="mt-2 flex items-center justify-between">
        <span
          id="text-status"
          className={`text-xs ${
            isOverLimit
              ? 'text-red-600'
              : isWarning
                ? 'text-amber-600'
                : charCount > 0
                  ? 'text-slate-500'
                  : 'text-slate-400'
          }`}
        >
          {statusMessage}
        </span>

        <Button
          onClick={handleSubmit}
          disabled={!isValid || isLoading}
          aria-busy={isLoading}
        >
          {isLoading ? (
            <>
              <svg className="mr-2 h-4 w-4 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Generating…
            </>
          ) : (
            `Generate ${templateLabel}`
          )}
        </Button>
      </div>
    </div>
  )
}
