import sharp from 'sharp'
import { performanceConfig } from './performance-config'

// Configurar Sharp para melhor performance usando configurações dinâmicas
const sharpConfig = performanceConfig.getSharpConfig()
sharp.concurrency(sharpConfig.concurrency)
sharp.cache(sharpConfig.cache)

// Configurações de processamento de imagem otimizadas
export const IMAGE_CONFIG = {
  // Tamanhos máximos para imagens originais
  MAX_WIDTH: 2048,
  MAX_HEIGHT: 2048,
  
  // Tamanhos para thumbnails
  THUMBNAIL_WIDTH: 300,
  THUMBNAIL_HEIGHT: 300,
  
  // Qualidade de compressão otimizada
  JPEG_QUALITY: 82, // Reduzido para melhor performance
  WEBP_QUALITY: 78, // Reduzido para melhor performance
  
  // Formatos suportados
  SUPPORTED_FORMATS: ['jpeg', 'jpg', 'png', 'webp'] as const,
  
  // Configurações de performance
  SHARP_CONCURRENCY: 4, // Limitar concorrência do Sharp
  SHARP_CACHE: true, // Habilitar cache
}

export type SupportedFormat = typeof IMAGE_CONFIG.SUPPORTED_FORMATS[number]

// Interface para metadados da imagem
export interface ImageMetadata {
  width: number
  height: number
  format: string
  size: number
}

// Interface para imagem processada
export interface ProcessedImage {
  buffer: Buffer
  metadata: ImageMetadata
  contentType: string
}

// Obter metadados da imagem
export async function getImageMetadata(buffer: Buffer): Promise<ImageMetadata> {
  try {
    const image = sharp(buffer)
    const metadata = await image.metadata()
    
    return {
      width: metadata.width || 0,
      height: metadata.height || 0,
      format: metadata.format || 'unknown',
      size: buffer.length,
    }
  } catch (error) {
    console.error('Erro ao obter metadados da imagem:', error)
    throw new Error('Falha ao processar metadados da imagem')
  }
}

// Redimensionar e otimizar imagem
export async function processImage(
  buffer: Buffer,
  options: {
    maxWidth?: number
    maxHeight?: number
    quality?: number
    format?: 'jpeg' | 'webp' | 'png'
  } = {}
): Promise<ProcessedImage> {
  try {
    const {
      maxWidth = IMAGE_CONFIG.MAX_WIDTH,
      maxHeight = IMAGE_CONFIG.MAX_HEIGHT,
      quality = IMAGE_CONFIG.JPEG_QUALITY,
      format = 'jpeg',
    } = options

    console.log(`Processando imagem: ${buffer.length} bytes`)

    // Verificar se o buffer não está vazio
    if (!buffer || buffer.length === 0) {
      throw new Error('Buffer de imagem vazio')
    }

    // Verificar se o buffer é muito grande (limite de 100MB)
    const maxBufferSize = 100 * 1024 * 1024 // 100MB
    if (buffer.length > maxBufferSize) {
      throw new Error(`Imagem muito grande: ${(buffer.length / 1024 / 1024).toFixed(1)}MB. Máximo: 100MB`)
    }

    // Criar instância do Sharp com configurações otimizadas
    let image: sharp.Sharp
    try {
      image = sharp(buffer, {
        limitInputPixels: 268402689, // ~16384x16384 pixels
        sequentialRead: true,
        density: 72,
        pages: 1, // Apenas primeira página para PDFs/GIFs
        animated: false // Desabilitar animações para melhor performance
      })
    } catch (error) {
      console.error('Erro ao criar instância Sharp:', error)
      throw new Error('Formato de imagem não suportado ou arquivo corrompido')
    }

    // Obter metadados
    let metadata: sharp.Metadata
    try {
      metadata = await image.metadata()
      console.log(`Metadados: ${metadata.width}x${metadata.height}, formato: ${metadata.format}`)
    } catch (error) {
      console.error('Erro ao obter metadados:', error)
      throw new Error('Não foi possível ler os metadados da imagem')
    }

    // Verificar se a imagem tem dimensões válidas
    if (!metadata.width || !metadata.height) {
      throw new Error('Imagem com dimensões inválidas')
    }

    // Verificar limite de pixels (evitar imagens muito grandes)
    const totalPixels = metadata.width * metadata.height
    const maxPixels = 50 * 1024 * 1024 // 50 megapixels
    if (totalPixels > maxPixels) {
      throw new Error(`Imagem muito grande: ${(totalPixels / 1024 / 1024).toFixed(1)} megapixels. Máximo: 50 megapixels`)
    }
    
    // Redimensionar mantendo proporção
    image = image.resize(maxWidth, maxHeight, {
      fit: 'inside',
      withoutEnlargement: true,
    })
    
    // Auto-rotacionar baseado no EXIF
    image = image.rotate()
    
    // Aplicar formato e qualidade otimizados
    switch (format) {
      case 'jpeg':
        image = image.jpeg({ 
          quality, 
          mozjpeg: true, 
          progressive: true,
          optimiseScans: true, // Otimizar scans
          trellisQuantisation: true // Melhor compressão
        })
        break
      case 'webp':
        image = image.webp({ 
          quality: IMAGE_CONFIG.WEBP_QUALITY, 
          effort: 4, // Reduzido para melhor performance
          smartSubsample: true // Melhor qualidade/tamanho
        })
        break
      case 'png':
        image = image.png({ 
          compressionLevel: 6, // Reduzido para melhor performance
          progressive: true,
          adaptiveFiltering: true // Melhor compressão
        })
        break
    }
    
    let processedBuffer: Buffer
    try {
      // Usar toBuffer com configurações otimizadas e timeout
      processedBuffer = await image
        .timeout({ seconds: 30 }) // Timeout para evitar travamentos
        .toBuffer({ resolveWithObject: false })
      console.log(`Imagem processada: ${processedBuffer.length} bytes`)
    } catch (error) {
      console.error('Erro no processamento Sharp:', error)
      
      if (error instanceof Error) {
        if (error.message.includes('Input buffer contains unsupported image format')) {
          throw new Error('Formato de imagem não suportado')
        } else if (error.message.includes('Input image exceeds pixel limit')) {
          throw new Error('Imagem excede o limite de pixels permitido')
        } else if (error.message.includes('memory')) {
          throw new Error('Erro de memória durante o processamento')
        } else if (error.message.includes('VipsJpeg: Premature end of JPEG file')) {
          throw new Error('Arquivo JPEG corrompido ou incompleto')
        } else if (error.message.includes('VipsPng: PNG file corrupted')) {
          throw new Error('Arquivo PNG corrompido')
        }
      }
      
      throw new Error('Erro durante o processamento da imagem')
    } finally {
      // Limpar cache do Sharp para liberar memória
      if (typeof image.destroy === 'function') {
        image.destroy()
      }
    }
    
    const processedMetadata = await getImageMetadata(processedBuffer)
    
    return {
      buffer: processedBuffer,
      metadata: processedMetadata,
      contentType: `image/${format}`,
    }
  } catch (error) {
    console.error('Erro ao processar imagem:', error)
    
    // Re-throw com mensagem mais específica se possível
    if (error instanceof Error) {
      throw error
    }
    
    throw new Error('Falha ao processar imagem')
  }
}

