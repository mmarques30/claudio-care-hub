"use client"

import React from 'react'
import { Slide, CarouselState, SlideType } from '@/lib/types'
import { getFontFamily } from '@/lib/fonts'

interface SlideRendererProps {
  slide: Slide
  slideIndex: number
  totalSlides: number
  state: CarouselState
  slideType: SlideType
  scale?: number
}

function getBackgroundStyle(state: CarouselState): React.CSSProperties {
  const { background, colors } = state
  if (background.type === 'gradient') {
    return { background: `linear-gradient(135deg, ${background.color1}, ${background.color2})` }
  }
  return { backgroundColor: colors.background }
}

function getPatternOverlay(state: CarouselState): React.ReactNode {
  if (state.background.type !== 'pattern') return null
  const color = state.colors.textSecondary + '15'
  const patterns: Record<string, React.CSSProperties> = {
    dots: {
      backgroundImage: `radial-gradient(circle, ${color} 1px, transparent 1px)`,
      backgroundSize: '24px 24px',
    },
    lines: {
      backgroundImage: `repeating-linear-gradient(0deg, transparent, transparent 23px, ${color} 23px, ${color} 24px)`,
    },
    grid: {
      backgroundImage: `
        linear-gradient(${color} 1px, transparent 1px),
        linear-gradient(90deg, ${color} 1px, transparent 1px)
      `,
      backgroundSize: '40px 40px',
    },
  }
  return (
    <div
      className="absolute inset-0 pointer-events-none"
      style={patterns[state.background.pattern] || {}}
    />
  )
}

function CoverSlide({ slide, state, totalSlides }: {
  slide: Slide; state: CarouselState; totalSlides: number
}) {
  const isEducational = state.template === 'educational'
  const isProvocative = state.template === 'provocative'
  const isDataTrends = state.template === 'data-trends'

  return (
    <div className="relative flex flex-col items-center justify-center h-full p-[80px] text-center">
      {/* Decorative elements based on template */}
      {isEducational && (
        <div className="absolute top-[60px] left-[60px] w-[80px] h-[80px] rounded-full border-2 opacity-20"
          style={{ borderColor: state.colors.accent }} />
      )}
      {isProvocative && (
        <div className="absolute top-0 left-0 w-full h-[6px]"
          style={{ backgroundColor: state.colors.accent }} />
      )}
      {isDataTrends && (
        <div className="absolute top-[80px] right-[80px] w-[1px] h-[120px]"
          style={{ backgroundColor: state.colors.accent }} />
      )}

      {slide.emoji && (
        <div className="mb-[32px] text-[64px] leading-none">{slide.emoji}</div>
      )}
      <h1
        className="leading-[1.1] font-bold mb-[24px]"
        style={{
          fontFamily: getFontFamily(state.fonts.heading),
          fontSize: isProvocative ? '72px' : '56px',
          color: state.colors.text,
          letterSpacing: isProvocative ? '-2px' : '-1px',
          textTransform: isProvocative ? 'uppercase' : 'none',
        }}
      >
        {slide.title}
      </h1>
      {slide.body && (
        <p
          style={{
            fontFamily: getFontFamily(state.fonts.body),
            fontSize: '24px',
            color: state.colors.textSecondary,
            lineHeight: 1.5,
            maxWidth: '80%',
          }}
        >
          {slide.body}
        </p>
      )}

      {/* Bottom accent line for some templates */}
      {isDataTrends && (
        <div className="absolute bottom-[80px] left-1/2 -translate-x-1/2 w-[60px] h-[3px]"
          style={{ backgroundColor: state.colors.accent }} />
      )}
    </div>
  )
}

