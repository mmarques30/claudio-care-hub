import { CarouselState, SavedCarousel } from './types'

const STORAGE_KEY = 'carousel-studio-drafts'

export function saveDraft(state: CarouselState): void {
  const drafts = getDrafts()
  const existing = drafts.findIndex(d => d.id === state.id)
  const saved: SavedCarousel = {
    id: state.id,
    name: state.name,
    updatedAt: new Date().toISOString(),
    state,
  }

  if (existing >= 0) {
    drafts[existing] = saved
  } else {
    drafts.unshift(saved)
  }

  // Keep max 20 drafts
  const trimmed = drafts.slice(0, 20)
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed))
  } catch {
    // Storage full, remove oldest
    trimmed.pop()
    localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed))
  }
}

export function getDrafts(): SavedCarousel[] {
  try {
    const data = localStorage.getItem(STORAGE_KEY)
    return data ? JSON.parse(data) : []
  } catch {
    return []
  }
}

export function deleteDraft(id: string): void {
  const drafts = getDrafts().filter(d => d.id !== id)
  localStorage.setItem(STORAGE_KEY, JSON.stringify(drafts))
}

export function loadDraft(id: string): CarouselState | null {
  const draft = getDrafts().find(d => d.id === id)
  return draft?.state || null
}
