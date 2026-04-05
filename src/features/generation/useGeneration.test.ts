import { renderHook, act } from '@testing-library/react'
import { useGeneration } from './useGeneration'
import type { GenerateSuccessResponse } from './types'

const mockFetch = vi.fn()
const originalFetch = globalThis.fetch

describe('useGeneration', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    mockFetch.mockReset()
    globalThis.fetch = mockFetch
  })

  afterEach(() => {
    globalThis.fetch = originalFetch
  })

  it('starts with isLoading=false and error=null', () => {
    const { result } = renderHook(() => useGeneration())

    expect(result.current.isLoading).toBe(false)
    expect(result.current.error).toBeNull()
  })

  it('sets isLoading=true during fetch and false after success', async () => {
    const successResponse: GenerateSuccessResponse = {
      source: 'test source',
      handover: '# Test Handover',
      modality: 'text',
      model: 'gemini-2.5-flash',
    }

    let resolveFetch: (value: Response) => void
    const fetchPromise = new Promise<Response>((resolve) => {
      resolveFetch = resolve
    })

    mockFetch.mockReturnValueOnce(fetchPromise)

    const onSuccess = vi.fn()
    const { result } = renderHook(() => useGeneration({ onSuccess }))

    expect(result.current.isLoading).toBe(false)

    await act(async () => {
      result.current.generate({
        modality: 'text',
        text: 'Patient is stable.',
        template: 'isbar',
        outputLanguage: 'en',
      })
    })

    // Give React a chance to process the state update
    await new Promise((r) => setTimeout(r, 0))

    expect(result.current.isLoading).toBe(true)

    await act(async () => {
      resolveFetch!({
        ok: true,
        json: () => Promise.resolve(successResponse),
      } as Response)
    })

    expect(result.current.isLoading).toBe(false)
    expect(result.current.error).toBeNull()
    expect(onSuccess).toHaveBeenCalledWith(successResponse)
  })

  it('sets error state on API failure', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      json: () => Promise.resolve({ error: 'No text content', code: 'NO_CONTENT' }),
    })

    const onError = vi.fn()
    const { result } = renderHook(() => useGeneration({ onError }))

    await act(async () => {
      await result.current.generate({
        modality: 'text',
        text: '',
        template: 'isbar',
        outputLanguage: 'en',
      })
    })

    expect(result.current.isLoading).toBe(false)
    expect(result.current.error).toEqual({ error: 'No text content', code: 'NO_CONTENT' })
    expect(onError).toHaveBeenCalledWith({ error: 'No text content', code: 'NO_CONTENT' })
  })

  it('sets error state on network failure', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Network error'))

    const onError = vi.fn()
    const { result } = renderHook(() => useGeneration({ onError }))

    await act(async () => {
      await result.current.generate({
        modality: 'text',
        text: 'test',
        template: 'isbar',
        outputLanguage: 'en',
      })
    })

    expect(result.current.error).toEqual({
      error: 'Network error. Check your connection.',
      code: 'UNKNOWN',
    })
    expect(onError).toHaveBeenCalled()
  })

  it('resets error via resetError', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      json: () => Promise.resolve({ error: 'Test error', code: 'UNKNOWN' }),
    })

    const { result } = renderHook(() => useGeneration())

    await act(async () => {
      await result.current.generate({
        modality: 'text',
        text: 'test',
        template: 'isbar',
        outputLanguage: 'en',
      })
    })

    expect(result.current.error).not.toBeNull()

    act(() => {
      result.current.resetError()
    })

    expect(result.current.error).toBeNull()
  })
})
