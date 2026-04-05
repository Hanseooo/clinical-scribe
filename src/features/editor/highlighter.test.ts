import { describe, it, expect } from 'vitest'
import { highlightText } from './highlighter'

describe('highlightText', () => {
  it('returns plain text segment when no patterns match', () => {
    const result = highlightText('Patient is stable.')

    expect(result).toEqual([{ type: 'text', content: 'Patient is stable.' }])
  })

  it('highlights number with unit', () => {
    const result = highlightText('Dose: 10mg administered')

    const markSegment = result.find((s) => s.type === 'mark')
    expect(markSegment).toBeDefined()
    expect(markSegment?.content).toBe('10mg')
    expect(markSegment?.className).toBe('warn-unit')
  })

  it('highlights time expression', () => {
    const result = highlightText('Given at 08:30 this morning')

    const markSegment = result.find((s) => s.type === 'mark' && s.className === 'warn-time')
    expect(markSegment).toBeDefined()
    expect(markSegment?.content).toBe('08:30')
  })

  it('highlights VERIFY flag', () => {
    const result = highlightText('[VERIFY: unclear dosage]')

    const markSegment = result.find((s) => s.type === 'mark' && s.className === 'warn-verify')
    expect(markSegment).toBeDefined()
    expect(markSegment?.content).toBe('[VERIFY: unclear dosage]')
  })

  it('highlights bare number', () => {
    const result = highlightText('Score was 7 out of 10')

    const markSegments = result.filter((s) => s.type === 'mark')
    expect(markSegments.length).toBeGreaterThan(0)
    expect(markSegments.some((s) => s.content === '7')).toBe(true)
    expect(markSegments.some((s) => s.content === '10')).toBe(true)
  })

  it('prioritizes unit pattern over bare number for 10mg', () => {
    const result = highlightText('10mg')

    const markSegments = result.filter((s) => s.type === 'mark')
    expect(markSegments).toHaveLength(1)
    expect(markSegments[0].content).toBe('10mg')
    expect(markSegments[0].className).toBe('warn-unit')
  })

  it('handles multiple different patterns in one string', () => {
    const result = highlightText('At 09:00 gave 500ml saline, BP 120/80')

    const markSegments = result.filter((s) => s.type === 'mark')
    expect(markSegments.length).toBeGreaterThanOrEqual(3)
    expect(markSegments.some((s) => s.className === 'warn-time')).toBe(true)
    expect(markSegments.some((s) => s.className === 'warn-unit')).toBe(true)
  })
})
