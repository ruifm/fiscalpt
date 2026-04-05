import { useCallback, useState, useSyncExternalStore } from 'react'

type AnswerMap = Record<string, string | number | boolean>

export interface AnswerHistoryState {
  current: AnswerMap
  canUndo: boolean
  canRedo: boolean
}

const MAX_HISTORY = 50

function createStore(initial: AnswerMap) {
  let history: AnswerMap[] = [{ ...initial }]
  let pointer = 0
  const listeners = new Set<() => void>()

  function getSnapshot(): AnswerHistoryState {
    return {
      current: history[pointer],
      canUndo: pointer > 0,
      canRedo: pointer < history.length - 1,
    }
  }

  // Cache to return stable reference when nothing changed
  let cached: AnswerHistoryState = getSnapshot()

  function emit() {
    cached = getSnapshot()
    for (const l of listeners) l()
  }

  return {
    subscribe(listener: () => void) {
      listeners.add(listener)
      return () => listeners.delete(listener)
    },

    getSnapshot() {
      return cached
    },

    set(id: string, value: string | number | boolean) {
      // Discard any redo entries
      history = history.slice(0, pointer + 1)
      const next = { ...history[pointer], [id]: value }
      history.push(next)
      pointer++

      // Cap history size
      if (history.length > MAX_HISTORY) {
        const excess = history.length - MAX_HISTORY
        history = history.slice(excess)
        pointer -= excess
      }

      emit()
    },

    undo() {
      if (pointer <= 0) return
      pointer--
      emit()
    },

    redo() {
      if (pointer >= history.length - 1) return
      pointer++
      emit()
    },
  }
}

export function useAnswerHistory(initial: AnswerMap) {
  const [store] = useState(() => createStore(initial))

  const state = useSyncExternalStore(store.subscribe, store.getSnapshot, store.getSnapshot)

  const set = useCallback(
    (id: string, value: string | number | boolean) => store.set(id, value),
    [store],
  )
  const undo = useCallback(() => store.undo(), [store])
  const redo = useCallback(() => store.redo(), [store])

  return { state, set, undo, redo }
}
