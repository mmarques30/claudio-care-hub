"use client"

import React from 'react'
import { useCarousel } from '@/lib/carousel-context'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { SlideType } from '@/lib/types'

function getSlideType(index: number, total: number): SlideType {
  if (index === 0) return 'cover'
  if (index === total - 1) return 'cta'
  return 'content'
}

export default function SlideEditor() {
  const { state, dispatch } = useCarousel()
  const { activeSlideIndex, slides } = state
  const slide = slides[activeSlideIndex]
  const slideType = getSlideType(activeSlideIndex, slides.length)

  if (!slide) return null

  function update(field: string, value: string) {
    dispatch({ type: 'UPDATE_SLIDE', payload: { index: activeSlideIndex, slide: { [field]: value } } })
  }

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          {slideType === 'cover' ? 'Capa' : slideType === 'cta' ? 'Slide Final (CTA)' : `Slide ${activeSlideIndex + 1}`}
        </span>
      </div>

      <div className="space-y-2">
        <Label className="text-xs">Emoji / Ícone</Label>
        <Input
          value={slide.emoji}
          onChange={e => update('emoji', e.target.value)}
          placeholder="Ex: ✨ 🚀 1️⃣"
          className="h-9 text-sm"
        />
      </div>

      <div className="space-y-2">
        <Label className="text-xs">Título</Label>
        <Input
          value={slide.title}
          onChange={e => update('title', e.target.value)}
          placeholder="Título do slide"
          className="h-9 text-sm"
        />
      </div>

      <div className="space-y-2">
        <Label className="text-xs">
          {slideType === 'cover' ? 'Subtítulo' : slideType === 'cta' ? 'Texto do CTA' : 'Corpo do texto'}
        </Label>
        <Textarea
          value={slide.body}
          onChange={e => update('body', e.target.value)}
          placeholder={slideType === 'cover' ? 'Subtítulo ou descrição breve...' : 'Conteúdo do slide...'}
          className="text-sm min-h-[100px] resize-none"
        />
      </div>

      {slideType === 'content' && (
        <div className="space-y-2">
          <Label className="text-xs">Destaque / Citação (opcional)</Label>
          <Textarea
            value={slide.quote}
            onChange={e => update('quote', e.target.value)}
            placeholder="Texto em destaque..."
            className="text-sm min-h-[60px] resize-none"
          />
        </div>
      )}

      {slideType === 'cta' && (
        <>
          <div className="space-y-2">
            <Label className="text-xs">Arroba do perfil</Label>
            <Input
              value={state.ctaHandle}
              onChange={e => dispatch({ type: 'SET_CTA', payload: { handle: e.target.value } })}
              placeholder="@seuperfil"
              className="h-9 text-sm"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-xs">Texto de CTA</Label>
            <Input
              value={state.ctaText}
              onChange={e => dispatch({ type: 'SET_CTA', payload: { text: e.target.value } })}
              placeholder="Siga para mais conteúdo"
              className="h-9 text-sm"
            />
          </div>
        </>
      )}
    </div>
  )
}
