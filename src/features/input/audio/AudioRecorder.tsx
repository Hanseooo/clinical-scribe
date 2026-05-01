'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { useAudioRecorder } from './useAudioRecorder'
import { convertToWavBase64 } from './converter'
import { Send } from 'lucide-react'

interface AudioRecorderProps {
  onSubmit: (blob: Blob, base64: string) => void
  isLoading: boolean
  templateLabel: string
}

export function AudioRecorder({ onSubmit, isLoading, templateLabel }: AudioRecorderProps) {
  const {
    status,
    duration,
    audioBlob,
    error,
    isWarning,
    startRecording,
    stopRecording,
    reRecord,
    canRecord,
  } = useAudioRecorder()

  const [isConverting, setIsConverting] = useState(false)
  const [convertStatus, setConvertStatus] = useState<string | null>(null)
  const [convertError, setConvertError] = useState<string | null>(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const formatDuration = (seconds: number) => {
    const m = Math.floor(seconds / 60)
    const s = seconds % 60
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
  }

  const handleSubmit = async () => {
    if (!audioBlob || isLoading || isConverting) return

    setIsConverting(true)
    setConvertError(null)
    setConvertStatus('Loading audio converter…')

    try {
      const base64 = await convertToWavBase64(audioBlob, (message) => {
        setConvertStatus(message)
      })
      onSubmit(audioBlob, base64)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error'
      setConvertError(`Failed to convert audio: ${message}`)
    } finally {
      setIsConverting(false)
      setConvertStatus(null)
    }
  }

  const audioUrl = audioBlob ? URL.createObjectURL(audioBlob) : null

  if (!mounted) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col items-center gap-4">
          <button
            type="button"
            className="flex h-16 w-16 items-center justify-center rounded-full bg-red-500 text-white shadow-md"
            aria-label="Start recording"
          >
            <span className="h-4 w-4 rounded-full bg-white" />
          </button>
          <p className="text-sm text-slate-500">Tap to start recording</p>
        </div>
      </div>
    )
  }

  if (!canRecord) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-6 text-center shadow-sm">
        <p className="text-sm text-slate-500">
          Recording is not supported in this browser. Please use the Upload tab instead.
        </p>
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      {error && (
        <div className="mb-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {convertError && (
        <div className="mb-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {convertError}
        </div>
      )}

      {convertStatus && !convertError && (
        <div className="mb-4 rounded-md border border-teal-200 bg-teal-50 p-3 text-sm text-teal-700">
          {convertStatus}
        </div>
      )}

      <div className="flex flex-col items-center gap-4">
        {status === 'idle' && (
          <>
            <button
              type="button"
              onClick={startRecording}
              className="flex h-16 w-16 items-center justify-center rounded-full bg-red-500 text-white shadow-md transition-transform hover:scale-105 active:scale-95"
              aria-label="Start recording"
            >
              <span className="h-4 w-4 rounded-full bg-white" />
            </button>
            <p className="text-sm text-slate-500">Tap to start recording</p>
          </>
        )}

        {status === 'recording' && (
          <>
            <button
              type="button"
              onClick={stopRecording}
              className="flex h-16 w-16 items-center justify-center rounded-full bg-red-500 text-white shadow-md transition-transform hover:scale-105 active:scale-95"
              aria-label="Stop recording"
            >
              <span
                className={`h-4 w-4 rounded-sm bg-white ${isWarning ? 'animate-pulse' : ''}`}
              />
            </button>
            <div className="text-center">
              <p className={`text-lg font-mono tabular-nums ${isWarning ? 'text-amber-600' : 'text-slate-800'}`}>
                {formatDuration(duration)}
              </p>
              {isWarning && (
                <p className="mt-1 text-xs text-amber-600">
                  Approaching 10-minute limit
                </p>
              )}
            </div>
          </>
        )}

        {status === 'stopped' && audioBlob && (
          <>
            <audio controls src={audioUrl ?? undefined} className="w-full max-w-md" />
            <div className="flex gap-2">
              <Button variant="outline" onClick={reRecord}>
                Re-record
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={isConverting || isLoading}
              >
                {isConverting || isLoading ? (
                  <>
                    <svg className="mr-2 h-4 w-4 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    {isConverting ? convertStatus || 'Converting…' : 'Generating…'}
                  </>
                ) : (
                  <><span>Generate {templateLabel}</span><Send className="ml-2 h-4 w-4 inline" aria-label="Submit" /></>
                )}
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
