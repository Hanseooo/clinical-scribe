import type { InputModality, TemplateId, OutputLanguage } from '@/types'

export type ErrorCode =
  | 'NO_SPEECH'
  | 'NO_CONTENT'
  | 'RATE_LIMIT'
  | 'TIMEOUT'
  | 'FORMAT_ERROR'
  | 'UNKNOWN'

export interface GenerateRequest {
  modality: InputModality
  text?: string
  audioBase64?: string
  template: TemplateId
  outputLanguage: OutputLanguage
}

export interface GenerateSuccessResponse {
  source: string
  handover: string
  modality: InputModality
  model: string
}

export interface GenerateErrorResponse {
  error: string
  code: ErrorCode
}

export type GenerateResponse = GenerateSuccessResponse | GenerateErrorResponse

export interface UseGenerationOptions {
  onSuccess?: (result: GenerateSuccessResponse) => void
  onError?: (error: GenerateErrorResponse) => void
}

export interface UseGenerationReturn {
  isLoading: boolean
  error: GenerateErrorResponse | null
  generate: (request: GenerateRequest) => Promise<void>
  resetError: () => void
}
