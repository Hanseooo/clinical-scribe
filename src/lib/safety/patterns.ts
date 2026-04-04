export type SafetyPattern = {
  pattern: RegExp
  className: string
  priority: number
}

export const SAFETY_PATTERNS: SafetyPattern[] = [
  {
    pattern: /\b\d+(?:\.\d+)?\s*(mg|mcg|g|kg|ml|L|mmHg|bpm|°C|°F|%|mEq|IU|units?)\b/gi,
    className: 'warn-unit',
    priority: 1,
  },
  {
    pattern: /\b\d{1,3}\/\d{1,3}\b/g,
    className: 'warn-number',
    priority: 2,
  },
  {
    pattern: /\b\d+:\d{2}\b/g,
    className: 'warn-time',
    priority: 3,
  },
  {
    pattern: /\[(?:UNCLEAR|VERIFY)[^\]]*\]/gi,
    className: 'warn-verify',
    priority: 4,
  },
  {
    pattern: /\b\d+(?:\.\d+)?\b/g,
    className: 'warn-number',
    priority: 5,
  },
]
