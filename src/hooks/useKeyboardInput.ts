import { useEffect } from 'react'
import { pianoStore } from '../store/pianoStore'

// QWERTY mapped to C4–E5 only (17 notes — practical keyboard limit)
const KEY_MAP: Record<string, string> = {
  'a': 'C4',  'w': 'C#4',
  's': 'D4',  'e': 'D#4',
  'd': 'E4',
  'f': 'F4',  't': 'F#4',
  'g': 'G4',  'y': 'G#4',
  'h': 'A4',  'u': 'A#4',
  'j': 'B4',
  'k': 'C5',  'o': 'C#5',
  'l': 'D5',  'p': 'D#5',
  ';': 'E5',
}

export function useKeyboardInput(): void {
  useEffect(() => {
    const held = new Set<string>()

    const onDown = (e: KeyboardEvent) => {
      if (e.repeat) return
      const raw = e.key.length === 1 ? e.key.toLowerCase() : e.key
      const noteId = KEY_MAP[raw]
      if (!noteId || held.has(noteId)) return
      held.add(noteId)
      pianoStore.noteOn(noteId, 'keyboard')
    }

    const onUp = (e: KeyboardEvent) => {
      const raw = e.key.length === 1 ? e.key.toLowerCase() : e.key
      const noteId = KEY_MAP[raw]
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
