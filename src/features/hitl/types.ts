export interface TranscriptSegment {
  id: string;
  text: string;
  confidence: number;
  alternatives: string[];
  startTime?: number;
  endTime?: number;
}

export interface DraftTranscript {
  segments: TranscriptSegment[];
}

export interface CorrectionMap {
  [segmentId: string]: string;
}

export interface ReviewState {
  draft: DraftTranscript;
  corrections: CorrectionMap;
  skipped: Set<string>;
  isComplete: boolean;
}

export interface TranscribeRequest {
  audio: string; // base64 WAV
  language?: 'en';
}

export interface TranscribeResponse {
  draftTranscript: DraftTranscript;
  model: string;
}
