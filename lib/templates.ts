import { TemplateConfig } from './types'

export const TEMPLATES: TemplateConfig[] = [
  {
    id: 'educational',
    name: 'Educacional',
    description: 'Tutoriais, passo a passo, "como fazer X"',
    defaults: {
      colors: {
        background: '#F4F2ED',
        text: '#1A1A1A',
        textSecondary: '#5A5A5A',
        accent: '#6B7A2F',
      },
      fonts: {
        heading: 'DM Sans',
        body: 'DM Sans',
      },
      background: {
        type: 'solid',
        color1: '#F4F2ED',
        color2: '#E8E5DC',
        pattern: 'dots',
      },
    },
  },
  {
    id: 'provocative',
    name: 'Provocativo',
    description: 'Mitos vs verdades, hooks fortes, visual bold',
    defaults: {
      colors: {
        background: '#1A1A1A',
        text: '#FFFFFF',
        textSecondary: '#A0A0A0',
        accent: '#9AAD3D',
      },
      fonts: {
        heading: 'Archivo',
        body: 'Space Grotesk',
      },
      background: {
        type: 'solid',
        color1: '#1A1A1A',
        color2: '#2A2A2A',
        pattern: 'grid',
      },
    },
  },
  {
    id: 'data-trends',
    name: 'Dados & Tendências',
    description: 'Estatísticas, comparações, números em destaque',
    defaults: {
      colors: {
        background: '#FAFAF6',
        text: '#1A1A1A',
        textSecondary: '#6B6B6B',
        accent: '#C5D1A0',
      },
      fonts: {
        heading: 'Playfair Display',
        body: 'Plus Jakarta Sans',
      },
      background: {
        type: 'solid',
        color1: '#FAFAF6',
        color2: '#F0EDE5',
        pattern: 'lines',
      },
    },
  },
  {
    id: 'storytelling',
    name: 'Storytelling',
    description: 'Histórias pessoais, cases, jornadas',
    defaults: {
      colors: {
        background: '#FFFFFF',
        text: '#1A1A1A',
        textSecondary: '#7A7A7A',
        accent: '#D4DEB3',
      },
      fonts: {
        heading: 'Sora',
        body: 'Sora',
      },
      background: {
        type: 'solid',
        color1: '#FFFFFF',
        color2: '#F8F8F8',
        pattern: 'dots',
      },
    },
  },
]

export const IAPLICADA_PRESETS = [
  { name: 'Sage Claro', value: '#D4DEB3' },
  { name: 'Oliva Escuro', value: '#6B7A2F' },
  { name: 'Sage Médio', value: '#C5D1A0' },
  { name: 'Verde Amarelado', value: '#9AAD3D' },
  { name: 'Fundo Escuro', value: '#1A1A1A' },
  { name: 'Fundo Claro', value: '#F4F2ED' },
  { name: 'Fundo Card', value: '#FAFAF6' },
]

export function getTemplate(id: string): TemplateConfig {
  return TEMPLATES.find(t => t.id === id) || TEMPLATES[0]
}
