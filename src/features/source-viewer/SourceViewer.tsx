'use client'

import { useState } from 'react'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { useSourceLabel } from './useSourceLabel'
import type { GenerationResult } from '@/types'

interface SourceViewerProps {
  result: GenerationResult | null
}

export function SourceViewer({ result }: SourceViewerProps) {
  const label = useSourceLabel(result?.modality)
  const [copied, setCopied] = useState(false)

  if (!result) return null

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(result.source)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Clipboard not available
    }
  }

  return (
      <Accordion type="single" collapsible className="w-full">
        <AccordionItem value="source" className="rounded-xl border border-slate-200 bg-white shadow-sm data-[state=open]:border-teal-200">
          <AccordionTrigger className="px-5 py-3.5 text-sm font-medium text-slate-700 hover:no-underline">
          <span className="flex items-center gap-2">
            <svg className="h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            {label}
          </span>
        </AccordionTrigger>
        <AccordionContent className="px-4 pb-4">
          <div className="relative">
            <pre className="whitespace-pre-wrap rounded-md bg-stone-50 p-3 font-mono text-sm text-slate-700">
              {result.source}
            </pre>
            <button
              type="button"
              onClick={handleCopy}
              className="absolute right-2 top-2 rounded-md bg-white px-2 py-1 text-xs text-slate-500 shadow-sm ring-1 ring-slate-200 transition-colors hover:bg-slate-50 hover:text-slate-700"
              aria-label="Copy source text"
            >
              {copied ? 'Copied!' : 'Copy'}
            </button>
          </div>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  )
}
