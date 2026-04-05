'use client'

import { Button } from '@/components/ui/button'
import { useTextInput } from './useTextInput'

interface TextPanelProps {
  onSubmit: (text: string) => void
  isLoading: boolean
  initialValue?: string
}

export function TextPanel({ onSubmit, isLoading, initialValue }: TextPanelProps) {
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
        placeholder="Paste or type the handover report here…"
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
          {isLoading ? 'Generating…' : 'Generate Handover ▶'}
        </Button>
      </div>
    </div>
  )
}
