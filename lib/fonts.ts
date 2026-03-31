export interface FontOption {
  name: string
  family: string
  weights: string
}

export const FONT_OPTIONS: FontOption[] = [
  { name: 'Space Grotesk', family: "'Space Grotesk', sans-serif", weights: '400;500;600;700' },
  { name: 'Sora', family: "'Sora', sans-serif", weights: '400;500;600;700' },
  { name: 'Plus Jakarta Sans', family: "'Plus Jakarta Sans', sans-serif", weights: '400;500;600;700;800' },
  { name: 'DM Sans', family: "'DM Sans', sans-serif", weights: '400;500;600;700' },
  { name: 'Outfit', family: "'Outfit', sans-serif", weights: '400;500;600;700' },
  { name: 'Archivo', family: "'Archivo', sans-serif", weights: '400;500;600;700;800;900' },
  { name: 'Poppins', family: "'Poppins', sans-serif", weights: '400;500;600;700' },
  { name: 'Playfair Display', family: "'Playfair Display', serif", weights: '400;500;600;700;800;900' },
  { name: 'Inter', family: "'Inter', sans-serif", weights: '400;500;600;700' },
  { name: 'DM Serif Display', family: "'DM Serif Display', serif", weights: '400' },
]

export function getFontFamily(fontName: string): string {
  const font = FONT_OPTIONS.find(f => f.name === fontName)
  return font?.family || "'Inter', sans-serif"
}

export function getGoogleFontsUrl(): string {
  const families = FONT_OPTIONS.map(f => {
    const name = f.name.replace(/ /g, '+')
    return `family=${name}:wght@${f.weights}`
  }).join('&')
  return `https://fonts.googleapis.com/css2?${families}&display=swap`
}
