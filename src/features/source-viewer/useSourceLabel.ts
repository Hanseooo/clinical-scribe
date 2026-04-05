'use client'

import { useMemo } from 'react'
import type { InputModality } from '@/types'

export function useSourceLabel(modality: InputModality | undefined): string {
  return useMemo(() => {
    if (!modality) return 'Source'
    if (modality.startsWith('audio')) return 'Transcript'
    return 'Source Text'
  }, [modality])
}
