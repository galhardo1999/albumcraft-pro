import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from './auth-middleware';
import { prisma } from './prisma';

export async function requireAdmin(request: NextRequest) {
  try {
    // Verificar se o usuário está autenticado
    const user = await authenticateRequest(request);
    
    if (!user) {
      return NextResponse.json(
        { error: 'Token de autenticação inválido' },
        { status: 401 }
      );
    }

    // Buscar o usuário no banco para verificar se é admin
    const dbUser = await prisma.user.findUnique({
      where: { id: user.userId },
      select: { id: true, email: true, name: true, isAdmin: true }
    });

    if (!dbUser || !dbUser.isAdmin) {
      return NextResponse.json(
        { error: 'Acesso negado. Apenas administradores podem acessar este recurso.' },
        { status: 403 }
      );
    }

    return { success: true, user: dbUser };
  } catch (error) {
    console.error('Erro na verificação de admin:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}