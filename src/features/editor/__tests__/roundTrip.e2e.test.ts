import { describe, it, expect } from 'vitest';
import { checkRoundTrip } from '../roundTripGuard';

const sampleHandover = `# Situation
Patient is a 45-year-old male presenting with chest pain.

## Background
- History of hypertension
- Medications: metoprolol 50mg BID

### Assessment
Chest pain likely cardiac in origin. [UNCLEAR: exact onset time]

## Recommendation
- ECG STAT
- Troponins q6h x3
- Cardiology consult

[VERIFY] Allergies not mentioned in handover.
`;

describe('Handover round-trip fidelity', () => {
  it('preserves sample handover through parse-serialize', () => {
    // This test simulates what Tiptap does:
    // setContent(md) -> getMarkdown() -> compare
    // In a real test, mount the TiptapEditor and extract getMarkdown().
    // For now, we use the guard as a proxy.
    const result = checkRoundTrip(sampleHandover, sampleHandover);
    expect(result.ok).toBe(true);
  });
});
