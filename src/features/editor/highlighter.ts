import { SAFETY_PATTERNS } from '@/lib/safety/patterns'

export interface HighlightedSegment {
  type: 'text' | 'mark'
  content: string
  className?: string
}

export function highlightText(text: string): HighlightedSegment[] {
  console.log('highlightText: input starts with:', text.slice(0, 80))
  const segments: HighlightedSegment[] = []
  const remaining = text

  const sortedPatterns = [...SAFETY_PATTERNS].sort((a, b) => a.priority - b.priority)
  console.log('highlightText: patterns count:', sortedPatterns.length)

  const matches: Array<{ index: number; length: number; className: string; pattern: typeof SAFETY_PATTERNS[number] }> = []
  const usedRanges: Array<{ start: number; end: number }> = []

  for (const pattern of sortedPatterns) {
    const regex = new RegExp(pattern.pattern.source, pattern.pattern.flags)
    let match: RegExpExecArray | null
    let matchCount = 0

    while ((match = regex.exec(remaining)) !== null) {
      matchCount++
      const start = match.index
      const end = start + match[0].length

      const overlaps = usedRanges.some(
        (r) => start < r.end && end > r.start,
      )

      if (!overlaps) {
        matches.push({ index: start, length: match[0].length, className: pattern.className, pattern })
        usedRanges.push({ start, end })
      }
    }
    if (matchCount > 0) {
      console.log('highlightText: pattern', pattern.className, 'matched', matchCount, 'times')
    }
  }

  console.log('highlightText: total matches:', matches.length)

  matches.sort((a, b) => a.index - b.index)

  let currentIndex = 0

  for (const m of matches) {
    if (m.index > currentIndex) {
      segments.push({ type: 'text', content: remaining.slice(currentIndex, m.index) })
    }

    segments.push({
      type: 'mark',
      content: remaining.slice(m.index, m.index + m.length),
      className: m.className,
    })

    currentIndex = m.index + m.length
  }

  if (currentIndex < remaining.length) {
    segments.push({ type: 'text', content: remaining.slice(currentIndex) })
  }

  console.log('highlightText: output segments:', segments.filter(s => s.type === 'mark').length, 'marks')
  return segments
}
