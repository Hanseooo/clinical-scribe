'use client'

import dynamic from 'next/dynamic'
import { useState } from 'react'
import { SafetyHighlighter } from './SafetyHighlighter'

const MDEditor = dynamic(() => import('@uiw/react-md-editor'), { ssr: false })

interface HandoverEditorProps {
  value: string
  onChange: (value: string) => void
}

export function HandoverEditor({ value, onChange }: HandoverEditorProps) {
  const [activeTab, setActiveTab] = useState<'edit' | 'preview'>('preview')

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
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
          <div data-color-mode="light">
            <MDEditor
              value={value}
              onChange={(v) => onChange(v ?? '')}
              height={400}
              preview="edit"
              hideToolbar={false}
            />
          </div>
        ) : (
          <div className="prose prose-sm max-w-none">
            <SafetyHighlighter markdown={value} />
          </div>
        )}
      </div>
    </div>
  )
}
