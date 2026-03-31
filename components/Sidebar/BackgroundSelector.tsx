"use client"

import React from 'react'
import { useCarousel } from '@/lib/carousel-context'
import { Label } from '@/components/ui/label'
import { BackgroundType, PatternType } from '@/lib/types'
import { cn } from '@/lib/utils'

const BG_TYPES: { value: BackgroundType; label: string }[] = [
  { value: 'solid', label: 'Sólido' },
  { value: 'gradient', label: 'Gradiente' },
  { value: 'pattern', label: 'Padrão' },
]

const PATTERNS: { value: PatternType; label: string }[] = [
  { value: 'dots', label: 'Pontos' },
  { value: 'lines', label: 'Linhas' },
  { value: 'grid', label: 'Grade' },
]

export default function BackgroundSelector() {
  const { state, dispatch } = useCarousel()

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label className="text-xs">Tipo de fundo</Label>
        <div className="flex gap-1">
          {BG_TYPES.map(t => (
            <button
              key={t.value}
              onClick={() => dispatch({ type: 'SET_BACKGROUND', payload: { type: t.value } })}
              className={cn(
                'flex-1 text-xs py-1.5 rounded-md border transition-colors',
                state.background.type === t.value
                  ? 'border-primary bg-primary/10 text-foreground'
                  : 'border-border text-muted-foreground hover:text-foreground'
              )}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {state.background.type === 'gradient' && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={state.background.color1}
              onChange={e => dispatch({ type: 'SET_BACKGROUND', payload: { color1: e.target.value } })}
              className="w-8 h-8 rounded-md border border-border cursor-pointer appearance-none [&::-webkit-color-swatch-wrapper]:p-0 [&::-webkit-color-swatch]:rounded-md [&::-webkit-color-swatch]:border-none"
            />
            <span className="text-xs text-muted-foreground">Cor 1</span>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={state.background.color2}
              onChange={e => dispatch({ type: 'SET_BACKGROUND', payload: { color2: e.target.value } })}
              className="w-8 h-8 rounded-md border border-border cursor-pointer appearance-none [&::-webkit-color-swatch-wrapper]:p-0 [&::-webkit-color-swatch]:rounded-md [&::-webkit-color-swatch]:border-none"
            />
            <span className="text-xs text-muted-foreground">Cor 2</span>
          </div>
          <div
            className="h-8 rounded-md border border-border"
            style={{ background: `linear-gradient(135deg, ${state.background.color1}, ${state.background.color2})` }}
          />
        </div>
      )}

      {state.background.type === 'pattern' && (
        <div className="space-y-2">
          <Label className="text-xs">Padrão</Label>
          <div className="flex gap-1">
            {PATTERNS.map(p => (
              <button
                key={p.value}
                onClick={() => dispatch({ type: 'SET_BACKGROUND', payload: { pattern: p.value } })}
                className={cn(
                  'flex-1 text-xs py-1.5 rounded-md border transition-colors',
                  state.background.pattern === p.value
                    ? 'border-primary bg-primary/10 text-foreground'
                    : 'border-border text-muted-foreground hover:text-foreground'
                )}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
