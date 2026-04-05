'use client'

import { useState, useCallback, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { convertToWavBase64 } from './converter'

const ACCEPTED_TYPES = [
  'audio/wav',
  'audio/mp3',
  'audio/mpeg',
  'audio/m4a',
  'audio/aac',
  'audio/ogg',
  'audio/flac',
  'audio/webm',
]

const MAX_SIZE = 50 * 1024 * 1024 // 50MB

interface AudioUploaderProps {
  onSubmit: (base64: string) => void
  isLoading: boolean
}

export function AudioUploader({ onSubmit, isLoading }: AudioUploaderProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [duration, setDuration] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isConverting, setIsConverting] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const validateFile = useCallback((file: File): string | null => {
    if (!ACCEPTED_TYPES.includes(file.type) && !file.name.match(/\.(wav|mp3|m4a|aac|ogg|flac|webm)$/i)) {
      return 'Unsupported file type. Accepted: .wav, .mp3, .m4a, .aac, .ogg, .flac, .webm'
    }
    if (file.size > MAX_SIZE) {
      return 'File too large. Maximum size is 50MB.'
    }
    return null
  }, [])

  const handleFileSelect = useCallback((file: File) => {
    setError(null)
    setDuration(null)

    const validationError = validateFile(file)
    if (validationError) {
      setError(validationError)
      setSelectedFile(null)
      return
    }

    setSelectedFile(file)

    const audio = new Audio()
    audio.src = URL.createObjectURL(file)
    audio.onloadedmetadata = () => {
      setDuration(Math.floor(audio.duration))
    }
  }, [validateFile])

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (file) handleFileSelect(file)
    },
    [handleFileSelect],
  )

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setIsDragging(false)
      const file = e.dataTransfer.files[0]
      if (file) handleFileSelect(file)
    },
    [handleFileSelect],
  )

  const handleSubmit = async () => {
    if (!selectedFile || isLoading || isConverting) return

    setIsConverting(true)
    setError(null)

    try {
      const blob = new Blob([selectedFile], { type: selectedFile.type })
      const base64 = await convertToWavBase64(blob)
      onSubmit(base64)
    } catch {
      setError('Failed to convert audio. Please try again.')
    } finally {
      setIsConverting(false)
    }
  }

  const handleReset = () => {
    setSelectedFile(null)
    setDuration(null)
    setError(null)
    if (inputRef.current) inputRef.current.value = ''
  }

  const formatDuration = (seconds: number) => {
    const m = Math.floor(seconds / 60)
    const s = seconds % 60
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
  }

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      {error && (
        <div className="mb-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {!selectedFile ? (
        <div
          className={`flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-8 transition-colors ${
            isDragging
              ? 'border-teal-500 bg-teal-50'
              : 'border-slate-300 hover:border-slate-400'
          }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          role="button"
          tabIndex={0}
          onClick={() => inputRef.current?.click()}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') inputRef.current?.click()
          }}
          aria-label="Upload audio file"
        >
          <svg
            className="mb-3 h-10 w-10 text-slate-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5"
            />
          </svg>
          <p className="text-sm font-medium text-slate-700">
            Drop audio file here, or{' '}
            <span className="text-teal-600">browse</span>
          </p>
          <p className="mt-1 text-xs text-slate-500">
            .wav, .mp3, .m4a, .aac, .ogg, .flac, .webm — Max 50MB
          </p>
          <input
            ref={inputRef}
            type="file"
            accept="audio/*,.wav,.mp3,.m4a,.aac,.ogg,.flac,.webm"
            onChange={handleInputChange}
            className="hidden"
            aria-hidden="true"
          />
        </div>
      ) : (
        <div className="space-y-3">
          <div className="flex items-center justify-between rounded-md bg-stone-50 p-3">
            <div>
              <p className="text-sm font-medium text-slate-800">{selectedFile.name}</p>
              <p className="text-xs text-slate-500">
                {formatFileSize(selectedFile.size)}
                {duration !== null && ` · ${formatDuration(duration)}`}
              </p>
            </div>
            <Button variant="outline" size="sm" onClick={handleReset}>
              Change
            </Button>
          </div>

          <Button
            onClick={handleSubmit}
            disabled={isConverting || isLoading}
            className="w-full"
          >
            {isConverting ? 'Converting…' : isLoading ? 'Generating…' : 'Submit ▶'}
          </Button>
        </div>
      )}
    </div>
  )
}
