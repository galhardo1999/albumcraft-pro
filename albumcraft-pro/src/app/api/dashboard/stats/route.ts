import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/auth-middleware';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const user = await authenticateRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const userId = user.userId;

    // Buscar estatísticas do usuário
    const [totalProjects, activeProjects, totalPhotos, storageUsed] = await Promise.all([
      prisma.project.count({
        where: { userId }
      }),
      prisma.project.count({
        where: { 
          userId,
          status: { in: ['DRAFT', 'IN_PROGRESS'] }
        }
      }),
      prisma.photo.count({
        where: { userId }
      }),
      prisma.photo.aggregate({
        where: {
          project: {
            userId
          }
        },
        _sum: {
          fileSize: true
        }
      })
    ]);

    const stats = {
      totalProjects,
      activeProjects,
      totalPhotos,
      storageUsed: storageUsed._sum.fileSize || 0
    };

    return NextResponse.json(stats);
  } catch (error) {
    console.error('Dashboard stats error:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}