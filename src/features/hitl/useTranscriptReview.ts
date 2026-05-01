import { useState, useCallback, useMemo } from 'react';
import { DraftTranscript, CorrectionMap, ReviewState } from './types';

export function useTranscriptReview(draft: DraftTranscript) {
  const [corrections, setCorrections] = useState<CorrectionMap>({});
  const [skipped, setSkipped] = useState<Set<string>>(new Set());

  const flaggedSegmentIds = useMemo(() => {
    return draft.segments.filter((s) => s.confidence < 0.8).map((s) => s.id);
  }, [draft]);

  const isComplete = useMemo(() => {
    return flaggedSegmentIds.every(
      (id) => corrections[id] !== undefined || skipped.has(id)
    );
  }, [flaggedSegmentIds, corrections, skipped]);

  const applyCorrection = useCallback((segmentId: string, correctedText: string) => {
    setCorrections((prev) => ({ ...prev, [segmentId]: correctedText }));
    setSkipped((prev) => {
      const next = new Set(prev);
      next.delete(segmentId);
      return next;
    });
  }, []);

  const skipSegment = useCallback((segmentId: string) => {
    setSkipped((prev) => new Set(prev).add(segmentId));
    setCorrections((prev) => {
      const next = { ...prev };
      delete next[segmentId];
      return next;
    });
  }, []);

  const reconstructTranscript = useCallback((): string => {
    return draft.segments
      .map((segment) => corrections[segment.id] || segment.text)
      .join(' ');
  }, [draft, corrections]);

  const skippedCount = useMemo(() => {
    return Array.from(skipped).filter((id) => flaggedSegmentIds.includes(id)).length;
  }, [skipped, flaggedSegmentIds]);

  const resolvedCount = useMemo(() => {
    return flaggedSegmentIds.filter(
      (id) => corrections[id] !== undefined || skipped.has(id)
    ).length;
  }, [flaggedSegmentIds, corrections, skipped]);

  const state: ReviewState = {
    draft,
    corrections,
    skipped,
    isComplete,
  };

  return {
    state,
    applyCorrection,
    skipSegment,
    reconstructTranscript,
    skippedCount,
    resolvedCount,
    totalFlagged: flaggedSegmentIds.length,
  };
}
