import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-middleware';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const adminCheck = await requireAdmin(request);
    
    if (adminCheck instanceof NextResponse) {
      return adminCheck;
    }

    const { searchParams } = new URL(request.url);
    const period = parseInt(searchParams.get('period') || '30');

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - period);

    // Estatísticas básicas
    const [
      totalUsers,
      totalProjects,
      totalPhotos,
      newUsers,
      newProjects,
      newPhotos,
      projectsByStatus,
      usersByPlan,
      topActiveUsers
    ] = await Promise.all([
      prisma.user.count(),
      prisma.project.count(),
      prisma.photo.count(),
      prisma.user.count({
        where: { createdAt: { gte: startDate } }
      }),
      prisma.project.count({
        where: { createdAt: { gte: startDate } }
      }),
      prisma.photo.count({
        where: { uploadedAt: { gte: startDate } }
      }),
      prisma.project.groupBy({
        by: ['status'],
        _count: { status: true }
      }),
      prisma.user.groupBy({
        by: ['plan'],
        _count: { plan: true }
      }),
      prisma.user.findMany({
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
        orderBy: [
          { projects: { _count: 'desc' } },
          { photos: { _count: 'desc' } }
        ],
        take: 10
      })
    ]);

    // Usuários recentes
    const recentUsers = await prisma.user.findMany({
      where: { createdAt: { gte: startDate } },
      select: {
        id: true,
        name: true,
        email: true,
        plan: true,
        createdAt: true
      },
      orderBy: { createdAt: 'desc' },
      take: 10
    });

    // Projetos recentes
    const recentProjects = await prisma.project.findMany({
      where: { createdAt: { gte: startDate } },
      select: {
        id: true,
        name: true,
        status: true,
        createdAt: true,
        user: {
          select: {
            name: true,
            email: true
          }
        },
        _count: {
          select: {
            photos: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 10
    });

    // Estatísticas diárias dos últimos 7 dias
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - i);
      return date;
    }).reverse();

    const dailyStats = await Promise.all(
      last7Days.map(async (date) => {
        const nextDay = new Date(date);
        nextDay.setDate(nextDay.getDate() + 1);

        const [users, projects, photos] = await Promise.all([
          prisma.user.count({
            where: {
              createdAt: {
                gte: date,
                lt: nextDay
              }
            }
          }),
          prisma.project.count({
            where: {
              createdAt: {
                gte: date,
                lt: nextDay
              }
            }
          }),
          prisma.photo.count({
            where: {
              uploadedAt: {
                gte: date,
                lt: nextDay
              }
            }
          })
        ]);

        return {
          date: date.toISOString().split('T')[0],
          users,
          projects,
          photos
        };
      })
    );

    // Estatísticas de armazenamento
    const storageStats = {
      usedStorage: totalPhotos * 2048000, // Estimativa: 2MB por foto
      totalStorage: 1000000000000, // 1TB
      averageProjectSize: totalProjects > 0 ? (totalPhotos * 2048000) / totalProjects : 0
    };

    // Estatísticas de performance (simuladas)
    const performanceStats = {
      averageProcessingTime: 2.3 + Math.random() * 0.5,
      successRate: 98.5 + Math.random() * 1.5,
      errorRate: 1.5 - Math.random() * 1.5
    };

    // Calcular taxas de crescimento
    const previousPeriodStart = new Date(startDate);
    previousPeriodStart.setDate(previousPeriodStart.getDate() - period);

    const [prevUsers, prevProjects, prevPhotos] = await Promise.all([
      prisma.user.count({
        where: {
          createdAt: {
            gte: previousPeriodStart,
            lt: startDate
          }
        }
      }),
      prisma.project.count({
        where: {
          createdAt: {
            gte: previousPeriodStart,
            lt: startDate
          }
        }
      }),
      prisma.photo.count({
        where: {
          uploadedAt: {
            gte: previousPeriodStart,
            lt: startDate
          }
        }
      })
    ]);

    const userGrowthRate = prevUsers > 0 ? ((newUsers - prevUsers) / prevUsers) * 100 : 0;
    const projectGrowthRate = prevProjects > 0 ? ((newProjects - prevProjects) / prevProjects) * 100 : 0;
    const photoGrowthRate = prevPhotos > 0 ? ((newPhotos - prevPhotos) / prevPhotos) * 100 : 0;

    const detailedStats = {
      overview: {
        totalUsers,
        totalProjects,
        totalPhotos,
        recentUsers: newUsers,
        recentProjects: newProjects,
        recentPhotos: newPhotos,
        userGrowthRate,
        projectGrowthRate,
        photoGrowthRate
      },
      projectsByStatus: projectsByStatus.map(item => ({
        status: item.status,
        count: item._count.status
      })),
      usersByPlan: usersByPlan.map(item => ({
        plan: item.plan,
        count: item._count.plan
      })),
      topActiveUsers: topActiveUsers.map(user => ({
        id: user.id,
        name: user.name,
        email: user.email,
        plan: user.plan,
        projectCount: user._count.projects,
        photoCount: user._count.photos
      })),
      recentUsers: recentUsers.map(user => ({
        id: user.id,
        name: user.name,
        email: user.email,
        plan: user.plan,
        createdAt: user.createdAt
      })),
      recentProjects: recentProjects.map(project => ({
        id: project.id,
        name: project.name,
        status: project.status,
        createdAt: project.createdAt,
        user: project.user,
        photoCount: project._count.photos
      })),
      dailyStats,
      storageStats,
      performanceStats
    };

    return NextResponse.json(detailedStats);
  } catch (error) {
    console.error('Error fetching detailed reports:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}