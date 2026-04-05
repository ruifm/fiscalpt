// @vitest-environment jsdom
import { describe, it, expect } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useAnswerHistory } from '@/hooks/use-answer-history'

describe('useAnswerHistory', () => {
  it('initializes with the given state, canUndo=false, canRedo=false', () => {
    const initial = { q1: 'hello', q2: 42 }
    const { result } = renderHook(() => useAnswerHistory(initial))

    expect(result.current.state.current).toEqual(initial)
    expect(result.current.state.canUndo).toBe(false)
    expect(result.current.state.canRedo).toBe(false)
  })

  it('initializes with empty object when none given', () => {
    const { result } = renderHook(() => useAnswerHistory({}))

    expect(result.current.state.current).toEqual({})
    expect(result.current.state.canUndo).toBe(false)
    expect(result.current.state.canRedo).toBe(false)
  })

  it('set() updates current and enables undo', () => {
    const { result } = renderHook(() => useAnswerHistory({ q1: '' }))

    act(() => result.current.set('q1', 'new value'))

    expect(result.current.state.current).toEqual({ q1: 'new value' })
    expect(result.current.state.canUndo).toBe(true)
    expect(result.current.state.canRedo).toBe(false)
  })

  it('set() adds a new key if not present in initial', () => {
    const { result } = renderHook(() => useAnswerHistory({}))

    act(() => result.current.set('q1', true))

    expect(result.current.state.current).toEqual({ q1: true })
    expect(result.current.state.canUndo).toBe(true)
  })

  it('undo() restores previous state and enables redo', () => {
    const { result } = renderHook(() => useAnswerHistory({ q1: 'a' }))

    act(() => result.current.set('q1', 'b'))
    act(() => result.current.undo())

    expect(result.current.state.current).toEqual({ q1: 'a' })
    expect(result.current.state.canUndo).toBe(false)
    expect(result.current.state.canRedo).toBe(true)
  })

  it('redo() restores the undone state', () => {
    const { result } = renderHook(() => useAnswerHistory({ q1: 'a' }))

    act(() => result.current.set('q1', 'b'))
    act(() => result.current.undo())
    act(() => result.current.redo())

    expect(result.current.state.current).toEqual({ q1: 'b' })
    expect(result.current.state.canUndo).toBe(true)
    expect(result.current.state.canRedo).toBe(false)
  })

  it('redo stack is cleared after a new set()', () => {
    const { result } = renderHook(() => useAnswerHistory({ q1: 'a' }))

    act(() => result.current.set('q1', 'b'))
    act(() => result.current.set('q1', 'c'))
    act(() => result.current.undo()) // back to 'b'
    expect(result.current.state.canRedo).toBe(true)

    act(() => result.current.set('q1', 'd')) // new branch — redo gone
    expect(result.current.state.canRedo).toBe(false)
    expect(result.current.state.current).toEqual({ q1: 'd' })

    act(() => result.current.redo()) // no-op
    expect(result.current.state.current).toEqual({ q1: 'd' })
  })

  it('multiple undo steps work in sequence', () => {
    const { result } = renderHook(() => useAnswerHistory({ q1: 'a' }))

    act(() => result.current.set('q1', 'b'))
    act(() => result.current.set('q1', 'c'))
    act(() => result.current.set('q1', 'd'))

    act(() => result.current.undo())
    expect(result.current.state.current.q1).toBe('c')

    act(() => result.current.undo())
    expect(result.current.state.current.q1).toBe('b')

    act(() => result.current.undo())
    expect(result.current.state.current.q1).toBe('a')
    expect(result.current.state.canUndo).toBe(false)
  })

  it('undo at the beginning is a no-op', () => {
    const initial = { q1: 'a' }
    const { result } = renderHook(() => useAnswerHistory(initial))

    act(() => result.current.undo())

    expect(result.current.state.current).toEqual(initial)
    expect(result.current.state.canUndo).toBe(false)
    expect(result.current.state.canRedo).toBe(false)
  })

  it('redo at the end is a no-op', () => {
    const { result } = renderHook(() => useAnswerHistory({ q1: 'a' }))

    act(() => result.current.set('q1', 'b'))
    act(() => result.current.redo())

    expect(result.current.state.current).toEqual({ q1: 'b' })
    expect(result.current.state.canRedo).toBe(false)
  })

  it('caps history at 50 entries', () => {
    const { result } = renderHook(() => useAnswerHistory({ q1: 0 }))

    for (let i = 1; i <= 60; i++) {
      act(() => result.current.set('q1', i))
    }

    expect(result.current.state.current.q1).toBe(60)

    // Undo 49 times (50 entries means pointer goes from 49 down to 0)
    for (let i = 0; i < 49; i++) {
      act(() => result.current.undo())
    }
    expect(result.current.state.canUndo).toBe(false)
    // The oldest entry should be 11 (entries 1-10 were dropped)
    expect(result.current.state.current.q1).toBe(11)
  })

  it('handles multiple keys independently', () => {
    const { result } = renderHook(() => useAnswerHistory({ q1: 'a', q2: 'x' }))

    act(() => result.current.set('q1', 'b'))
    act(() => result.current.set('q2', 'y'))

    expect(result.current.state.current).toEqual({ q1: 'b', q2: 'y' })

    act(() => result.current.undo()) // undo q2
    expect(result.current.state.current).toEqual({ q1: 'b', q2: 'x' })

    act(() => result.current.undo()) // undo q1
    expect(result.current.state.current).toEqual({ q1: 'a', q2: 'x' })
  })

  it('set() with same value still creates a history entry', () => {
    const { result } = renderHook(() => useAnswerHistory({ q1: 'a' }))

    act(() => result.current.set('q1', 'a'))

    // Even setting the same value creates a snapshot (no dedup)
    expect(result.current.state.canUndo).toBe(true)
  })
})
