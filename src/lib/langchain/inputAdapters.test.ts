import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { adaptRequest, uploadToGeminiFileApi, deleteFromGeminiFileApi } from './inputAdapters'
import type { GenerateRequest } from './inputAdapters'
import { isbarTemplate } from '@/lib/templates/isbar'

vi.mock('@/lib/templates/isbar', () => ({
  isbarTemplate: {
    id: 'isbar',
    name: 'ISBAR',
    sections: ['Identity', 'Situation', 'Background', 'Assessment', 'Recommendation'],
    systemPrompt: 'test prompt',
    sectionInstructions: 'test instructions',
  },
}))

const fetchMock = vi.fn()
const originalFetch = globalThis.fetch

describe('inputAdapters', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    fetchMock.mockReset()
    globalThis.fetch = fetchMock
    process.env.GEMINI_API_KEY = 'test-api-key'
    process.env.GEMINI_API_BASE_URL = 'https://generativelanguage.googleapis.com'
  })

  afterEach(() => {
    globalThis.fetch = originalFetch
  })

  describe('adaptRequest', () => {
    it('returns ChainInput with text for text modality', async () => {
      const req: GenerateRequest = {
        modality: 'text',
        text: 'Patient is stable.',
        template: 'isbar',
        outputLanguage: 'en',
      }

      const result = await adaptRequest(req, isbarTemplate)

      expect(result.modality).toBe('text')
      expect(result.text).toBe('Patient is stable.')
      expect(result.template).toEqual(isbarTemplate)
      expect(result.outputLanguage).toBe('en')
      expect(result.audioFileUri).toBeUndefined()
    })

    it('throws error for text modality without text content', async () => {
      const req: GenerateRequest = {
        modality: 'text',
        template: 'isbar',
        outputLanguage: 'en',
      }

      await expect(adaptRequest(req, isbarTemplate)).rejects.toThrow(
        'Text modality requires text content',
      )
    })

    it('uploads audio and returns ChainInput with fileUri for audio modality', async () => {
      fetchMock
        .mockResolvedValueOnce({
          ok: true,
          headers: { get: vi.fn().mockReturnValue('https://upload.example.com/file') },
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ uri: 'files/abc123' }),
        })

      const req: GenerateRequest = {
        modality: 'audio-record',
        audioBase64: Buffer.from('test audio data').toString('base64'),
        template: 'isbar',
        outputLanguage: 'en',
      }

      const result = await adaptRequest(req, isbarTemplate)

      expect(result.modality).toBe('audio-record')
      expect(result.audioFileUri).toBe('files/abc123')
      expect(result.template).toEqual(isbarTemplate)
      expect(result.text).toBeUndefined()
    })

    it('throws error for audio modality without audioBase64', async () => {
      const req: GenerateRequest = {
        modality: 'audio-upload',
        template: 'isbar',
        outputLanguage: 'en',
      }

      await expect(adaptRequest(req, isbarTemplate)).rejects.toThrow(
        'Audio modality requires audioBase64 content',
      )
    })
  })

  describe('uploadToGeminiFileApi', () => {
    it('uploads audio and returns file URI', async () => {
      fetchMock
        .mockResolvedValueOnce({
          ok: true,
          headers: { get: vi.fn().mockReturnValue('https://upload.example.com/file') },
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ uri: 'files/test123' }),
        })

      const result = await uploadToGeminiFileApi('dGVzdCBhdWRpbw==')

      expect(result).toBe('files/test123')
      expect(fetchMock).toBeCalledTimes(2)
    })

    it('throws error when upload initiation fails', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: false,
        statusText: 'Unauthorized',
      })

      await expect(uploadToGeminiFileApi('dGVzdA==')).rejects.toThrow(
        'Failed to initiate file upload',
      )
    })

    it('throws error when upload URL is missing', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: true,
        headers: { get: vi.fn().mockReturnValue(null) },
      })

      await expect(uploadToGeminiFileApi('dGVzdA==')).rejects.toThrow(
        'No upload URL returned from Gemini File API',
      )
    })
  })

  describe('deleteFromGeminiFileApi', () => {
    it('deletes file successfully', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: true,
      })

      await expect(deleteFromGeminiFileApi('files/abc123')).resolves.not.toThrow()
    })

    it('throws error when delete fails', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: false,
        statusText: 'Not Found',
      })

      await expect(deleteFromGeminiFileApi('files/abc123')).rejects.toThrow(
        'Failed to delete file from Gemini',
      )
    })
  })
})
