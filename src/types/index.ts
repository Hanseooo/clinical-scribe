export type TemplateId = 'sbar' | 'isbar' | 'isobar' | 'fdar'
export type OutputLanguage = 'en'
export type InputModality = 'audio-record' | 'audio-upload' | 'text'

export interface InputPayload {
  modality: InputModality
  content: Blob | string
}

export interface HandoverTemplate {
  id: TemplateId
  name: string
  sections: string[]
  systemPrompt: string
  sectionInstructions: string
}

export interface GenerationResult {
  source: string
  handover: string
  modality: InputModality
  model: string
}
