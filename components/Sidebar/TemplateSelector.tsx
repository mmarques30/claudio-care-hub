"use client"

import React from 'react'
import { useCarousel } from '@/lib/carousel-context'
import { TEMPLATES } from '@/lib/templates'
import { TemplateId } from '@/lib/types'
import { cn } from '@/lib/utils'

export default function TemplateSelector() {
  const { state, dispatch } = useCarousel()

  return (
    <div className="grid grid-cols-2 gap-2">
      {TEMPLATES.map(t => (
        <button
          key={t.id}
          onClick={() => dispatch({ type: 'SET_TEMPLATE', payload: t.id as TemplateId })}
          className={cn(
            'rounded-lg p-3 text-left transition-all border',
            state.template === t.id
              ? 'border-primary bg-primary/10'
              : 'border-border hover:border-primary/50'
          )}
        >
          <div
            className="w-full h-14 rounded-md mb-2 flex items-center justify-center"
            style={{
              backgroundColor: t.defaults.colors.background,
              border: `1px solid ${t.defaults.colors.accent}40`,
            }}
          >
            <span
              className="text-xs font-bold"
              style={{ color: t.defaults.colors.text }}
            >
              Aa
            </span>
          </div>
          <div className="text-xs font-medium text-foreground">{t.name}</div>
          <div className="text-[10px] text-muted-foreground mt-0.5 line-clamp-1">{t.description}</div>
        </button>
      ))}
    </div>
  )
}
