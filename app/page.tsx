"use client"

import React, { useState, useRef, useCallback, useMemo } from 'react'
import { CarouselProvider, useCarousel } from '@/lib/carousel-context'
import { SlideType } from '@/lib/types'
import { exportCarouselAsZip, exportSlideAsPng } from '@/lib/export'
import { saveDraft, getDrafts, deleteDraft, loadDraft } from '@/lib/storage'
import { useKeyboardShortcuts } from '@/lib/keyboard'
import { TooltipProvider } from '@/components/ui/tooltip'
import Toolbar from '@/components/Toolbar/Toolbar'
import SlideList from '@/components/Editor/SlideList'
import SlidePreview from '@/components/Preview/SlidePreview'
import CarouselNavigation from '@/components/Preview/CarouselNavigation'
import CustomizationPanel from '@/components/Sidebar/CustomizationPanel'
import PhoneMockup from '@/components/Preview/PhoneMockup'
import SlideRenderer from '@/components/Preview/SlideRenderer'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { SavedCarousel } from '@/lib/types'
import { Trash2 } from 'lucide-react'

function getSlideType(index: number, total: number): SlideType {
  if (index === 0) return 'cover'
  if (index === total - 1) return 'cta'
  return 'content'
}

function CarouselEditor() {
  const { state, dispatch } = useCarousel()
  const [isExporting, setIsExporting] = useState(false)
  const [showMockup, setShowMockup] = useState(false)
  const [showDrafts, setShowDrafts] = useState(false)
  const [drafts, setDrafts] = useState<SavedCarousel[]>([])
  const exportContainerRef = useRef<HTMLDivElement>(null)

  const handleSave = useCallback(() => {
    saveDraft(state)
  }, [state])

  const handleExport = useCallback(async () => {
    setIsExporting(true)
    try {
      // Wait for render
      await new Promise(r => setTimeout(r, 100))
      const container = exportContainerRef.current
      if (!container) return
      const elements = Array.from(container.children) as HTMLElement[]
      await exportCarouselAsZip(elements, state.name)
    } catch (err) {
      console.error('Export failed:', err)
    } finally {
      setIsExporting(false)
    }
  }, [state])

  const handleExportSlide = useCallback(async (index: number) => {
    setIsExporting(true)
    try {
      await new Promise(r => setTimeout(r, 100))
      const container = exportContainerRef.current
      if (!container) return
      const element = container.children[index] as HTMLElement
      if (!element) return
      await exportSlideAsPng(element, `slide-${String(index + 1).padStart(2, '0')}.png`)
    } catch (err) {
      console.error('Export failed:', err)
    } finally {
      setIsExporting(false)
    }
  }, [])

  const handleNewCarousel = useCallback(() => {
    dispatch({ type: 'NEW_CAROUSEL' })
  }, [dispatch])

  const handleLoadDrafts = useCallback(() => {
    setDrafts(getDrafts())
    setShowDrafts(true)
  }, [])

  const handleLoadDraft = useCallback((id: string) => {
    const draft = loadDraft(id)
    if (draft) {
      dispatch({ type: 'LOAD_CAROUSEL', payload: draft })
      setShowDrafts(false)
    }
  }, [dispatch])

  const handleDeleteDraft = useCallback((id: string) => {
    deleteDraft(id)
    setDrafts(getDrafts())
  }, [])

  const keyboardHandlers = useMemo(() => ({
    onSave: handleSave,
    onExport: handleExport,
    onPrevSlide: () => dispatch({ type: 'SET_ACTIVE_SLIDE', payload: state.activeSlideIndex - 1 }),
    onNextSlide: () => dispatch({ type: 'SET_ACTIVE_SLIDE', payload: state.activeSlideIndex + 1 }),
  }), [handleSave, handleExport, dispatch, state.activeSlideIndex])

  useKeyboardShortcuts(keyboardHandlers)

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      <Toolbar
        onExport={handleExport}
        onSave={handleSave}
        onLoadDrafts={handleLoadDrafts}
        onNewCarousel={handleNewCarousel}
        onToggleMockup={() => setShowMockup(!showMockup)}
        isExporting={isExporting}
      />

      <div className="flex-1 flex min-h-0">
        <SlideList />

        <div className="flex-1 flex flex-col min-w-0">
          {showMockup ? (
            <div className="flex-1 flex items-center justify-center bg-background p-8 overflow-auto">
              <PhoneMockup />
            </div>
          ) : (
            <>
              <SlidePreview />
              <CarouselNavigation />
            </>
          )}
        </div>

        <CustomizationPanel
          onExport={handleExport}
          onExportSlide={handleExportSlide}
          isExporting={isExporting}
        />
      </div>

      {/* Hidden export container - renders all slides at full size */}
      <div
        ref={exportContainerRef}
        className="fixed"
        style={{ left: '-99999px', top: '-99999px' }}
        aria-hidden="true"
      >
        {state.slides.map((slide, index) => (
          <SlideRenderer
            key={slide.id}
            slide={slide}
            slideIndex={index}
            totalSlides={state.slides.length}
            state={state}
            slideType={getSlideType(index, state.slides.length)}
            scale={1}
          />
        ))}
      </div>

      {/* Drafts dialog */}
      <Dialog open={showDrafts} onOpenChange={setShowDrafts}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Rascunhos salvos</DialogTitle>
            <DialogDescription>Selecione um rascunho para continuar editando.</DialogDescription>
          </DialogHeader>
          <div className="max-h-64 overflow-y-auto space-y-2">
            {drafts.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">Nenhum rascunho salvo.</p>
            ) : (
              drafts.map(d => (
                <div key={d.id} className="flex items-center gap-2 p-3 rounded-lg border border-border hover:bg-accent/50 group">
                  <button
                    className="flex-1 text-left"
                    onClick={() => handleLoadDraft(d.id)}
                  >
                    <div className="text-sm font-medium">{d.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {new Date(d.updatedAt).toLocaleDateString('pt-BR')} — {d.state.slides.length} slides
                    </div>
                  </button>
                  <button
                    onClick={() => handleDeleteDraft(d.id)}
                    className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-destructive/20 text-muted-foreground hover:text-destructive transition-opacity"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default function Home() {
  return (
    <TooltipProvider>
      <CarouselProvider>
        <CarouselEditor />
      </CarouselProvider>
    </TooltipProvider>
  )
}
