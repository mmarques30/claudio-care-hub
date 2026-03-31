"use client"

import React from 'react'
import { useCarousel } from '@/lib/carousel-context'
import { IAPLICADA_PRESETS } from '@/lib/templates'
import { Label } from '@/components/ui/label'
import { ColorConfig } from '@/lib/types'

interface ColorFieldProps {
  label: string
  value: string
  onChange: (value: string) => void
}

function ColorField({ label, value, onChange }: ColorFieldProps) {
  return (
    <div className="flex items-center gap-2">
      <div className="relative">
        <input
          type="color"
          value={value}
          onChange={e => onChange(e.target.value)}
          className="w-8 h-8 rounded-md border border-border cursor-pointer appearance-none bg-transparent [&::-webkit-color-swatch-wrapper]:p-0 [&::-webkit-color-swatch]:rounded-md [&::-webkit-color-swatch]:border-none"
        />
      </div>
      <div className="flex-1">
        <div className="text-xs text-muted-foreground">{label}</div>
        <input
          type="text"
          value={value}
          onChange={e => onChange(e.target.value)}
          className="text-xs font-mono w-full bg-transparent border-none outline-none text-foreground"
        />
      </div>
    </div>
  )
}

export default function ColorPicker() {
  const { state, dispatch } = useCarousel()

  function setColor(key: keyof ColorConfig, value: string) {
    dispatch({ type: 'SET_COLORS', payload: { [key]: value } })
  }

  return (
    <div className="space-y-4">
      <div className="space-y-3">
        <ColorField label="Fundo" value={state.colors.background} onChange={v => setColor('background', v)} />
        <ColorField label="Texto principal" value={state.colors.text} onChange={v => setColor('text', v)} />
        <ColorField label="Texto secundário" value={state.colors.textSecondary} onChange={v => setColor('textSecondary', v)} />
        <ColorField label="Cor de acento" value={state.colors.accent} onChange={v => setColor('accent', v)} />
      </div>

      <div>
        <Label className="text-xs text-muted-foreground mb-2 block">Preset IAplicada</Label>
        <div className="flex flex-wrap gap-1.5">
          {IAPLICADA_PRESETS.map(p => (
            <button
              key={p.value}
              onClick={() => setColor('accent', p.value)}
              className="group relative"
              title={p.name}
            >
              <div
                className="w-7 h-7 rounded-md border border-border hover:scale-110 transition-transform"
                style={{ backgroundColor: p.value }}
              />
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
