// Configurações padronizadas de tamanhos de álbuns
// Este arquivo centraliza todas as definições de tamanhos para garantir consistência

export interface AlbumSizeConfig {
  id: string
  name: string
  displayName: string
  description: string
  width: number // em cm
  height: number // em cm
  widthPx: number // em pixels (300 DPI)
  heightPx: number // em pixels (300 DPI)
  aspectRatio: number
  category: 'square' | 'landscape' | 'portrait'
  isPopular: boolean
  priceMultiplier: number
}

// Configurações padronizadas de tamanhos
export const ALBUM_SIZES: AlbumSizeConfig[] = [
  // Formatos Quadrados
  {
    id: 'SIZE_15X15',
    name: '15x15cm',
    displayName: '15x15cm',
    description: 'Formato compacto e econômico',
    width: 15,
    height: 15,
    widthPx: 1772,
    heightPx: 1772,
    aspectRatio: 1,
    category: 'square',
    isPopular: false,
    priceMultiplier: 0.7
  },
  {
    id: 'SIZE_20X20',
    name: '20x20cm',
    displayName: '20x20cm',
    description: 'Formato quadrado clássico',
    width: 20,
    height: 20,
    widthPx: 2362,
    heightPx: 2362,
    aspectRatio: 1,
    category: 'square',
    isPopular: true,
    priceMultiplier: 1.0
  },
  {
    id: 'SIZE_25X25',
    name: '25x25cm',
    displayName: '25x25cm',
    description: 'Formato quadrado premium',
    width: 25,
    height: 25,
    widthPx: 2953,
    heightPx: 2953,
    aspectRatio: 1,
    category: 'square',
    isPopular: false,
    priceMultiplier: 1.4
  },
  {
    id: 'SIZE_30X30',
    name: '30x30cm',
    displayName: '30x30cm',
    description: 'Formato quadrado grande',
    width: 30,
    height: 30,
    widthPx: 3543,
    heightPx: 3543,
    aspectRatio: 1,
    category: 'square',
    isPopular: true,
    priceMultiplier: 1.8
  },

  // Formatos Paisagem
  {
    id: 'SIZE_20X15',
    name: '20x15cm',
    displayName: '20x15cm',
    description: 'Formato paisagem compacto',
    width: 20,
    height: 15,
    widthPx: 2362,
    heightPx: 1772,
    aspectRatio: 1.33,
    category: 'landscape',
    isPopular: false,
    priceMultiplier: 0.9
  },
  {
    id: 'SIZE_30X20',
    name: '30x20cm',
    displayName: '30x20cm',
    description: 'Formato paisagem popular',
    width: 30,
    height: 20,
    widthPx: 3543,
    heightPx: 2362,
    aspectRatio: 1.5,
    category: 'landscape',
    isPopular: true,
    priceMultiplier: 1.3
  },
  {
    id: 'SIZE_40X30',
    name: '40x30cm',
    displayName: '40x30cm',
    description: 'Formato paisagem grande',
    width: 40,
    height: 30,
    widthPx: 4724,
    heightPx: 3543,
    aspectRatio: 1.33,
    category: 'landscape',
    isPopular: false,
    priceMultiplier: 2.2
  },

  // Formatos Retrato
  {
    id: 'SIZE_15X20',
    name: '15x20cm',
    displayName: '15x20cm',
    description: 'Formato retrato clássico',
    width: 15,
    height: 20,
    widthPx: 1772,
    heightPx: 2362,
    aspectRatio: 0.75,
    category: 'portrait',
    isPopular: true,
    priceMultiplier: 0.9
  },
  {
    id: 'SIZE_20X30',
    name: '20x30cm',
    displayName: '20x30cm',
    description: 'Formato retrato popular',
    width: 20,
    height: 30,
    widthPx: 2362,
    heightPx: 3543,
    aspectRatio: 0.67,
    category: 'portrait',
    isPopular: true,
    priceMultiplier: 1.3
  },
  {
    id: 'SIZE_30X40',
    name: '30x40cm',
    displayName: '30x40cm',
    description: 'Formato retrato profissional',
    width: 30,
    height: 40,
    widthPx: 3543,
    heightPx: 4724,
    aspectRatio: 0.75,
    category: 'portrait',
    isPopular: false,
    priceMultiplier: 2.2
  }
]

// Mapeamento para compatibilidade com enum antigo
export const LEGACY_SIZE_MAPPING: Record<string, string> = {
  'SMALL': 'SIZE_15X20',
  'MEDIUM': 'SIZE_20X30',
  'LARGE': 'SIZE_30X40',
  'EXTRA_LARGE': 'SIZE_40X30',
  'SIZE_30X30': 'SIZE_30X30',
  'SIZE_20X30': 'SIZE_20X30',
  'CUSTOM': 'SIZE_20X20' // Default para custom
}

// Funções utilitárias
export const getAlbumSizeById = (id: string): AlbumSizeConfig | undefined => {
  return ALBUM_SIZES.find(size => size.id === id)
}

export const getAlbumSizeByLegacyId = (legacyId: string): AlbumSizeConfig | undefined => {
  const mappedId = LEGACY_SIZE_MAPPING[legacyId] || legacyId
  return getAlbumSizeById(mappedId)
}

export const getPopularSizes = (): AlbumSizeConfig[] => {
  return ALBUM_SIZES.filter(size => size.isPopular)
}

export const getSizesByCategory = (category: 'square' | 'landscape' | 'portrait'): AlbumSizeConfig[] => {
  return ALBUM_SIZES.filter(size => size.category === category)
}

export const formatSizeDisplay = (size: AlbumSizeConfig): string => {
  return `${size.displayName} - ${size.description}`
}

export const calculatePixelDimensions = (widthCm: number, heightCm: number, dpi: number = 300) => {
  const cmToInch = 0.393701
  const widthInches = widthCm * cmToInch
  const heightInches = heightCm * cmToInch
  
  return {
    width: Math.round(widthInches * dpi),
    height: Math.round(heightInches * dpi)
  }
}

// Função para obter tamanho com fallback
export const getAlbumSizeByIdWithFallback = (id: string): AlbumSizeConfig => {
  const size = getAlbumSizeById(id) || getAlbumSizeByLegacyId(id)
  
  if (!size) {
    // Fallback para tamanho padrão
    return ALBUM_SIZES.find(s => s.id === 'SIZE_20X20') || ALBUM_SIZES[0]
  }
  
  return size
}

export const calculateCanvasSize = (size: AlbumSizeConfig, dpi: number = 300): { width: number, height: number } => {
  const pixelsPerCm = dpi / 2.54
  return {
    width: Math.round(size.width * pixelsPerCm),
    height: Math.round(size.height * pixelsPerCm)
  }
}