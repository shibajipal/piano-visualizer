import { useEffect } from 'react'
import { pianoStore } from '../store/pianoStore'
import { KEY_TO_NOTE } from '../constants/keyMap'

export function useKeyboardInput(): void {
  useEffect(() => {
    // Map of physical key code -> currently playing noteId
    const held = new Map<string, string>()

    const onDown = (e: KeyboardEvent) => {
      if (e.repeat || e.ctrlKey || e.metaKey) return
      
      const raw = e.key.length === 1 ? e.key.toLowerCase() : e.key
      let noteId = KEY_TO_NOTE[raw]
      if (!noteId) return

      // Apply modifiers to shift octaves
      if (e.shiftKey || e.altKey) {
        const match = noteId.match(/^([A-G]#?)(\d)$/)
        if (match) {
          const noteStr = match[1]
          let octave = parseInt(match[2], 10)
          if (e.shiftKey) octave += 1
          if (e.altKey) octave -= 1
          noteId = `${noteStr}${octave}`
        }
      }

      if (held.has(e.code)) return
      held.set(e.code, noteId)
      pianoStore.noteOn(noteId, 'keyboard')
    }

    const onUp = (e: KeyboardEvent) => {
      const noteId = held.get(e.code)
      if (!noteId) return
      held.delete(e.code)
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
