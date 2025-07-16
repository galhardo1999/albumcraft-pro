import sharp from 'sharp'

// Configurações de processamento de imagem
export const IMAGE_CONFIG = {
  // Tamanhos máximos para imagens originais
  MAX_WIDTH: 2048,
  MAX_HEIGHT: 2048,
  
  // Tamanhos para thumbnails
  THUMBNAIL_WIDTH: 300,
  THUMBNAIL_HEIGHT: 300,
  
  // Qualidade de compressão
  JPEG_QUALITY: 85,
  WEBP_QUALITY: 80,
  
  // Formatos suportados
  SUPPORTED_FORMATS: ['jpeg', 'jpg', 'png', 'webp'] as const,
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

    let image = sharp(buffer)
    
    // Redimensionar mantendo proporção
    image = image.resize(maxWidth, maxHeight, {
      fit: 'inside',
      withoutEnlargement: true,
    })
    
    // Aplicar formato e qualidade
    switch (format) {
      case 'jpeg':
        image = image.jpeg({ quality, mozjpeg: true })
        break
      case 'webp':
        image = image.webp({ quality: IMAGE_CONFIG.WEBP_QUALITY })
        break
      case 'png':
        image = image.png({ compressionLevel: 9 })
        break
    }
    
    const processedBuffer = await image.toBuffer()
    const metadata = await getImageMetadata(processedBuffer)
    
    return {
      buffer: processedBuffer,
      metadata,
      contentType: `image/${format}`,
    }
  } catch (error) {
    console.error('Erro ao processar imagem:', error)
    throw new Error('Falha ao processar imagem')
  }
}

// Criar thumbnail
export async function createThumbnail(buffer: Buffer): Promise<ProcessedImage> {
  return processImage(buffer, {
    maxWidth: IMAGE_CONFIG.THUMBNAIL_WIDTH,
    maxHeight: IMAGE_CONFIG.THUMBNAIL_HEIGHT,
    quality: IMAGE_CONFIG.JPEG_QUALITY,
    format: 'jpeg',
  })
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