"use client"

import React from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import TemplateSelector from './TemplateSelector'
import ColorPicker from './ColorPicker'
import FontSelector from './FontSelector'
import BackgroundSelector from './BackgroundSelector'
import LogoUpload from './LogoUpload'
import ExportPanel from './ExportPanel'
import SlideEditor from '@/components/Editor/SlideEditor'

interface CustomizationPanelProps {
  onExport: () => void
  onExportSlide: (index: number) => void
  isExporting: boolean
}

export default function CustomizationPanel({ onExport, onExportSlide, isExporting }: CustomizationPanelProps) {
  return (
    <div className="w-72 border-l border-border bg-card flex flex-col shrink-0">
      <Tabs defaultValue="content" className="flex flex-col flex-1 min-h-0">
        <div className="border-b border-border px-2 pt-2">
          <TabsList className="w-full h-8">
            <TabsTrigger value="content" className="text-xs flex-1">Conteúdo</TabsTrigger>
            <TabsTrigger value="design" className="text-xs flex-1">Design</TabsTrigger>
            <TabsTrigger value="export" className="text-xs flex-1">Exportar</TabsTrigger>
          </TabsList>
        </div>

        <ScrollArea className="flex-1">
          <TabsContent value="content" className="mt-0">
            <SlideEditor />
          </TabsContent>

          <TabsContent value="design" className="mt-0 p-4 space-y-6">
            <div>
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Templates</h3>
              <TemplateSelector />
            </div>
            <div>
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Cores</h3>
              <ColorPicker />
            </div>
            <div>
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Fontes</h3>
              <FontSelector />
            </div>
            <div>
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Fundo</h3>
              <BackgroundSelector />
            </div>
            <div>
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Marca</h3>
              <LogoUpload />
            </div>
          </TabsContent>

          <TabsContent value="export" className="mt-0 p-4">
            <ExportPanel onExport={onExport} onExportSlide={onExportSlide} isExporting={isExporting} />
          </TabsContent>
        </ScrollArea>
      </Tabs>
    </div>
  )
}
