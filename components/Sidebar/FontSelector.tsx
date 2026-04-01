"use client"

import React from 'react'
import { useCarousel } from '@/lib/carousel-context'
import { FONT_OPTIONS, getFontFamily } from '@/lib/fonts'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

export default function FontSelector() {
  const { state, dispatch } = useCarousel()

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label className="text-xs">Fonte do título</Label>
        <Select
          value={state.fonts.heading}
          onValueChange={v => dispatch({ type: 'SET_FONTS', payload: { heading: v } })}
        >
          <SelectTrigger className="h-9 text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {FONT_OPTIONS.map(f => (
              <SelectItem key={f.name} value={f.name}>
                <span style={{ fontFamily: getFontFamily(f.name) }}>{f.name}</span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label className="text-xs">Fonte do corpo</Label>
        <Select
          value={state.fonts.body}
          onValueChange={v => dispatch({ type: 'SET_FONTS', payload: { body: v } })}
        >
          <SelectTrigger className="h-9 text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {FONT_OPTIONS.map(f => (
              <SelectItem key={f.name} value={f.name}>
                <span style={{ fontFamily: getFontFamily(f.name) }}>{f.name}</span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  )
}
