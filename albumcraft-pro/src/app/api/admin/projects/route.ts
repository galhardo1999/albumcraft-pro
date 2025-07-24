import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-middleware';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

// Schema de validação para criação de projeto pelo admin
const CreateProjectAdminSchema = z.object({
  userId: z.string().min(1, 'ID do usuário é obrigatório'),
  name: z.string().min(1, 'Nome é obrigatório').max(100),
  albumSize: z.enum([
    // Formatos Quadrados
    'SIZE_15X15', 'SIZE_20X20', 'SIZE_25X25', 'SIZE_30X30',
    // Formatos Paisagem  
    'SIZE_20X15', 'SIZE_30X20', 'SIZE_40X30',
    // Formatos Retrato
    'SIZE_15X20', 'SIZE_20X30', 'SIZE_30X40',
    // Compatibilidade (deprecated)
    'SMALL', 'MEDIUM', 'LARGE', 'EXTRA_LARGE', 'CUSTOM'
  ]),
  status: z.enum(['DRAFT', 'IN_PROGRESS', 'COMPLETED']),
  creationType: z.enum(['SINGLE', 'BATCH']),
});

export async function GET(request: NextRequest) {
  // Verificar se o usuário é admin
  const adminCheck = await requireAdmin(request);
  if (adminCheck instanceof NextResponse) {
    return adminCheck;
  }

  try {
    // Buscar todos os projetos com informações detalhadas
    const projects = await prisma.project.findMany({
      select: {
        id: true,
        name: true,
        description: true,
        status: true,
        albumSize: true,
        template: true,
        creationType: true,
        group: true,
        eventName: true,
        createdAt: true,
        user: {
          select: {
            id: true,
            email: true,
            name: true
          }
        },
        _count: {
          select: {
            pages: true,
            photos: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return NextResponse.json({ projects });
  } catch (error) {
    console.error('Erro ao buscar projetos:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  // Verificar se o usuário é admin
  const adminCheck = await requireAdmin(request);
  if (adminCheck instanceof NextResponse) {
    return adminCheck;
  }

  try {
    const body = await request.json();
    
    // Validar dados de entrada
    const validatedData = CreateProjectAdminSchema.parse(body);

    // Verificar se o usuário existe
    const user = await prisma.user.findUnique({
      where: { id: validatedData.userId }
    });

    if (!user) {
      return NextResponse.json(
        { error: 'Usuário não encontrado' },
        { status: 404 }
      );
    }

    // Verificar limites do plano do usuário (apenas para planos limitados)
    if (user.plan === 'FREE') {
      const projectCount = await prisma.project.count({
        where: { userId: validatedData.userId }
      });

      if (projectCount >= 3) {
        return NextResponse.json(
          { error: 'Usuário atingiu o limite de projetos para o plano gratuito (3 projetos)' },
          { status: 400 }
        );
      }
    }

    // Criar projeto
    const project = await prisma.project.create({
      data: {
        userId: validatedData.userId,
        name: validatedData.name,
        albumSize: validatedData.albumSize,
        status: validatedData.status,
        creationType: validatedData.creationType,
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true
          }
        },
        _count: {
          select: {
            pages: true,
            photos: true
          }
        }
      }
    });

    return NextResponse.json({ 
      success: true,
      project,
      message: 'Projeto criado com sucesso'
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: error.issues },
        { status: 400 }
      );
    }

    console.error('Erro ao criar projeto:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}