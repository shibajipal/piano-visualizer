import { useEffect } from 'react'
import { pianoStore } from '../store/pianoStore'
import { KEY_TO_NOTE } from '../constants/keyMap'

export function useKeyboardInput(): void {
  useEffect(() => {
    const held = new Set<string>()

    const onDown = (e: KeyboardEvent) => {
      if (e.repeat) return
      const raw = e.key.length === 1 ? e.key.toLowerCase() : e.key
      const noteId = KEY_TO_NOTE[raw]
      if (!noteId || held.has(noteId)) return
      held.add(noteId)
      pianoStore.noteOn(noteId, 'keyboard')
    }

    const onUp = (e: KeyboardEvent) => {
      const raw = e.key.length === 1 ? e.key.toLowerCase() : e.key
      const noteId = KEY_TO_NOTE[raw]
      if (!noteId) return
      held.delete(noteId)
      pianoStore.noteOff(noteId, 'keyboard')
    }

    const onBlur = () => {
      held.clear()
      pianoStore.releaseAll('keyboard')
    }

    window.addEventListener('keydown', onDown)
    window.addEventListener('keyup', onUp)
    window.addEventListener('blur', onBlur)
    return () => {
      window.removeEventListener('keydown', onDown)
      window.removeEventListener('keyup', onUp)
      window.removeEventListener('blur', onBlur)
      onBlur()
    }
  }, [])
}
