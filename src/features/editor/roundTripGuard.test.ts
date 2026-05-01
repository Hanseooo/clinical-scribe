import { describe, it, expect } from 'vitest';
import { checkRoundTrip } from './roundTripGuard';

describe('checkRoundTrip', () => {
  it('returns ok for identical strings', () => {
    const result = checkRoundTrip('# Hello\n\nWorld', '# Hello\n\nWorld');
    expect(result.ok).toBe(true);
  });

  it('returns not ok for divergent strings', () => {
    const result = checkRoundTrip('# Hello', '## Hello');
    expect(result.ok).toBe(false);
  });

  it('returns ok for strings differing only by \\r\\n normalization', () => {
    const result = checkRoundTrip('# Hello\r\nWorld', '# Hello\nWorld');
    expect(result.ok).toBe(true);
  });

  it('returns ok for strings differing only by surrounding whitespace (trim)', () => {
    const result = checkRoundTrip('  # Hello  ', '# Hello');
    expect(result.ok).toBe(true);
  });

  it('returns ok for empty strings', () => {
    const result = checkRoundTrip('', '');
    expect(result.ok).toBe(true);
  });

  it('returns not ok for structural whitespace differences', () => {
    const result = checkRoundTrip('# Hello\n\nWorld', '# Hello\nWorld');
    expect(result.ok).toBe(false);
  });
});
