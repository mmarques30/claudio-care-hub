"use client"

import React, { useState } from 'react'
import { useCarousel } from '@/lib/carousel-context'
import { TEMPLATES } from '@/lib/templates'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { Download, Square, RectangleVertical, Save, FolderOpen, FilePlus, Smartphone } from 'lucide-react'
import { FormatType, TemplateId } from '@/lib/types'

interface ToolbarProps {
  onExport: () => void
  onSave: () => void
  onLoadDrafts: () => void
  onNewCarousel: () => void
  onToggleMockup: () => void
  isExporting: boolean
}

export default function Toolbar({ onExport, onSave, onLoadDrafts, onNewCarousel, onToggleMockup, isExporting }: ToolbarProps) {
  const { state, dispatch } = useCarousel()

  return (
    <div className="h-14 border-b border-border bg-card flex items-center px-4 gap-3 shrink-0">
      {/* Logo */}
      <div className="flex items-center gap-2 mr-2">
        <div className="w-7 h-7 rounded-md bg-primary flex items-center justify-center">
          <span className="text-primary-foreground font-bold text-sm">C</span>
        </div>
        <span className="font-semibold text-sm hidden md:inline text-foreground">Carousel Studio</span>
      </div>

      <Separator orientation="vertical" className="h-6" />

      {/* Carousel name */}
      <Input
        value={state.name}
        onChange={e => dispatch({ type: 'SET_NAME', payload: e.target.value })}
        className="w-48 h-8 text-sm bg-background"
        placeholder="Nome do carrossel"
      />

      <Separator orientation="vertical" className="h-6" />

      {/* Template selector */}
      <Select
        value={state.template}
        onValueChange={v => dispatch({ type: 'SET_TEMPLATE', payload: v as TemplateId })}
      >
        <SelectTrigger className="w-44 h-8 text-sm">
          <SelectValue placeholder="Template" />
        </SelectTrigger>
        <SelectContent>
          {TEMPLATES.map(t => (
            <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Format toggle */}
      <div className="flex items-center border border-border rounded-md overflow-hidden">
        <button
          className={`flex items-center gap-1 px-2.5 py-1.5 text-xs transition-colors ${state.format === '1080x1080' ? 'bg-primary text-primary-foreground' : 'hover:bg-accent'}`}
          onClick={() => dispatch({ type: 'SET_FORMAT', payload: '1080x1080' })}
        >
          <Square className="w-3.5 h-3.5" />
          <span className="hidden lg:inline">1:1</span>
        </button>
        <button
          className={`flex items-center gap-1 px-2.5 py-1.5 text-xs transition-colors ${state.format === '1080x1350' ? 'bg-primary text-primary-foreground' : 'hover:bg-accent'}`}
          onClick={() => dispatch({ type: 'SET_FORMAT', payload: '1080x1350' })}
        >
          <RectangleVertical className="w-3.5 h-3.5" />
          <span className="hidden lg:inline">4:5</span>
        </button>
      </div>

      <div className="flex-1" />

      {/* Actions */}
      <Button variant="ghost" size="sm" onClick={onToggleMockup} className="gap-1.5 text-xs">
        <Smartphone className="w-4 h-4" />
        <span className="hidden lg:inline">Mockup</span>
      </Button>

      <Button variant="ghost" size="sm" onClick={onNewCarousel} className="gap-1.5 text-xs">
        <FilePlus className="w-4 h-4" />
        <span className="hidden lg:inline">Novo</span>
      </Button>

      <Button variant="ghost" size="sm" onClick={onLoadDrafts} className="gap-1.5 text-xs">
        <FolderOpen className="w-4 h-4" />
        <span className="hidden lg:inline">Rascunhos</span>
      </Button>

      <Button variant="ghost" size="sm" onClick={onSave} className="gap-1.5 text-xs">
        <Save className="w-4 h-4" />
        <span className="hidden lg:inline">Salvar</span>
      </Button>

      <Button size="sm" onClick={onExport} disabled={isExporting} className="gap-1.5 text-xs">
        <Download className="w-4 h-4" />
        {isExporting ? 'Exportando...' : 'Exportar'}
      </Button>
    </div>
  )
}
