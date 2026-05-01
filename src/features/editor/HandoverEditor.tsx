'use client'

import { useState } from 'react'
import { SafetyHighlighter } from './SafetyHighlighter'
import { TiptapEditor } from './TiptapEditor'
import type { TemplateId } from '@/types'

const TIPS: Partial<Record<TemplateId, { title: string; content: React.ReactNode }>> = {
  fdar: {
    title: 'Structure Tip',
    content: (
      <>
        DATA must be split into <strong>Subjective</strong> (direct patient quote; <em>as verbalized by the patient</em>) and <strong>Objective</strong> (all clinical findings). ACTION and RESPONSE should be clear bullet lists.
      </>
    ),
  },
}

interface HandoverEditorProps {
  value: string
  onChange: (value: string) => void
  template?: TemplateId
}

export function HandoverEditor({ value, onChange, template }: HandoverEditorProps) {
  const [activeTab, setActiveTab] = useState<'edit' | 'preview'>('preview')
  const [tipDismissed, setTipDismissed] = useState(false)
  const [showSource, setShowSource] = useState(false)
  const tip = template ? TIPS[template] : undefined
  const showTip = tip && !tipDismissed

  const [prevTemplate, setPrevTemplate] = useState(template)
  if (template !== prevTemplate) {
    setPrevTemplate(template)
    setTipDismissed(false)
  }

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      {showTip && (
        <div className="m-4 rounded-lg border border-teal-200 bg-teal-50 p-3">
          <div className="flex items-start justify-between gap-2">
            <div className="text-sm text-teal-800">
              <strong className="font-semibold">{tip.title}</strong>
              <p className="mt-1">{tip.content}</p>
            </div>
            <button
              type="button"
              onClick={() => setTipDismissed(true)}
              className="flex-shrink-0 text-teal-600 hover:text-teal-800"
              aria-label="Dismiss structure tip"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}
      <div className="flex border-b border-slate-200 bg-stone-50/50">
        <button
          type="button"
          onClick={() => setActiveTab('edit')}
          className={`px-5 py-2.5 text-sm font-medium transition-colors ${
            activeTab === 'edit'
              ? 'border-b-2 border-teal-600 bg-white text-teal-700'
              : 'text-slate-500 hover:bg-white hover:text-slate-700'
          }`}
        >
          Edit
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('preview')}
          className={`px-5 py-2.5 text-sm font-medium transition-colors ${
            activeTab === 'preview'
              ? 'border-b-2 border-teal-600 bg-white text-teal-700'
              : 'text-slate-500 hover:bg-white hover:text-slate-700'
          }`}
        >
          Preview
        </button>
      </div>

      <div className="p-4">
        {activeTab === 'edit' ? (
          <div>
            {showSource ? (
              <textarea
                readOnly
                value={value}
                className="w-full h-[400px] font-mono text-sm p-4 border rounded bg-muted"
              />
            ) : (
              <TiptapEditor value={value} onChange={onChange} />
            )}
            <button
              type="button"
              onClick={() => setShowSource(!showSource)}
              className="text-xs text-muted-foreground hover:text-foreground mt-2"
              aria-pressed={showSource}
            >
              {showSource ? 'Back to Editor' : 'View Source'}
            </button>
          </div>
        ) : (
          <div className="prose prose-sm max-w-none [&_ul]:list-disc [&_ol]:list-decimal [&_ul]:pl-5 [&_ol]:pl-5">
            <SafetyHighlighter markdown={value} />
          </div>
        )}
      </div>
    </div>
  )
}
