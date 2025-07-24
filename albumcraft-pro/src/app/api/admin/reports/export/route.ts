import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-middleware'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const adminCheck = await requireAdmin(request)
    
    if ('error' in adminCheck) {
      return adminCheck
    }

    const { searchParams } = new URL(request.url)
    const format = searchParams.get('format') || 'csv'
    const period = searchParams.get('period') || '30'
    const type = searchParams.get('type') || 'overview'

    const periodDays = parseInt(period)
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - periodDays)

    let data: any[] = []
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
                projects: true,
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
          Projetos: user._count.projects,
          Fotos: user._count.photos
        }))

        headers = ['ID', 'Email', 'Nome', 'Plano', 'Admin', 'Data de Criação', 'Último Login', 'Projetos', 'Fotos']
        filename = `usuarios-${new Date().toISOString().split('T')[0]}`
        break

      case 'projects':
        const projects = await prisma.project.findMany({
          include: {
            user: {
              select: {
                email: true,
                name: true
              }
            },
            _count: {
              select: {
                photos: true
              }
            }
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
        filename = `projetos-${new Date().toISOString().split('T')[0]}`
        break

      case 'complete':
        // Relatório completo com estatísticas gerais
        const totalUsers = await prisma.user.count()
        const totalProjects = await prisma.project.count()
        const totalPhotos = await prisma.photo.count()

        const newUsers = await prisma.user.count({
          where: {
            createdAt: {
              gte: startDate
            }
          }
        })

        const newProjects = await prisma.project.count({
          where: {
            createdAt: {
              gte: startDate
            }
          }
        })

        const newPhotos = await prisma.photo.count()

        const projectsByStatus = await prisma.project.groupBy({
          by: ['status'],
          _count: {
            status: true
          }
        })

        const usersByPlan = await prisma.user.groupBy({
          by: ['plan'],
          _count: {
            plan: true
          }
        })

        data = [
          { Métrica: 'Total de Usuários', Valor: totalUsers },
          { Métrica: 'Total de Projetos', Valor: totalProjects },
          { Métrica: 'Total de Fotos', Valor: totalPhotos },
          { Métrica: `Novos Usuários (${period} dias)`, Valor: newUsers },
          { Métrica: `Novos Projetos (${period} dias)`, Valor: newProjects },
          { Métrica: `Novas Fotos (${period} dias)`, Valor: newPhotos },
          ...projectsByStatus.map(item => ({
            Métrica: `Projetos - ${item.status}`,
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

      default:
        return NextResponse.json({ error: 'Tipo de relatório inválido' }, { status: 400 })
    }

    if (format === 'csv') {
      const csvContent = [
        headers.join(','),
        ...data.map(row => 
          headers.map(header => {
            const value = row[header]
            // Escapar aspas duplas e envolver em aspas se contém vírgula
            if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
              return `"${value.replace(/"/g, '""')}"`
            }
            return value
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