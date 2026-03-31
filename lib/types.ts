export interface Slide {
  id: string
  title: string
  body: string
  quote: string
  emoji: string
}

export interface ColorConfig {
  background: string
  text: string
  textSecondary: string
  accent: string
}

export interface FontConfig {
  heading: string
  body: string
}

export type BackgroundType = 'solid' | 'gradient' | 'pattern'
export type PatternType = 'dots' | 'lines' | 'grid'

export interface BackgroundConfig {
  type: BackgroundType
  color1: string
  color2: string
  pattern: PatternType
}

export type TemplateId = 'educational' | 'provocative' | 'data-trends' | 'storytelling'
export type FormatType = '1080x1080' | '1080x1350'

export interface CarouselState {
  id: string
  name: string
  slides: Slide[]
  activeSlideIndex: number
  template: TemplateId
  format: FormatType
  colors: ColorConfig
  fonts: FontConfig
  background: BackgroundConfig
  showSlideNumbers: boolean
  logo: string | null
  ctaHandle: string
  ctaText: string
  profileImage: string | null
}

export interface SavedCarousel {
  id: string
  name: string
  updatedAt: string
  state: CarouselState
}

export interface TemplateConfig {
  id: TemplateId
  name: string
  description: string
  defaults: {
    colors: ColorConfig
    fonts: FontConfig
    background: BackgroundConfig
  }
}

export type SlideType = 'cover' | 'content' | 'cta'
