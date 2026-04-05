'use client'

import { useState, useRef, useCallback } from 'react'

type RecordingStatus = 'idle' | 'recording' | 'stopped'

const MAX_DURATION_MS = 10 * 60 * 1000 // 10 minutes
const WARNING_DURATION_MS = 8 * 60 * 1000 // 8 minutes

export function useAudioRecorder() {
  const [status, setStatus] = useState<RecordingStatus>('idle')
  const [duration, setDuration] = useState(0)
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isWarning, setIsWarning] = useState(false)

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const streamRef = useRef<MediaStream | null>(null)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const startTimeRef = useRef<number>(0)

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
  }, [])

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop()
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop())
    }
    clearTimer()
  }, [clearTimer])

  const startRecording = useCallback(async () => {
    setError(null)
    setAudioBlob(null)
    setDuration(0)
    setIsWarning(false)

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream

      const mimeType = MediaRecorder.isTypeSupported('audio/webm')
        ? 'audio/webm'
        : 'audio/ogg'

      const recorder = new MediaRecorder(stream, { mimeType })
      mediaRecorderRef.current = recorder
      chunksRef.current = []

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data)
        }
      }

      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: mimeType })
        setAudioBlob(blob)
        setStatus('stopped')
      }

      recorder.start(100)
      setStatus('recording')
      startTimeRef.current = Date.now()

      timerRef.current = setInterval(() => {
        const elapsed = Date.now() - startTimeRef.current
        setDuration(Math.floor(elapsed / 1000))

        if (elapsed >= WARNING_DURATION_MS) {
          setIsWarning(true)
        }

        if (elapsed >= MAX_DURATION_MS) {
          stopRecording()
        }
      }, 1000)
    } catch {
      setError('Microphone access denied. Please allow microphone access and try again.')
    }
  }, [stopRecording])

  const reRecord = useCallback(() => {
    stopRecording()
    setStatus('idle')
    setAudioBlob(null)
    setDuration(0)
    setIsWarning(false)
    setError(null)
  }, [stopRecording])

  const reset = useCallback(() => {
    stopRecording()
    setStatus('idle')
    setAudioBlob(null)
    setDuration(0)
    setIsWarning(false)
    setError(null)
  }, [stopRecording])

  return {
    status,
    duration,
    audioBlob,
    error,
    isWarning,
    startRecording,
    stopRecording,
    reRecord,
    reset,
    canRecord: typeof navigator !== 'undefined' && navigator.mediaDevices?.getUserMedia,
  }
}
