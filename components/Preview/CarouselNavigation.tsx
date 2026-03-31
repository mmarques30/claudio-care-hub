"use client"

import React from 'react'
import { useCarousel } from '@/lib/carousel-context'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

export default function CarouselNavigation() {
  const { state, dispatch } = useCarousel()
  const { activeSlideIndex, slides } = state

  return (
    <div className="flex items-center justify-center gap-4 py-3 shrink-0">
      <button
        onClick={() => dispatch({ type: 'SET_ACTIVE_SLIDE', payload: activeSlideIndex - 1 })}
        disabled={activeSlideIndex === 0}
        className="p-1.5 rounded-md hover:bg-accent disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
      >
        <ChevronLeft className="w-5 h-5" />
      </button>

      <div className="flex items-center gap-1.5">
        {slides.map((_, i) => (
          <button
            key={i}
            onClick={() => dispatch({ type: 'SET_ACTIVE_SLIDE', payload: i })}
            className={cn(
              'w-2 h-2 rounded-full transition-all',
              i === activeSlideIndex
                ? 'bg-primary w-6'
                : 'bg-muted-foreground/30 hover:bg-muted-foreground/50'
            )}
          />
        ))}
      </div>

      <button
        onClick={() => dispatch({ type: 'SET_ACTIVE_SLIDE', payload: activeSlideIndex + 1 })}
        disabled={activeSlideIndex === slides.length - 1}
        className="p-1.5 rounded-md hover:bg-accent disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
      >
        <ChevronRight className="w-5 h-5" />
      </button>
    </div>
  )
}
