'use client'

import { useState } from 'react'
import { AudioRecorder } from './AudioRecorder'
import { AudioUploader } from './AudioUploader'

interface AudioPanelProps {
  onSubmit: (base64: string) => void
  isLoading: boolean
  templateLabel: string
}

export function AudioPanel({ onSubmit, isLoading, templateLabel }: AudioPanelProps) {
  const [activeTab, setActiveTab] = useState<'record' | 'upload'>('record')

  const helperText = activeTab === 'record'
    ? 'Record your bedside handover. Pause to review before submitting.'
    : 'Upload an audio recording in .wav, .mp3, or supported formats.'

  return (
    <div className="space-y-3">
      <p className="text-sm text-slate-600">{helperText}</p>
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
        <AudioRecorder onSubmit={onSubmit} isLoading={isLoading} templateLabel={templateLabel} />
      ) : (
        <AudioUploader onSubmit={onSubmit} isLoading={isLoading} templateLabel={templateLabel} />
      )}
    </div>
  )
}
