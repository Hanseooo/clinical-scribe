import type { InputModality, TemplateId, OutputLanguage } from '@/types'
import type { HandoverTemplate } from '@/types'

export interface GenerateRequest {
  modality: InputModality
  audioBase64?: string
  text?: string
  template: TemplateId
  outputLanguage: OutputLanguage
}

export interface ChainInput {
  modality: InputModality
  audioFileUri?: string
  text?: string
  template: HandoverTemplate
  outputLanguage: OutputLanguage
}

export interface ChainOutput {
  source: string
  handover: string
}

async function geminiApiUrl(path: string): Promise<string> {
  const baseUrl = process.env.GEMINI_API_BASE_URL ?? 'https://generativelanguage.googleapis.com'
  const apiKey = process.env.GEMINI_API_KEY
  return `${baseUrl}/${path}?key=${apiKey}`
}

export async function uploadToGeminiFileApi(audioBase64: string): Promise<string> {
  const binaryData = Buffer.from(audioBase64, 'base64')

  const uploadUrl = await geminiApiUrl('upload/v1beta/files')

  const response = await fetch(uploadUrl, {
    method: 'POST',
    headers: {
      'X-Goog-Upload-Protocol': 'resumable',
      'X-Goog-Upload-Command': 'start',
      'X-Goog-Upload-Header-Content-Length': String(binaryData.length),
      'X-Goog-Upload-Header-Content-Type': 'audio/wav',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      file: {
        displayName: 'clinical-recording.wav',
        mimeType: 'audio/wav',
      },
    }),
  })

  if (!response.ok) {
    throw new Error(`Failed to initiate file upload: ${response.statusText}`)
  }

  const uploadUrl2 = response.headers.get('x-goog-upload-url')
  if (!uploadUrl2) {
    throw new Error('No upload URL returned from Gemini File API')
  }

  const uploadResponse = await fetch(uploadUrl2, {
    method: 'POST',
    headers: {
      'Content-Length': String(binaryData.length),
      'X-Goog-Upload-Command': 'upload, finalize',
      'Content-Type': 'application/octet-stream',
    },
    body: binaryData,
  })

  if (!uploadResponse.ok) {
    throw new Error(`Failed to upload file data: ${uploadResponse.statusText}`)
  }

  const result = (await uploadResponse.json()) as { uri: string }
  return result.uri
}

export async function deleteFromGeminiFileApi(fileUri: string): Promise<void> {
  const name = fileUri.replace('files/', '')
  const deleteUrl = await geminiApiUrl(`v1beta/files/${name}`)

  const response = await fetch(deleteUrl, {
    method: 'DELETE',
  })

  if (!response.ok) {
    throw new Error(`Failed to delete file from Gemini: ${response.statusText}`)
  }
}

export async function adaptRequest(
  req: GenerateRequest,
  template: HandoverTemplate,
): Promise<ChainInput> {
  if (req.modality === 'text') {
    if (!req.text) {
      throw new Error('Text modality requires text content')
    }
    return {
      modality: 'text',
      text: req.text,
      template,
      outputLanguage: req.outputLanguage,
    }
  }

  if (!req.audioBase64) {
    throw new Error('Audio modality requires audioBase64 content')
  }

  const fileUri = await uploadToGeminiFileApi(req.audioBase64)

  return {
    modality: req.modality,
    audioFileUri: fileUri,
    template,
    outputLanguage: req.outputLanguage,
  }
}
