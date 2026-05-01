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
});
