import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-middleware'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const adminCheck = await requireAdmin(request)
    
    if (adminCheck instanceof NextResponse) {
      return adminCheck
    }

    const { searchParams } = new URL(request.url)
    const format = searchParams.get('format') || 'csv'
    const period = searchParams.get('period') || '30'
    const type = searchParams.get('type') || 'overview'

    const periodDays = parseInt(period)
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - periodDays)

    type Row = Record<string, string | number | boolean | null | undefined>
    let data: Row[] = []
    let filename = ''
    let headers: string[] = []

    switch (type) {
      case 'users':
        const users = await prisma.user.findMany({
          select: {
            id: true,
            email: true,
            name: true,
            plan: true,
            isAdmin: true,
            createdAt: true,
            lastLogin: true,
            _count: {
              select: {
                albums: true,
                photos: true
              }
            }
          },
          orderBy: { createdAt: 'desc' }
        })

        data = users.map(user => ({
          ID: user.id,
          Email: user.email,
          Nome: user.name || 'N/A',
          Plano: user.plan,
          Admin: user.isAdmin ? 'Sim' : 'Não',
          'Data de Criação': user.createdAt.toLocaleDateString('pt-BR'),
          'Último Login': user.lastLogin ? user.lastLogin.toLocaleDateString('pt-BR') : 'Nunca',
          Álbuns: user._count.albums,
          Fotos: user._count.photos
        }))

        headers = ['ID', 'Email', 'Nome', 'Plano', 'Admin', 'Data de Criação', 'Último Login', 'Álbuns', 'Fotos']
        filename = `usuarios-${new Date().toISOString().split('T')[0]}`
        break

      case 'projects':
        const projects = await prisma.album.findMany({
          include: {
            user: { select: { email: true, name: true } },
            _count: { select: { photos: true } }
          },
          orderBy: { createdAt: 'desc' }
        })

        data = projects.map(project => ({
          ID: project.id,
          Nome: project.name,
          Usuário: project.user.name || project.user.email,
          'Email do Usuário': project.user.email,
          Status: project.status,
          'Data de Criação': project.createdAt.toLocaleDateString('pt-BR'),
          'Última Atualização': project.updatedAt.toLocaleDateString('pt-BR'),
          Fotos: project._count.photos
        }))

        headers = ['ID', 'Nome', 'Usuário', 'Email do Usuário', 'Status', 'Data de Criação', 'Última Atualização', 'Fotos']
        filename = `albuns-${new Date().toISOString().split('T')[0]}`
        break

      case 'photos':
        const photos = await prisma.photo.findMany({
          select: {
            id: true,
            filename: true,
            createdAt: true,
            size: true,
            width: true,
            height: true,
            s3Url: true,
            user: { select: { name: true, email: true } },
            album: { select: { name: true } }
          },
          orderBy: { createdAt: 'desc' }
        })

        data = photos.map(photo => ({
          ID: photo.id,
          Arquivo: photo.filename,
          Usuário: photo.user?.name || photo.user?.email || '—',
          'Email do Usuário': photo.user?.email || '—',
          Álbum: photo.album?.name || '—',
          'Data de Upload': photo.createdAt.toLocaleDateString('pt-BR'),
          Tamanho: photo.size,
          Dimensões: photo.width && photo.height ? `${photo.width}x${photo.height}` : '—',
          URL: photo.s3Url || '—'
        }))

        headers = ['ID', 'Arquivo', 'Usuário', 'Email do Usuário', 'Álbum', 'Data de Upload', 'Tamanho', 'Dimensões', 'URL']
        filename = `fotos-${new Date().toISOString().split('T')[0]}`
        break

      case 'complete':
        // Relatório completo com estatísticas gerais
        const totalUsers = await prisma.user.count()
        const totalProjects = await prisma.album.count()
        const totalPhotos = await prisma.photo.count()

        const newUsers = await prisma.user.count({
          where: {
            createdAt: {
              gte: startDate
            }
          }
        })

        const newProjects = await prisma.album.count({
          where: { createdAt: { gte: startDate } }
        })

        const newPhotos = await prisma.photo.count({
          where: { createdAt: { gte: startDate } }
        })

        const projectsByStatus = await prisma.album.groupBy({
          by: ['status'],
          _count: { status: true }
        })

        const usersByPlan = await prisma.user.groupBy({
          by: ['plan'],
          _count: {
            plan: true
          }
        })

        data = [
          { Métrica: 'Total de Usuários', Valor: totalUsers },
          { Métrica: 'Total de Álbuns', Valor: totalProjects },
          { Métrica: 'Total de Fotos', Valor: totalPhotos },
          { Métrica: `Novos Usuários (${period} dias)`, Valor: newUsers },
          { Métrica: `Novos Álbuns (${period} dias)`, Valor: newProjects },
          { Métrica: `Novas Fotos (${period} dias)`, Valor: newPhotos },
          ...projectsByStatus.map(item => ({
            Métrica: `Álbuns - ${item.status}`,
            Valor: item._count.status
          })),
          ...usersByPlan.map(item => ({
            Métrica: `Usuários - Plano ${item.plan}`,
            Valor: item._count.plan
          }))
        ]

        headers = ['Métrica', 'Valor']
        filename = `relatorio-completo-${new Date().toISOString().split('T')[0]}`
        break

      case 'activity':
        const [createdUsers, createdAlbums, uploadedPhotos] = await Promise.all([
          prisma.user.findMany({
            where: { createdAt: { gte: startDate } },
            select: { id: true, name: true, email: true, createdAt: true },
            orderBy: { createdAt: 'desc' }
          }),
          prisma.album.findMany({
            where: { createdAt: { gte: startDate } },
            select: { id: true, name: true, createdAt: true, user: { select: { name: true, email: true } } },
            orderBy: { createdAt: 'desc' }
          }),
          prisma.photo.findMany({
            where: { createdAt: { gte: startDate } },
            select: { id: true, filename: true, createdAt: true, user: { select: { name: true, email: true } }, album: { select: { name: true } } },
            orderBy: { createdAt: 'desc' }
          })
        ])

        type ActivityRow = { Tipo: string; Descrição: string; Data: string }
        const activityRows: ActivityRow[] = []

        createdUsers.forEach(u => {
          activityRows.push({
            Tipo: 'Usuário Criado',
            Descrição: `${u.name || u.email} criou uma conta`,
            Data: u.createdAt.toLocaleString('pt-BR')
          })
        })

        createdAlbums.forEach(a => {
          activityRows.push({
            Tipo: 'Álbum Criado',
            Descrição: `${a.user?.name || a.user?.email || 'Usuário'} criou o álbum "${a.name}"`,
            Data: a.createdAt.toLocaleString('pt-BR')
          })
        })

        uploadedPhotos.forEach(p => {
          activityRows.push({
            Tipo: 'Foto Enviada',
            Descrição: `${p.user?.name || p.user?.email || 'Usuário'} enviou "${p.filename}" ${p.album?.name ? `para o álbum "${p.album.name}"` : ''}`.trim(),
            Data: p.createdAt.toLocaleString('pt-BR')
          })
        })

        // Ordenar por data desc
        activityRows.sort((a, b) => new Date(b.Data).getTime() - new Date(a.Data).getTime())

        data = activityRows
        headers = ['Tipo', 'Descrição', 'Data']
        filename = `atividade-${new Date().toISOString().split('T')[0]}`
        break

      default:
        return NextResponse.json({ error: 'Tipo de relatório inválido' }, { status: 400 })
    }

    if (format === 'csv') {
      const csvContent = [
        headers.join(','),
        ...data.map((row: Row) => 
          headers.map(header => {
            const value = row[header]
            if (value === null || value === undefined) return ''
            // Escapar aspas duplas e envolver em aspas se contém vírgula
            if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
              return `"${value.replace(/"/g, '""')}"`
            }
            return String(value)
          }).join(',')
        )
      ].join('\n')

      return new NextResponse(csvContent, {
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="${filename}.csv"`
        }
      })
    }

    // Para outros formatos (PDF), retornar erro por enquanto
    return NextResponse.json({ error: 'Formato não suportado' }, { status: 400 })

  } catch (error) {
    console.error('Erro ao exportar relatório:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}