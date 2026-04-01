import { useEffect } from 'react'

interface KeyboardHandlers {
  onSave: () => void
  onExport: () => void
  onPrevSlide: () => void
  onNextSlide: () => void
}

export function useKeyboardShortcuts(handlers: KeyboardHandlers) {
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      const isCtrlOrCmd = e.ctrlKey || e.metaKey
      const target = e.target as HTMLElement
      const isInput = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA'

      if (isCtrlOrCmd && e.key === 's') {
        e.preventDefault()
        handlers.onSave()
      }

      if (isCtrlOrCmd && e.key === 'e') {
        e.preventDefault()
        handlers.onExport()
      }

      if (!isInput) {
        if (e.key === 'ArrowLeft') {
          e.preventDefault()
          handlers.onPrevSlide()
        }
        if (e.key === 'ArrowRight') {
          e.preventDefault()
          handlers.onNextSlide()
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handlers])
}