// Criar thumbnail
export async function createThumbnail(buffer: Buffer): Promise<ProcessedImage> {
  try {
    console.log(`Criando thumbnail: ${buffer.length} bytes`)

    // Verificar se o buffer não está vazio
    if (!buffer || buffer.length === 0) {
      throw new Error('Buffer de imagem vazio para thumbnail')
    }

    // Criar instância do Sharp com configurações de memória
    let image: sharp.Sharp
    try {
      image = sharp(buffer, {
        limitInputPixels: 268402689, // ~16384x16384 pixels
        sequentialRead: true,
        density: 72
      })
    } catch (error) {
      console.error('Erro ao criar instância Sharp para thumbnail:', error)
      throw new Error('Formato de imagem não suportado para thumbnail')
    }

    // Obter metadados
    let metadata: sharp.Metadata
    try {
      metadata = await image.metadata()
      console.log(`Metadados do thumbnail: ${metadata.width}x${metadata.height}`)
    } catch (error) {
      console.error('Erro ao obter metadados para thumbnail:', error)
      throw new Error('Não foi possível ler os metadados da imagem para thumbnail')
    }

    // Verificar se a imagem tem dimensões válidas
    if (!metadata.width || !metadata.height) {
      throw new Error('Imagem com dimensões inválidas para thumbnail')
    }

    // Processar thumbnail
    let thumbnailBuffer: Buffer
    try {
      thumbnailBuffer = await image
        .resize(IMAGE_CONFIG.THUMBNAIL_WIDTH, IMAGE_CONFIG.THUMBNAIL_HEIGHT, {
          fit: 'cover',
          position: 'center'
        })
        .rotate() // Auto-rotacionar baseado no EXIF
        .jpeg({ 
          quality: IMAGE_CONFIG.JPEG_QUALITY,
          progressive: true,
          mozjpeg: true 
        })
        .toBuffer()
      
      console.log(`Thumbnail criado: ${thumbnailBuffer.length} bytes`)
    } catch (error) {
      console.error('Erro no processamento do thumbnail:', error)
      
      if (error instanceof Error) {
        if (error.message.includes('Input buffer contains unsupported image format')) {
          throw new Error('Formato de imagem não suportado para thumbnail')
        } else if (error.message.includes('Input image exceeds pixel limit')) {
          throw new Error('Imagem excede o limite de pixels para thumbnail')
        } else if (error.message.includes('memory')) {
          throw new Error('Erro de memória durante criação do thumbnail')
        } else if (error.message.includes('VipsJpeg: Premature end of JPEG file')) {
          throw new Error('Arquivo JPEG corrompido - não foi possível criar thumbnail')
        } else if (error.message.includes('VipsPng: PNG file corrupted')) {
          throw new Error('Arquivo PNG corrompido - não foi possível criar thumbnail')
        }
      }
      
      throw new Error('Erro durante a criação do thumbnail')
    }

    const thumbnailMetadata = await getImageMetadata(thumbnailBuffer)

    return {
      buffer: thumbnailBuffer,
      metadata: thumbnailMetadata,
      contentType: 'image/jpeg',
    }
  } catch (error) {
    console.error('Erro geral ao criar thumbnail:', error)
    
    // Re-throw com mensagem mais específica se possível
    if (error instanceof Error) {
      throw error
    }
    
    throw new Error('Falha inesperada ao criar thumbnail')
  }
}

// Validar formato de imagem
export function isValidImageFormat(mimeType: string): boolean {
  const format = mimeType.split('/')[1]?.toLowerCase()
  return IMAGE_CONFIG.SUPPORTED_FORMATS.includes(format as SupportedFormat)
}

// Validar tamanho do arquivo
export function isValidFileSize(size: number, maxSize: number = 50 * 1024 * 1024): boolean {
  return size <= maxSize
}

// Sanitizar nome do arquivo
export function sanitizeFileName(fileName: string): string {
  return fileName
    .toLowerCase()
    .replace(/[^a-z0-9.-]/g, '_')
    .replace(/_{2,}/g, '_')
    .replace(/^_|_$/g, '')
}