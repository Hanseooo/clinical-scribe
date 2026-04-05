import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useUnsavedWarning } from './useUnsavedWarning'

describe('useUnsavedWarning', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('adds beforeunload listener when isDirty is true', () => {
    const addSpy = vi.spyOn(window, 'addEventListener')

    renderHook(() => useUnsavedWarning(true))

    expect(addSpy).toHaveBeenCalledWith('beforeunload', expect.any(Function))
  })

  it('does not add beforeunload listener when isDirty is false', () => {
    const addSpy = vi.spyOn(window, 'addEventListener')

    renderHook(() => useUnsavedWarning(false))

    expect(addSpy).not.toHaveBeenCalledWith('beforeunload', expect.any(Function))
  })

  it('removes beforeunload listener on unmount', () => {
    const removeSpy = vi.spyOn(window, 'removeEventListener')

    const { unmount } = renderHook(() => useUnsavedWarning(true))
    unmount()

    expect(removeSpy).toHaveBeenCalledWith('beforeunload', expect.any(Function))
  })

  it('calls preventDefault on beforeunload event', () => {
    renderHook(() => useUnsavedWarning(true))

    const event = new Event('beforeunload') as BeforeUnloadEvent
    const preventDefaultSpy = vi.spyOn(event, 'preventDefault')

    window.dispatchEvent(event)

    expect(preventDefaultSpy).toHaveBeenCalled()
  })

  it('removes old listener and adds new one when isDirty toggles', () => {
    const addSpy = vi.spyOn(window, 'addEventListener')
    const removeSpy = vi.spyOn(window, 'removeEventListener')

    const { rerender } = renderHook(({ dirty }) => useUnsavedWarning(dirty), {
      initialProps: { dirty: true },
    })

    expect(addSpy).toHaveBeenCalledWith('beforeunload', expect.any(Function))

    rerender({ dirty: false })

    expect(removeSpy).toHaveBeenCalledWith('beforeunload', expect.any(Function))
    expect(addSpy).toHaveBeenCalledTimes(1)
  })
})
