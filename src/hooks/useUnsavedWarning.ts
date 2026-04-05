'use client'

import { useEffect } from 'react'

export function useUnsavedWarning(isDirty: boolean) {
  useEffect(() => {
    if (!isDirty) return

    const handleUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault()
      e.returnValue = ''
    }

    window.addEventListener('beforeunload', handleUnload)

    return () => {
      window.removeEventListener('beforeunload', handleUnload)
    }
  }, [isDirty])
}
