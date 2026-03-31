"use client"

import React, { useRef } from 'react'
import { useCarousel } from '@/lib/carousel-context'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Upload, X } from 'lucide-react'

export default function LogoUpload() {
  const { state, dispatch } = useCarousel()
  const logoInputRef = useRef<HTMLInputElement>(null)
  const profileInputRef = useRef<HTMLInputElement>(null)

  function handleFile(e: React.ChangeEvent<HTMLInputElement>, type: 'logo' | 'profile') {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      const result = reader.result as string
      if (type === 'logo') {
        dispatch({ type: 'SET_LOGO', payload: result })
      } else {
        dispatch({ type: 'SET_PROFILE_IMAGE', payload: result })
      }
    }
    reader.readAsDataURL(file)
    e.target.value = ''
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label className="text-xs">Logo / Watermark</Label>
        {state.logo ? (
          <div className="flex items-center gap-2">
            <img src={state.logo} alt="Logo" className="h-8 w-auto rounded" />
            <Button variant="ghost" size="sm" onClick={() => dispatch({ type: 'SET_LOGO', payload: null })}>
              <X className="w-3.5 h-3.5" />
            </Button>
          </div>
        ) : (
          <Button variant="outline" size="sm" className="w-full gap-1.5 text-xs" onClick={() => logoInputRef.current?.click()}>
            <Upload className="w-3.5 h-3.5" />
            Upload logo
          </Button>
        )}
        <input ref={logoInputRef} type="file" accept="image/*" className="hidden" onChange={e => handleFile(e, 'logo')} />
      </div>

      <div className="space-y-2">
        <Label className="text-xs">Foto de perfil (CTA)</Label>
        {state.profileImage ? (
          <div className="flex items-center gap-2">
            <img src={state.profileImage} alt="Profile" className="h-8 w-8 rounded-full object-cover" />
            <Button variant="ghost" size="sm" onClick={() => dispatch({ type: 'SET_PROFILE_IMAGE', payload: null })}>
              <X className="w-3.5 h-3.5" />
            </Button>
          </div>
        ) : (
          <Button variant="outline" size="sm" className="w-full gap-1.5 text-xs" onClick={() => profileInputRef.current?.click()}>
            <Upload className="w-3.5 h-3.5" />
            Upload foto
          </Button>
        )}
        <input ref={profileInputRef} type="file" accept="image/*" className="hidden" onChange={e => handleFile(e, 'profile')} />
      </div>
    </div>
  )
}
