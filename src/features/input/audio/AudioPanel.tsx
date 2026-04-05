'use client'

import { useState } from 'react'
import { AudioRecorder } from './AudioRecorder'
import { AudioUploader } from './AudioUploader'

interface AudioPanelProps {
  onSubmit: (base64: string) => void
  isLoading: boolean
}

export function AudioPanel({ onSubmit, isLoading }: AudioPanelProps) {
  const [activeTab, setActiveTab] = useState<'record' | 'upload'>('record')

  return (
    <div className="space-y-3">
      <div className="flex gap-1 rounded-xl border border-slate-200 bg-white p-1.5 shadow-sm">
        <button
          type="button"
          onClick={() => setActiveTab('record')}
          className={`flex-1 rounded-lg px-3 py-2.5 text-sm font-medium transition-all ${
            activeTab === 'record'
              ? 'bg-teal-600 text-white shadow-sm'
              : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'
          }`}
        >
          Record
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('upload')}
          className={`flex-1 rounded-lg px-3 py-2.5 text-sm font-medium transition-all ${
            activeTab === 'upload'
              ? 'bg-teal-600 text-white shadow-sm'
              : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'
          }`}
        >
          Upload
        </button>
      </div>

      {activeTab === 'record' ? (
        <AudioRecorder onSubmit={onSubmit} isLoading={isLoading} />
      ) : (
        <AudioUploader onSubmit={onSubmit} isLoading={isLoading} />
      )}
    </div>
  )
}
