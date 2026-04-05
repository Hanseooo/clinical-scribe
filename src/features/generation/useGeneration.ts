'use client'

import { useState, useCallback } from 'react'
import type {
  GenerateRequest,
  GenerateSuccessResponse,
  GenerateErrorResponse,
  UseGenerationOptions,
  UseGenerationReturn,
} from './types'

export function useGeneration({
  onSuccess,
  onError,
}: UseGenerationOptions = {}): UseGenerationReturn {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<GenerateErrorResponse | null>(null)

  const generate = useCallback(
    async (request: GenerateRequest) => {
      setIsLoading(true)
      setError(null)

      try {
        const response = await fetch('/api/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(request),
        })

        const data = (await response.json()) as GenerateSuccessResponse | GenerateErrorResponse

        if (!response.ok) {
          const errorResponse = data as GenerateErrorResponse
          setError(errorResponse)
          onError?.(errorResponse)
          return
        }

        onSuccess?.(data as GenerateSuccessResponse)
      } catch {
        const fallbackError: GenerateErrorResponse = {
          error: 'Network error. Check your connection.',
          code: 'UNKNOWN',
        }
        setError(fallbackError)
        onError?.(fallbackError)
      } finally {
        setIsLoading(false)
      }
    },
    [onSuccess, onError],
  )

  const resetError = useCallback(() => {
    setError(null)
  }, [])

  return { isLoading, error, generate, resetError }
}
