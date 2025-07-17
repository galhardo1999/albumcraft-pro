import { getAlbumQueue, AlbumCreationJobData, JobProgress } from './queue'
import { sendAlbumProgress, sendAlbumCompleted, sendAlbumFailed } from './notifications'
import { PrismaClient } from '@prisma/client'
import { uploadToS3 } from './s3'
import sharp from 'sharp'
import { getAlbumSizeByIdWithFallback, calculatePixelDimensions } from './album-sizes'

const prisma = new PrismaClient()

// Mapeamento de templates para tamanhos de álbum
const templateMapping: Record<string, string> = {
  'classic-20x20': 'SIZE_20X20',
  'premium-30x20': 'SIZE_30X20', 
  'deluxe-25x25': 'SIZE_25X25',
  'mini-15x15': 'SIZE_15X15',
  'classic-15x20': 'SIZE_15X20',
  'premium-20x30': 'SIZE_20X30',
  'deluxe-30x40': 'SIZE_30X40',
  'large-40x30': 'SIZE_40X30'
}

// Função principal do worker
export const setupAlbumWorker = async () => {
  const albumQueue = await getAlbumQueue()
  
  if (!albumQueue) {
    console.warn('⚠️ Queue not available, worker not started')
    return
  }

  albumQueue.process('create-album', 1, async (job: any) => {
    const { userId, eventName, albumName, template, files, sessionId } = job.data as AlbumCreationJobData

    try {
      console.log(`🚀 Starting album creation: ${albumName}`)
      
      // 1. Enviar progresso inicial
      await sendAlbumProgress(sessionId, albumName, 10, 'Iniciando criação do álbum...')
      await job.progress(10)

      // 2. Criar projeto no banco
      const templateConfig = templateMapping[template as keyof typeof templateMapping] || {
        template: 'classic' as const,
        size: 'MEDIUM' as const
      }

      const project = await prisma.project.create({
        data: {
          name: albumName,
          eventName,
          template: templateConfig.template,
          size: templateConfig.size,
          userId,
          status: 'PROCESSING',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      })

      await sendAlbumProgress(sessionId, albumName, 30, 'Álbum criado, processando fotos...')
      await job.progress(30)

      // 3. Processar fotos em lotes
      const BATCH_SIZE = 5
      let processedCount = 0
      const totalFiles = files.length

      for (let i = 0; i < files.length; i += BATCH_SIZE) {
        const batch = files.slice(i, i + BATCH_SIZE)
        
        // Processar lote em paralelo
        const batchPromises = batch.map(async (file) => {
          try {
            // Obter configuração do tamanho do álbum
            const albumSizeConfig = getAlbumSizeByIdWithFallback(templateConfig)
            const pixelDimensions = calculatePixelDimensions(
              albumSizeConfig.width,
              albumSizeConfig.height,
              300 // 300 DPI
            )

            // Otimizar imagem baseado nas dimensões do álbum
            const optimizedBuffer = await sharp(file.buffer)
              .resize(pixelDimensions.width, pixelDimensions.height, {
                fit: 'cover',
                position: 'center'
              })
              .jpeg({ quality: 90 })
              .toBuffer()

            // Criar thumbnail
            const thumbnailBuffer = await sharp(file.buffer)
              .resize(300, 300, { 
                fit: 'cover' 
              })
              .jpeg({ quality: 80 })
              .toBuffer()

            // Upload para S3 ou fallback
            let imageUrl = ''
            let thumbnailUrl = ''

            if (process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY) {
              // Upload para S3
              const timestamp = Date.now()
              const imageKey = `projects/${project.id}/photos/${timestamp}-${file.name}`
              const thumbnailKey = `projects/${project.id}/thumbnails/${timestamp}-thumb-${file.name}`

              const [imageUpload, thumbnailUpload] = await Promise.all([
                uploadToS3(optimizedBuffer, imageKey, file.type),
                uploadToS3(thumbnailBuffer, thumbnailKey, 'image/jpeg')
              ])

              imageUrl = imageUpload.url
              thumbnailUrl = thumbnailUpload.url
            } else {
              // Fallback para Base64
              imageUrl = `data:${file.type};base64,${optimizedBuffer.toString('base64')}`
              thumbnailUrl = `data:image/jpeg;base64,${thumbnailBuffer.toString('base64')}`
            }

            // Salvar no banco
            return await prisma.photo.create({
              data: {
                filename: file.name,
                originalUrl: imageUrl,
                thumbnailUrl,
                fileSize: file.size,
                mimeType: file.type,
                projectId: project.id,
                uploadedAt: new Date(),
              },
            })

          } catch (error) {
            console.error(`Error processing file ${file.name}:`, error)
            throw error
          }
        })

        // Aguardar conclusão do lote
        await Promise.all(batchPromises)
        processedCount += batch.length

        // Atualizar progresso
        const progress = 30 + Math.floor((processedCount / totalFiles) * 60)
        await sendAlbumProgress(
          sessionId, 
          albumName, 
          progress, 
          `Processadas ${processedCount}/${totalFiles} fotos`
        )
        await job.progress(progress)
      }

      // 4. Finalizar projeto
      await prisma.project.update({
        where: { id: project.id },
        data: { 
          status: 'COMPLETED',
          updatedAt: new Date()
        },
      })

      await sendAlbumProgress(sessionId, albumName, 100, 'Álbum criado com sucesso!')
      await sendAlbumCompleted(sessionId, albumName, project.id)
      await job.progress(100)

      console.log(`✅ Album ${albumName} created successfully with ID: ${project.id}`)
      
      return { 
        success: true, 
        projectId: project.id, 
        photosProcessed: files.length 
      }

    } catch (error) {
      console.error(`❌ Failed to create album ${albumName}:`, error)
      
      await sendAlbumFailed(
        sessionId, 
        albumName, 
        error instanceof Error ? error.message : 'Erro desconhecido'
      )
      
      throw error
    }
  })

  console.log('🔄 Album worker started and ready to process jobs')
}

// Inicializar worker se estiver no ambiente servidor
if (typeof window === 'undefined') {
  setupAlbumWorker()
}