import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth'
import { z } from 'zod'
import { addAlbumCreationJob, isRedisAvailable } from '@/lib/queue'
import { sendAlbumProgress } from '@/lib/notifications'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Schema de validação
const batchCreateSchema = z.object({
  eventName: z.string().min(1, 'Nome do evento é obrigatório'),
  albums: z.array(z.object({
    albumName: z.string().min(1, 'Nome do álbum é obrigatório'),
    template: z.string().min(1, 'Template é obrigatório'),
    files: z.array(z.object({
      name: z.string(),
      size: z.number(),
      type: z.string(),
      buffer: z.string() // Base64 encoded
    }))
  })),
  sessionId: z.string().min(1, 'Session ID é obrigatório')
})

// Mapeamento de templates
const templateMapping = {
  'classic-20x20': { template: 'classic' as const, size: 'MEDIUM' as const },
  'classic-30x20': { template: 'classic' as const, size: 'SIZE_20X30' as const },
  'modern-20x20': { template: 'modern' as const, size: 'MEDIUM' as const },
  'modern-30x20': { template: 'modern' as const, size: 'SIZE_20X30' as const },
  'premium-30x20': { template: 'artistic' as const, size: 'SIZE_20X30' as const },
  'premium-20x20': { template: 'artistic' as const, size: 'MEDIUM' as const },
}

export async function POST(request: NextRequest) {
  try {
    // 1. Verificar autenticação
    const token = request.headers.get('authorization')?.replace('Bearer ', '')
    if (!token) {
      return NextResponse.json({ error: 'Token de acesso necessário' }, { status: 401 })
    }

    const decoded = await verifyToken(token)
    if (!decoded) {
      return NextResponse.json({ error: 'Token inválido' }, { status: 401 })
    }

    // 2. Validar dados
    const body = await request.json()
    const validatedData = batchCreateSchema.parse(body)

    const { eventName, albums, sessionId } = validatedData
    const userId = decoded.userId

    // 3. Verificar se Redis/Queue está disponível
    const useQueue = await isRedisAvailable()
    
    if (useQueue) {
      console.log('🚀 Using queue system for batch processing')
      
      // Processar com sistema de filas
      const jobPromises = albums.map(async (album, index) => {
        const { albumName, template, files } = album
        
        // Converter arquivos de Base64 para Buffer
        const processedFiles = files.map(file => ({
          ...file,
          buffer: Buffer.from(file.buffer, 'base64')
        }))

        // Adicionar job à fila com prioridade baseada na ordem
        const priority = albums.length - index // Primeiro álbum tem maior prioridade
        
        const job = await addAlbumCreationJob({
          userId,
          eventName,
          albumName,
          template,
          files: processedFiles,
          sessionId
        }, priority)

        if (job) {
          await sendAlbumProgress(
            sessionId,
            albumName,
            0,
            `Álbum adicionado à fila de processamento (posição: ${index + 1})`
          )
        }

        return {
          albumName,
          jobId: job?.id || null,
          status: job ? 'queued' : 'failed'
        }
      })

      const results = await Promise.all(jobPromises)
      
      return NextResponse.json({
        success: true,
        message: `${albums.length} álbuns adicionados à fila de processamento`,
        useQueue: true,
        results,
        sessionId
      })

    } else {
      console.log('⚠️ Queue not available, falling back to synchronous processing')
      
      // Fallback para processamento síncrono (código original)
      const results = []
      
      for (const album of albums) {
        try {
          const { albumName, template } = album
          
          await sendAlbumProgress(sessionId, albumName, 10, 'Criando álbum...')
          
          // Criar projeto
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
              status: 'ACTIVE',
              createdAt: new Date(),
              updatedAt: new Date(),
            },
          })

          await sendAlbumProgress(sessionId, albumName, 100, 'Álbum criado com sucesso!')
          
          results.push({
            albumName,
            projectId: project.id,
            status: 'completed'
          })

        } catch (error) {
          console.error(`Error creating album ${album.albumName}:`, error)
          results.push({
            albumName: album.albumName,
            status: 'failed',
            error: error instanceof Error ? error.message : 'Erro desconhecido'
          })
        }
      }

      return NextResponse.json({
        success: true,
        message: 'Álbuns processados sincronamente',
        useQueue: false,
        results,
        sessionId
      })
    }

  } catch (error) {
    console.error('Batch creation error:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}