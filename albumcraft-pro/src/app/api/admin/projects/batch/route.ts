import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-middleware'
import { prisma } from '@/lib/prisma'

interface AlbumData {
  name: string
  albumSize: string
  status: string
}

interface BatchProjectRequest {
  userId: string
  albums: AlbumData[]
}

export async function POST(request: NextRequest) {
  // Verificar se o usuário é admin
  const adminCheck = await requireAdmin(request)
  if (adminCheck instanceof NextResponse) {
    return adminCheck
  }

  try {
    const body: BatchProjectRequest = await request.json()
    const { userId, albums } = body

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

    // Criar múltiplos projetos
    const createdProjects = []
    
    for (const album of albums) {
      // Validar dados do álbum
      if (!album.name || !album.albumSize || !album.status) {
        continue // Pular álbuns com dados inválidos
      }

      try {
        const project = await prisma.project.create({
          data: {
            name: album.name,
            albumSize: album.albumSize as any, // Será validado pelo Prisma
            status: album.status as any, // Será validado pelo Prisma
            userId: userId,
            creationType: 'BATCH',
            template: 'classic', // Template padrão
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
      total: createdProjects.length
    })

  } catch (error) {
    console.error('Erro ao criar projetos em lote:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}