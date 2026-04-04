import { describe, it, expect } from 'vitest'
import { SAFETY_PATTERNS } from './patterns'

describe('SAFETY_PATTERNS', () => {
  it('contains a pattern for mg dosage', () => {
    const hasMg = SAFETY_PATTERNS.some((p) => p.pattern && p.pattern.source && p.pattern.source.includes('mg'))
    expect(hasMg).toBe(true)
  })
})
