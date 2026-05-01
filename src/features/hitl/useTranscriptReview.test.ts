import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useTranscriptReview } from './useTranscriptReview';
import { DraftTranscript } from './types';

const mockDraft: DraftTranscript = {
  segments: [
    { id: 'seg_001', text: 'Patient was given', confidence: 0.95, alternatives: [] },
    { id: 'seg_002', text: 'metoprolol', confidence: 0.62, alternatives: ['metformin', 'metroprolol'] },
  ],
};

describe('useTranscriptReview', () => {
  it('initializes with draft and no corrections', () => {
    const { result } = renderHook(() => useTranscriptReview(mockDraft));
    expect(result.current.state.draft.segments).toHaveLength(2);
    expect(result.current.state.isComplete).toBe(false);
  });

  it('marks segment as corrected', () => {
    const { result } = renderHook(() => useTranscriptReview(mockDraft));
    act(() => {
      result.current.applyCorrection('seg_002', 'metformin');
    });
    expect(result.current.state.corrections['seg_002']).toBe('metformin');
    expect(result.current.state.isComplete).toBe(true);
  });
});
