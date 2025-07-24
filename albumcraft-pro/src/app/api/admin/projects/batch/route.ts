import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-middleware'
import { prisma } from '@/lib/prisma'
import { addAlbumCreationJob } from '@/lib/queue'

interface AlbumData {
  name: string
  albumSize: string
  status: string
  group: string
  eventName?: string | null
  files?: Array<{
    name: string
    size: number
    type: string
    buffer: string // Base64 encoded
  }>
}

interface BatchProjectRequest {
  userId: string
  albums: AlbumData[]
  sessionId?: string
  useQueue?: boolean
}

export async function POST(request: NextRequest) {
  // Verificar se o usuário é admin
  const adminCheck = await requireAdmin(request)
  if (adminCheck instanceof NextResponse) {
    return adminCheck
  }

  try {
    const body: BatchProjectRequest = await request.json()
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
          // Criar projeto sem fotos diretamente
          return await createProjectDirectly(userId, album)
        }

        // Converter arquivos de Base64 para Buffer
        const processedFiles = album.files.map(file => ({
          ...file,
          buffer: Buffer.from(file.buffer, 'base64')
        }))

        // Adicionar job à fila com prioridade baseada na ordem
        const priority = albums.length - index
        
        const job = await addAlbumCreationJob({
           userId,
           eventName: album.eventName || album.group,
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

    // Criar múltiplos projetos diretamente (modo síncrono)
    const createdProjects = []
    
    for (const album of albums) {
      // Validar dados do álbum
      if (!album.name || !album.albumSize || !album.status || !album.group) {
        continue // Pular álbuns com dados inválidos
      }

      try {
        const project = await createProjectDirectly(userId, album)
        createdProjects.push(project)
      } catch (projectError) {
        console.error('Erro ao criar projeto:', album.name, projectError)
        // Continuar com os próximos projetos mesmo se um falhar
      }
    }

    if (createdProjects.length === 0) {
      return NextResponse.json(
        { error: 'Nenhum projeto foi criado. Verifique os dados enviados.' },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      message: `${createdProjects.length} projetos criados com sucesso`,
      projects: createdProjects,
      total: createdProjects.length,
      useQueue: false
    })

  } catch (error) {
    console.error('Erro ao criar projetos em lote:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

// Função auxiliar para criar projeto diretamente
async function createProjectDirectly(userId: string, album: AlbumData) {
  return await prisma.project.create({
    data: {
      name: album.name,
      albumSize: album.albumSize as any,
      status: album.status as any,
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