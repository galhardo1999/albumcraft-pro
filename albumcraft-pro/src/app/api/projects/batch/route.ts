import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth'
import { z } from 'zod'
import { addAlbumCreationJob } from '@/lib/queue'
import { sendAlbumProgressSimple } from '@/lib/notifications'
import { PrismaClient, ProjectStatus } from '@prisma/client'

const prisma = new PrismaClient()

// Schema de validação
const batchCreateSchema = z.object({
  eventName: z.string().min(1, 'Nome do evento é obrigatório'),
  albums: z.array(z.object({
    albumName: z.string().min(1, 'Nome do álbum é obrigatório'),
    template: z.enum(['classic', 'modern', 'artistic', 'minimal'], {
      message: 'Template deve ser: classic, modern, artistic ou minimal'
    }),
    files: z.array(z.object({
      name: z.string(),
      size: z.number(),
      type: z.string(),
      buffer: z.string() // Base64 encoded
    }))
  })),
  sessionId: z.string().min(1, 'Session ID é obrigatório')
})

// Mapeamento de templates para tamanhos (se necessário)
const templateSizeMapping = {
  'classic': 'MEDIUM' as const,
  'modern': 'MEDIUM' as const,
  'artistic': 'SIZE_20X30' as const,
  'minimal': 'MEDIUM' as const,
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
    const userId = (decoded as any).userId

    // 3. Adicionar à fila de processamento
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
          await sendAlbumProgressSimple(
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
        results,
        sessionId
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
}