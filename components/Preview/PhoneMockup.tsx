"use client"

import React, { useState } from 'react'
import { useCarousel } from '@/lib/carousel-context'
import { SlideType } from '@/lib/types'
import SlideRenderer from './SlideRenderer'
import { ChevronLeft, ChevronRight } from 'lucide-react'

function getSlideType(index: number, total: number): SlideType {
  if (index === 0) return 'cover'
  if (index === total - 1) return 'cta'
  return 'content'
}

export default function PhoneMockup() {
  const { state } = useCarousel()
  const [currentSlide, setCurrentSlide] = useState(0)

  const slide = state.slides[currentSlide]
  if (!slide) return null

  const width = 1080
  const height = state.format === '1080x1080' ? 1080 : 1350
  const phoneWidth = 280
  const scale = phoneWidth / width

  return (
    <div className="flex flex-col items-center">
      {/* Phone frame */}
      <div className="relative bg-black rounded-[36px] p-3 shadow-2xl">
        {/* Notch */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-24 h-6 bg-black rounded-b-2xl z-10" />

        <div className="bg-white rounded-[24px] overflow-hidden relative" style={{ width: `${phoneWidth}px` }}>
          {/* Status bar */}
          <div className="h-8 bg-white flex items-center justify-between px-4">
            <span className="text-[8px] text-black/60 font-medium">9:41</span>
            <div className="flex gap-1">
              <div className="w-3 h-1.5 bg-black/40 rounded-sm" />
              <div className="w-1.5 h-1.5 bg-black/40 rounded-full" />
            </div>
          </div>

          {/* Instagram header mock */}
          <div className="h-8 bg-white border-b border-gray-100 flex items-center px-3">
            <div className="w-5 h-5 rounded-full bg-gradient-to-br from-purple-500 to-orange-400" />
            <span className="text-[9px] font-semibold text-black ml-2">{state.ctaHandle.replace('@', '')}</span>
          </div>

          {/* Slide content */}
          <div className="relative" style={{ height: `${height * scale}px` }}>
            <SlideRenderer
              slide={slide}
              slideIndex={currentSlide}
              totalSlides={state.slides.length}
              state={state}
              slideType={getSlideType(currentSlide, state.slides.length)}
              scale={scale}
            />
          </div>

          {/* Carousel dots */}
          <div className="h-8 bg-white flex items-center justify-center gap-1">
            {state.slides.map((_, i) => (
              <div
                key={i}
                className={`w-1 h-1 rounded-full ${i === currentSlide ? 'bg-blue-500' : 'bg-gray-300'}`}
              />
            ))}
          </div>

          {/* Instagram actions mock */}
          <div className="h-10 bg-white px-3 flex items-center gap-3">
            <div className="w-5 h-5 border-2 border-black/70 rounded-sm" />
            <div className="w-5 h-5 border-2 border-black/70 rounded-full" />
            <div className="w-5 h-5 border-2 border-black/70 rounded-sm rotate-45 scale-75" />
            <div className="flex-1" />
            <div className="w-5 h-5 border-2 border-black/70 rounded-sm" />
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex items-center gap-3 mt-4">
        <button
          onClick={() => setCurrentSlide(Math.max(0, currentSlide - 1))}
          disabled={currentSlide === 0}
          className="p-1 rounded hover:bg-accent disabled:opacity-30"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <span className="text-xs text-muted-foreground">
          {currentSlide + 1} / {state.slides.length}
        </span>
        <button
          onClick={() => setCurrentSlide(Math.min(state.slides.length - 1, currentSlide + 1))}
          disabled={currentSlide === state.slides.length - 1}
          className="p-1 rounded hover:bg-accent disabled:opacity-30"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}
