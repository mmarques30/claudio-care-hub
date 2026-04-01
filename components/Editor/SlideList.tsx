"use client"

import React from 'react'
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core'
import { SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { restrictToVerticalAxis } from '@dnd-kit/modifiers'
import { useCarousel } from '@/lib/carousel-context'
import { SlideType } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Plus } from 'lucide-react'
import SlideListItem from './SlideListItem'

function getSlideType(index: number, total: number): SlideType {
  if (index === 0) return 'cover'
  if (index === total - 1) return 'cta'
  return 'content'
}

export default function SlideList() {
  const { state, dispatch } = useCarousel()

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const oldIndex = state.slides.findIndex(s => s.id === active.id)
    const newIndex = state.slides.findIndex(s => s.id === over.id)
    if (oldIndex !== -1 && newIndex !== -1) {
      dispatch({ type: 'REORDER_SLIDES', payload: { oldIndex, newIndex } })
    }
  }

  return (
    <div className="w-64 border-r border-border bg-card flex flex-col shrink-0">
      <div className="p-3 border-b border-border flex items-center justify-between">
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Slides</span>
        <span className="text-xs text-muted-foreground">{state.slides.length}/15</span>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-2 space-y-1">
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext items={state.slides.map(s => s.id)} strategy={verticalListSortingStrategy}>
              {state.slides.map((slide, index) => (
                <SlideListItem
                  key={slide.id}
                  slide={slide}
                  index={index}
                  isActive={index === state.activeSlideIndex}
                  slideType={getSlideType(index, state.slides.length)}
                  state={state}
                  onSelect={() => dispatch({ type: 'SET_ACTIVE_SLIDE', payload: index })}
                  onDuplicate={() => dispatch({ type: 'DUPLICATE_SLIDE', payload: index })}
                  onRemove={() => dispatch({ type: 'REMOVE_SLIDE', payload: index })}
                  canRemove={state.slides.length > 3}
                  canDuplicate={state.slides.length < 15}
                />
              ))}
            </SortableContext>
          </DndContext>
        </div>
      </ScrollArea>

      <div className="p-3 border-t border-border">
        <Button
          variant="outline"
          size="sm"
          className="w-full gap-1.5 text-xs"
          onClick={() => dispatch({ type: 'ADD_SLIDE' })}
          disabled={state.slides.length >= 15}
        >
          <Plus className="w-3.5 h-3.5" />
          Adicionar Slide
        </Button>
      </div>
    </div>
  )
}
