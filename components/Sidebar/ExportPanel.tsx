"use client"

import React from 'react'
import { useCarousel } from '@/lib/carousel-context'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Download, Image } from 'lucide-react'

interface ExportPanelProps {
  onExport: () => void
  onExportSlide: (index: number) => void
  isExporting: boolean
}

export default function ExportPanel({ onExport, onExportSlide, isExporting }: ExportPanelProps) {
  const { state, dispatch } = useCarousel()

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label className="text-xs">Numeração dos slides</Label>
        <Switch
          checked={state.showSlideNumbers}
          onCheckedChange={v => dispatch({ type: 'SET_SHOW_SLIDE_NUMBERS', payload: v })}
        />
      </div>

      <div className="space-y-2">
        <Button className="w-full gap-1.5" onClick={onExport} disabled={isExporting}>
          <Download className="w-4 h-4" />
          {isExporting ? 'Exportando...' : 'Exportar carrossel (ZIP)'}
        </Button>
        <Button
          variant="outline"
          className="w-full gap-1.5 text-xs"
          size="sm"
          onClick={() => onExportSlide(state.activeSlideIndex)}
          disabled={isExporting}
        >
          <Image className="w-3.5 h-3.5" />
          Exportar slide atual
        </Button>
      </div>

      <div className="text-[10px] text-muted-foreground">
        Formato: {state.format === '1080x1080' ? '1080 × 1080px' : '1080 × 1350px'} | {state.slides.length} slides
      </div>
    </div>
  )
}
