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
    const period = searchParams.get('period') || '30' // dias

    const periodDays = parseInt(period)
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - periodDays)

    // Estatísticas gerais
    const [
      totalUsers,
      totalProjects,
      totalPhotos,
      newUsers,
      newProjects,
      newPhotos,
      previousPeriodUsers,
      previousPeriodProjects
    ] = await Promise.all([
      // Total de usuários
      prisma.user.count(),
      
      // Total de projetos
      prisma.project.count(),
      
      // Total de fotos
      prisma.photo.count(),
      
      // Novos usuários no período
      prisma.user.count({
        where: {
          createdAt: {
            gte: startDate
          }
        }
      }),
      
      // Novos projetos no período
      prisma.project.count({
        where: {
          createdAt: {
            gte: startDate
          }
        }
      }),
      
      // Novas fotos no período
      prisma.photo.count({
        where: {
          uploadedAt: {
            gte: startDate
          }
        }
      }),
      
      // Usuários do período anterior (para calcular crescimento)
      prisma.user.count({
        where: {
          createdAt: {
            gte: new Date(startDate.getTime() - (periodDays * 24 * 60 * 60 * 1000)),
            lt: startDate
          }
        }
      }),
      
      // Projetos do período anterior
      prisma.project.count({
        where: {
          createdAt: {
            gte: new Date(startDate.getTime() - (periodDays * 24 * 60 * 60 * 1000)),
            lt: startDate
          }
        }
      })
    ])

    // Calcular taxas de crescimento
    const userGrowthRate = previousPeriodUsers > 0 
      ? ((newUsers - previousPeriodUsers) / previousPeriodUsers) * 100 
      : newUsers > 0 ? 100 : 0

    const projectGrowthRate = previousPeriodProjects > 0 
      ? ((newProjects - previousPeriodProjects) / previousPeriodProjects) * 100 
      : newProjects > 0 ? 100 : 0

    // Projetos por status
    const projectsByStatus = await prisma.project.groupBy({
      by: ['status'],
      _count: {
        id: true
      }
    })

    // Usuários por plano
    const usersByPlan = await prisma.user.groupBy({
      by: ['plan'],
      _count: {
        id: true
      }
    })

    // Top usuários mais ativos (com mais projetos)
    const topActiveUsers = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        plan: true,
        _count: {
          select: {
            projects: true,
            photos: true
          }
        }
      },
      orderBy: {
        projects: {
          _count: 'desc'
        }
      },
      take: 10
    })

    const reportData = {
      period: periodDays,
      overview: {
        totalUsers,
        totalProjects,
        totalPhotos,
        newUsers,
        newProjects,
        newPhotos,
        userGrowthRate: Math.round(userGrowthRate * 100) / 100,
        projectGrowthRate: Math.round(projectGrowthRate * 100) / 100
      },
      projectsByStatus: projectsByStatus.map(item => ({
        status: item.status,
        count: item._count.id
      })),
      usersByPlan: usersByPlan.map(item => ({
        plan: item.plan,
        count: item._count.id
      })),
      topActiveUsers: topActiveUsers.map(user => ({
        id: user.id,
        name: user.name,
        email: user.email,
        plan: user.plan,
        projectCount: user._count.projects,
        photoCount: user._count.photos
      }))
    }

    return NextResponse.json(reportData)
  } catch (error) {
    console.error('Erro ao gerar relatórios:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}