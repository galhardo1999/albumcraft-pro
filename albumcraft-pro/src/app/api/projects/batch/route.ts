import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/auth-middleware'
import { z } from 'zod'
import { addAlbumCreationJob, processAlbumSynchronously } from '@/lib/queue'
import { PrismaClient, ProjectStatus } from '@prisma/client'

const prisma = new PrismaClient()

// Schema de validação
const batchCreateSchema = z.object({
  eventName: z.string().min(1, 'Nome do evento é obrigatório'),
  albums: z.array(z.object({
    albumName: z.string().min(1, 'Nome do álbum é obrigatório'),
    files: z.array(z.object({
      name: z.string(),
      size: z.number(),
      type: z.string(),
      buffer: z.string() // Base64 encoded
    })).min(1, 'Pelo menos uma foto é obrigatória')
  })),
  sessionId: z.string().min(1, 'Session ID é obrigatório')
})

export const POST = withAuth(async (request: NextRequest, user) => {
  try {
    // 1. Validar dados
    const body = await request.json()
    const validatedData = batchCreateSchema.parse(body)

    const { eventName, albums, sessionId } = validatedData
    const userId = user.userId

    // 2. Adicionar à fila de processamento
    console.log('🚀 Using queue system for batch processing')
    
    // Processar com sistema de filas
    const jobPromises = albums.map(async (album, index) => {
      const { albumName, files } = album
      
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
          files: processedFiles,
          sessionId
        }, priority)

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
        results,
        sessionId,
        useQueue: true
      })

  } catch (error) {
    console.error('Batch creation error:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: error.issues },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
})