function ContentSlide({ slide, slideIndex, totalSlides, state }: {
  slide: Slide; slideIndex: number; totalSlides: number; state: CarouselState
}) {
  const isEducational = state.template === 'educational'
  const isProvocative = state.template === 'provocative'
  const isDataTrends = state.template === 'data-trends'
  const isStorytelling = state.template === 'storytelling'

  return (
    <div className="relative flex flex-col justify-center h-full p-[80px]">
      {/* Educational: step number accent */}
      {isEducational && (
        <div
          className="flex items-center justify-center w-[56px] h-[56px] rounded-full mb-[32px] font-bold text-[24px]"
          style={{
            backgroundColor: state.colors.accent + '20',
            color: state.colors.accent,
            fontFamily: getFontFamily(state.fonts.heading),
          }}
        >
          {slideIndex}
        </div>
      )}

      {/* Provocative: accent bar */}
      {isProvocative && (
        <div className="w-[48px] h-[4px] mb-[32px]" style={{ backgroundColor: state.colors.accent }} />
      )}

      {/* Data Trends: large number */}
      {isDataTrends && slide.emoji && (
        <div
          className="mb-[16px] font-bold leading-none"
          style={{
            fontFamily: getFontFamily(state.fonts.heading),
            fontSize: '80px',
            color: state.colors.accent,
          }}
        >
          {slide.emoji}
        </div>
      )}

      {/* Storytelling: subtle quote mark */}
      {isStorytelling && slideIndex === 1 && (
        <div
          className="text-[120px] leading-none opacity-10 absolute top-[40px] left-[60px]"
          style={{ color: state.colors.accent, fontFamily: 'Georgia, serif' }}
        >
          &ldquo;
        </div>
      )}

      {(!isDataTrends || !slide.emoji) && slide.emoji && (
        <div className="mb-[20px] text-[40px] leading-none">{slide.emoji}</div>
      )}

      <h2
        className="font-bold mb-[20px] leading-[1.15]"
        style={{
          fontFamily: getFontFamily(state.fonts.heading),
          fontSize: isProvocative ? '48px' : isDataTrends ? '40px' : '36px',
          color: state.colors.text,
          letterSpacing: isProvocative ? '-1.5px' : '-0.5px',
          textTransform: isProvocative ? 'uppercase' : 'none',
        }}
      >
        {slide.title}
      </h2>

      <p
        className="leading-[1.7]"
        style={{
          fontFamily: getFontFamily(state.fonts.body),
          fontSize: isProvocative ? '22px' : '20px',
          color: state.colors.textSecondary,
        }}
      >
        {slide.body}
      </p>

      {slide.quote && (
        <div
          className="mt-[32px] pl-[20px] border-l-[3px]"
          style={{
            borderColor: state.colors.accent,
            fontFamily: getFontFamily(state.fonts.body),
            fontSize: '18px',
            color: state.colors.text,
            fontStyle: isDataTrends ? 'italic' : 'normal',
            lineHeight: 1.6,
          }}
        >
          {slide.quote}
        </div>
      )}

      {/* Thin separator for Data Trends */}
      {isDataTrends && (
        <div className="absolute bottom-[80px] left-[80px] w-[40px] h-[1px]"
          style={{ backgroundColor: state.colors.textSecondary + '40' }} />
      )}
    </div>
  )
}

function CTASlide({ slide, state }: { slide: Slide; state: CarouselState }) {
  const isProvocative = state.template === 'provocative'

  return (
    <div className="relative flex flex-col items-center justify-center h-full p-[80px] text-center">
      {isProvocative && (
        <div className="absolute bottom-0 left-0 w-full h-[6px]"
          style={{ backgroundColor: state.colors.accent }} />
      )}

      {/* Profile image or placeholder */}
      <div
        className="w-[96px] h-[96px] rounded-full mb-[32px] flex items-center justify-center overflow-hidden"
        style={{
          backgroundColor: state.colors.accent + '20',
          border: `3px solid ${state.colors.accent}`,
        }}
      >
        {state.profileImage ? (
          <img src={state.profileImage} alt="" className="w-full h-full object-cover" />
        ) : (
          <span style={{ fontSize: '40px', color: state.colors.accent }}>
            {slide.emoji || '👤'}
          </span>
        )}
      </div>

      <h2
        className="font-bold mb-[16px] leading-[1.2]"
        style={{
          fontFamily: getFontFamily(state.fonts.heading),
          fontSize: '40px',
          color: state.colors.text,
          letterSpacing: '-1px',
        }}
      >
        {slide.title}
      </h2>

      <p
        className="mb-[32px]"
        style={{
          fontFamily: getFontFamily(state.fonts.body),
          fontSize: '22px',
          color: state.colors.textSecondary,
          lineHeight: 1.5,
        }}
      >
        {state.ctaText || slide.body}
      </p>

      <div
        className="px-[32px] py-[14px] rounded-full font-semibold"
        style={{
          backgroundColor: state.colors.accent,
          color: state.colors.background,
          fontFamily: getFontFamily(state.fonts.body),
          fontSize: '20px',
        }}
      >
        {state.ctaHandle}
      </div>
    </div>
  )
}

export default function SlideRenderer({
  slide,
  slideIndex,
  totalSlides,
  state,
  slideType,
  scale = 1,
}: SlideRendererProps) {
  const width = 1080
  const height = state.format === '1080x1080' ? 1080 : 1350

  return (
    <div
      style={{
        width: `${width}px`,
        height: `${height}px`,
        transform: scale !== 1 ? `scale(${scale})` : undefined,
        transformOrigin: 'top left',
        ...getBackgroundStyle(state),
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {getPatternOverlay(state)}

      {slideType === 'cover' && <CoverSlide slide={slide} state={state} totalSlides={totalSlides} />}
      {slideType === 'content' && <ContentSlide slide={slide} slideIndex={slideIndex} totalSlides={totalSlides} state={state} />}
      {slideType === 'cta' && <CTASlide slide={slide} state={state} />}

      {/* Slide number */}
      {state.showSlideNumbers && (
        <div
          className="absolute top-[40px] right-[40px]"
          style={{
            fontFamily: getFontFamily(state.fonts.body),
            fontSize: '16px',
            color: state.colors.textSecondary + '80',
            fontWeight: 500,
          }}
        >
          {String(slideIndex + 1).padStart(2, '0')}/{String(totalSlides).padStart(2, '0')}
        </div>
      )}

      {/* Logo/watermark */}
      {state.logo && (
        <div className="absolute bottom-[32px] right-[32px]">
          <img
            src={state.logo}
            alt=""
            style={{ height: '32px', width: 'auto', opacity: 0.6 }}
          />
        </div>
      )}
    </div>
  )
}
