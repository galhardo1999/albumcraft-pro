import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-middleware'
import { prisma } from '@/lib/prisma'
import { BatchAlbumRequest, type BatchAlbumRequestType } from '@/lib/validations'
import { addAlbumCreationJob } from '@/lib/queue'

interface AlbumData {
  name: string
  description?: string
  albumSize: string
  status?: string
  creationType?: string
  group?: string
  customWidth?: number
  customHeight?: number
  files?: Array<{
    filename: string
    buffer: string // Base64 encoded
  }>
  eventName?: string
}

export async function POST(request: NextRequest) {
  // Verificar se o usuário é admin
  const adminCheck = await requireAdmin(request)
  if (adminCheck instanceof NextResponse) {
    return adminCheck
  }

  try {
    const body: BatchAlbumRequestType = await request.json()
    const { userId, albums, sessionId, useQueue = true } = body

    // Validar dados de entrada
    if (!userId || !albums || !Array.isArray(albums) || albums.length === 0) {
      return NextResponse.json(
        { error: 'Dados inválidos. userId e albums são obrigatórios.' },
        { status: 400 }
      )
    }

    // Verificar se o usuário existe
    const user = await prisma.user.findUnique({
      where: { id: userId }
    })

    if (!user) {
      return NextResponse.json(
        { error: 'Usuário não encontrado' },
        { status: 404 }
      )
    }

    // Se usar sistema de filas e há arquivos para processar
    if (useQueue && albums.some(album => album.files && album.files.length > 0)) {
      const jobPromises = albums.map(async (album, index) => {
        if (!album.files || album.files.length === 0) {
          // Criar álbum sem fotos diretamente
          return await createAlbumDirectly(userId, album)
        }

        // Converter arquivos de Base64 para Buffer
        const processedFiles = album.files.map((file: any) => ({
          ...file,
          buffer: Buffer.from(file.buffer, 'base64')
        }))

        // Adicionar job à fila com prioridade baseada na ordem
        const priority = albums.length - index
        
        const job = await addAlbumCreationJob({
          userId,
          eventName: album.eventName || album.name,
          albumName: album.name,
          files: processedFiles,
          sessionId: sessionId || `admin-${Date.now()}`
        }, priority)

        return {
          albumName: album.name,
          jobId: job?.id || null,
          status: job ? 'queued' : 'failed'
        }
      })

      const results = await Promise.all(jobPromises)
      
      return NextResponse.json({
        success: true,
        message: `${albums.length} álbuns adicionados à fila de processamento`,
        results,
        sessionId: sessionId || `admin-${Date.now()}`,
        useQueue: true
      })
    }

    // Criar múltiplos álbuns diretamente (modo síncrono)
    const createdAlbums = []
    
    for (const album of albums) {
      // Validar dados do álbum
      if (!album.name || !album.albumSize || !album.status || !album.group) {
        continue // Pular álbuns com dados inválidos
      }

      try {
        const createdAlbum = await createAlbumDirectly(userId, album)
        createdAlbums.push(createdAlbum)
      } catch (albumError) {
        console.error('Erro ao criar álbum:', album.name, albumError)
        // Continuar com os próximos álbuns mesmo se um falhar
      }
    }

    if (createdAlbums.length === 0) {
      return NextResponse.json(
        { error: 'Nenhum álbum foi criado. Verifique os dados enviados.' },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      message: `${createdAlbums.length} álbuns criados com sucesso`,
      albums: createdAlbums,
      total: createdAlbums.length,
      useQueue: false
    })

  } catch (error) {
    console.error('Erro ao criar álbuns em lote:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

// Função auxiliar para criar álbum diretamente
async function createAlbumDirectly(userId: string, album: AlbumData) {
  return await prisma.album.create({
    data: {
      name: album.name,
      albumSize: album.albumSize as any,
      status: (album.status || 'DRAFT') as any,
      userId: userId,
      creationType: 'BATCH',
      template: 'classic',
      group: album.group,
      eventName: album.eventName || null,
      createdAt: new Date(),
      updatedAt: new Date()
    },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          name: true
        }
      }
    }
  })
}