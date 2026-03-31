"use client"

import React from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Slide, CarouselState, SlideType } from '@/lib/types'
import { GripVertical, Copy, Trash2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface SlideListItemProps {
  slide: Slide
  index: number
  isActive: boolean
  slideType: SlideType
  state: CarouselState
  onSelect: () => void
  onDuplicate: () => void
  onRemove: () => void
  canRemove: boolean
  canDuplicate: boolean
}

export default function SlideListItem({
  slide,
  index,
  isActive,
  slideType,
  state,
  onSelect,
  onDuplicate,
  onRemove,
  canRemove,
  canDuplicate,
}: SlideListItemProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: slide.id,
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  const typeLabel = slideType === 'cover' ? 'Capa' : slideType === 'cta' ? 'CTA' : `Slide ${index + 1}`

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'group flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-colors border',
        isActive ? 'border-primary bg-primary/10' : 'border-transparent hover:bg-accent/50',
        isDragging && 'opacity-50'
      )}
      onClick={onSelect}
    >
      <button
        {...attributes}
        {...listeners}
        className="touch-none text-muted-foreground hover:text-foreground cursor-grab active:cursor-grabbing"
      >
        <GripVertical className="w-4 h-4" />
      </button>

      {/* Mini preview thumbnail */}
      <div
        className="w-12 h-12 rounded flex-shrink-0 flex items-center justify-center text-[8px] font-medium overflow-hidden"
        style={{
          backgroundColor: state.colors.background,
          color: state.colors.text,
          border: `1px solid ${state.colors.accent}30`,
        }}
      >
        <span className="truncate px-1 text-center leading-tight" style={{ fontSize: '7px' }}>
          {slide.title.substring(0, 20)}
        </span>
      </div>

      <div className="flex-1 min-w-0">
        <div className="text-xs font-medium truncate text-foreground">{typeLabel}</div>
        <div className="text-[10px] text-muted-foreground truncate">{slide.title}</div>
      </div>

      {/* Actions */}
      <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
        {canDuplicate && (
          <button
            onClick={e => { e.stopPropagation(); onDuplicate() }}
            className="p-1 rounded hover:bg-accent text-muted-foreground hover:text-foreground"
          >
            <Copy className="w-3 h-3" />
          </button>
        )}
        {canRemove && (
          <button
            onClick={e => { e.stopPropagation(); onRemove() }}
            className="p-1 rounded hover:bg-destructive/20 text-muted-foreground hover:text-destructive"
          >
            <Trash2 className="w-3 h-3" />
          </button>
        )}
      </div>
    </div>
  )
}
