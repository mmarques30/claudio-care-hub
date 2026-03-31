"use client"

import React, { useRef, useEffect, useState } from 'react'
import { useCarousel } from '@/lib/carousel-context'
import { SlideType } from '@/lib/types'
import SlideRenderer from './SlideRenderer'

function getSlideType(index: number, total: number): SlideType {
  if (index === 0) return 'cover'
  if (index === total - 1) return 'cta'
  return 'content'
}

export default function SlidePreview() {
  const { state } = useCarousel()
  const containerRef = useRef<HTMLDivElement>(null)
  const [scale, setScale] = useState(0.5)

  const slide = state.slides[state.activeSlideIndex]
  const slideType = getSlideType(state.activeSlideIndex, state.slides.length)
  const width = 1080
  const height = state.format === '1080x1080' ? 1080 : 1350

  useEffect(() => {
    function updateScale() {
      if (!containerRef.current) return
      const rect = containerRef.current.getBoundingClientRect()
      const padding = 48
      const availW = rect.width - padding * 2
      const availH = rect.height - padding * 2
      const scaleX = availW / width
      const scaleY = availH / height
      setScale(Math.min(scaleX, scaleY, 1))
    }

    updateScale()
    const observer = new ResizeObserver(updateScale)
    if (containerRef.current) observer.observe(containerRef.current)
    return () => observer.disconnect()
  }, [width, height])

  if (!slide) return null

  return (
    <div ref={containerRef} className="flex-1 flex items-center justify-center bg-background overflow-hidden">
      <div
        className="rounded-lg shadow-2xl overflow-hidden"
        style={{
          width: `${width * scale}px`,
          height: `${height * scale}px`,
        }}
      >
        <SlideRenderer
          slide={slide}
          slideIndex={state.activeSlideIndex}
          totalSlides={state.slides.length}
          state={state}
          slideType={slideType}
          scale={scale}
        />
      </div>
    </div>
  )
}
