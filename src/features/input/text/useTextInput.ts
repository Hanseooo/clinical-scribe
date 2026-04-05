'use client'

import { useState, useMemo } from 'react'

const MIN_CHARS = 50
const SOFT_LIMIT = 8000
const HARD_LIMIT = 12000

export function useTextInput(initialValue = '') {
  const [text, setText] = useState(initialValue)

  const charCount = text.length
  const isValid = charCount >= MIN_CHARS && charCount <= HARD_LIMIT
  const isWarning = charCount >= SOFT_LIMIT
  const isOverLimit = charCount > HARD_LIMIT

  const statusMessage = useMemo(() => {
    if (charCount === 0) return `${MIN_CHARS} characters minimum`
    if (charCount < MIN_CHARS) return `${MIN_CHARS - charCount} more characters needed`
    if (isOverLimit) return `${charCount - HARD_LIMIT} characters over limit`
    if (isWarning) return `Approaching limit (${HARD_LIMIT - charCount} remaining)`
    return `${charCount} / ${HARD_LIMIT} characters`
  }, [charCount, isWarning, isOverLimit])

  return {
    text,
    setText,
    charCount,
    isValid,
    isWarning,
    isOverLimit,
    statusMessage,
    minChars: MIN_CHARS,
    softLimit: SOFT_LIMIT,
    hardLimit: HARD_LIMIT,
  }
}
