'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { exportMd } from './exportMd'
import { exportPdf } from './exportPdf'

interface ExportBarProps {
  content: string
  source: string
  modality: string
  model: string
  disabled: boolean
  onExportComplete?: () => void
}

export function ExportBar({ content, source, modality, model, disabled, onExportComplete }: ExportBarProps) {
  const [isPdfGenerating, setIsPdfGenerating] = useState(false)

  const handleExportMd = () => {
    if (content) {
      exportMd(content)
      onExportComplete?.()
    }
  }

  const handleExportPdf = async () => {
    if (!content || isPdfGenerating) return

    setIsPdfGenerating(true)
    try {
      const date = new Date().toISOString().split('T')[0]
      await exportPdf({
        handover: content,
        source,
        modality,
        model,
        date,
      })
      onExportComplete?.()
    } catch {
      // Export failed silently
    } finally {
      setIsPdfGenerating(false)
    }
  }

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md">
      <div className="flex items-center gap-2">
        <svg className="h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
        </svg>
        <span className="text-sm font-medium text-slate-700">Export</span>
      </div>
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={handleExportMd}
          disabled={disabled}
        >
          <svg className="mr-1.5 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
          </svg>
          Markdown
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={handleExportPdf}
          disabled={disabled || isPdfGenerating}
        >
          {isPdfGenerating ? (
            <>
              <svg className="mr-1.5 h-4 w-4 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Generating…
            </>
          ) : (
            <>
              <svg className="mr-1.5 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6.72 13.829c-.24.03-.48.062-.72.096m.72-.096a42.415 42.415 0 0110.56 0m-10.56 0L6.34 18m10.94-4.171c.24.03.48.062.72.096m-.72-.096L17.66 18m0 0l.229 2.523a.75.75 0 01-.745.827H6.856a.75.75 0 01-.745-.827L6.34 18m11.32 0H6.34m0 0L5.12 13.829m1.22 4.171h11.32M9 3.75v1.5a1.5 1.5 0 001.5 1.5h3A1.5 1.5 0 0015 5.25V3.75m-6 0h6" />
              </svg>
              PDF
            </>
          )}
        </Button>
      </div>
    </div>
  )
}
