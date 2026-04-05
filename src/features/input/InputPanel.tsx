'use client'

import { useState } from 'react'
import { AudioPanel } from './audio/AudioPanel'
import { TextPanel } from './text/TextPanel'

interface InputPanelProps {
  onTextSubmit: (text: string) => void
  onAudioSubmit: (base64: string) => void
  isLoading: boolean
}

export function InputPanel({ onTextSubmit, onAudioSubmit, isLoading }: InputPanelProps) {
  const [activeTab, setActiveTab] = useState<'audio' | 'text'>('audio')

  return (
    <div className="space-y-3">
      <div className="flex gap-1 rounded-xl border border-slate-200 bg-white p-1.5 shadow-sm">
        <button
          type="button"
          onClick={() => setActiveTab('audio')}
          className={`flex items-center justify-center gap-1.5 flex-1 rounded-lg px-3 py-2.5 text-sm font-medium transition-all ${
            activeTab === 'audio'
              ? 'bg-teal-600 text-white shadow-sm'
              : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'
          }`}
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z" />
          </svg>
          Audio
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('text')}
          className={`flex items-center justify-center gap-1.5 flex-1 rounded-lg px-3 py-2.5 text-sm font-medium transition-all ${
            activeTab === 'text'
              ? 'bg-teal-600 text-white shadow-sm'
              : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'
          }`}
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
          </svg>
          Text
        </button>
      </div>

      {activeTab === 'audio' ? (
        <AudioPanel onSubmit={onAudioSubmit} isLoading={isLoading} />
      ) : (
        <TextPanel onSubmit={onTextSubmit} isLoading={isLoading} />
      )}
    </div>
  )
}
