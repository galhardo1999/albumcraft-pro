import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-middleware';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  // Verificar se o usuário é admin
  const adminCheck = await requireAdmin(request);
  if (adminCheck instanceof NextResponse) {
    return adminCheck;
  }

  try {
    // Estatísticas gerais
    const stats = await Promise.all([
      // Total de usuários
      prisma.user.count(),
      
      // Total de projetos
      prisma.project.count(),
      
      // Total de fotos
      prisma.photo.count(),
      
      // Projetos por status
      prisma.project.groupBy({
        by: ['status'],
        _count: {
          status: true
        }
      }),
      
      // Usuários por plano
      prisma.user.groupBy({
        by: ['plan'],
        _count: {
          plan: true
        }
      }),
      
      // Projetos criados nos últimos 30 dias
      prisma.project.count({
        where: {
          createdAt: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
          }
        }
      }),
      
      // Usuários registrados nos últimos 30 dias
      prisma.user.count({
        where: {
          createdAt: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
          }
        }
      })
    ]);

    const [
      totalUsers,
      totalProjects,
      totalPhotos,
      projectsByStatus,
      usersByPlan,
      recentProjects,
      recentUsers
    ] = stats;

    return NextResponse.json({
      overview: {
        totalUsers,
        totalProjects,
        totalPhotos,
        recentProjects,
        recentUsers
      },
      projectsByStatus,
      usersByPlan
    });
  } catch (error) {
    console.error('Erro ao buscar estatísticas:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}