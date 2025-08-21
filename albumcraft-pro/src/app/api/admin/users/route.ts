import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-middleware';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { z } from 'zod';

// Schema de validação para criação de usuário
const CreateUserSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Senha deve ter pelo menos 6 caracteres'),
  plan: z.enum(['FREE', 'PRO', 'ENTERPRISE']).default('FREE'),
  isAdmin: z.boolean().default(false)
});

export async function GET(request: NextRequest) {
  // Verificar se o usuário é admin
  const adminCheck = await requireAdmin(request);
  if (adminCheck instanceof NextResponse) {
    return adminCheck;
  }

  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const skip = (page - 1) * limit;

    // Construir filtros de busca
    const where = search ? {
      OR: [
        { name: { contains: search, mode: 'insensitive' as const } },
        { email: { contains: search, mode: 'insensitive' as const } }
      ]
    } : {};

    // Buscar usuários com filtros
    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          email: true,
          name: true,
          plan: true,
          isAdmin: true,
          createdAt: true,
          updatedAt: true,
          lastLogin: true,
          _count: {
            select: {
              albums: true,
              photos: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        },
        skip,
        take: limit
      }),
      prisma.user.count({ where })
    ]);

    // Manter compatibilidade com clients antigos adicionando alias projects
    const usersWithAlias = users.map(u => ({
      ...u,
      _count: {
        ...u._count,
        // Alias para compatibilidade
        projects: u._count.albums
      }
    }));

    return NextResponse.json({ 
      users: usersWithAlias,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Erro ao buscar usuários:', error);
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
    const validatedData = CreateUserSchema.parse(body);

    // Verificar se o email já existe
    const existingUser = await prisma.user.findUnique({
      where: { email: validatedData.email }
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'Email já está em uso' },
        { status: 400 }
      );
    }

    // Hash da senha
    const passwordHash = await bcrypt.hash(validatedData.password, 12);

    // Criar usuário
    const user = await prisma.user.create({
      data: {
        name: validatedData.name,
        email: validatedData.email,
        passwordHash,
        plan: validatedData.plan,
        isAdmin: validatedData.isAdmin
      },
      select: {
        id: true,
        email: true,
        name: true,
        plan: true,
        isAdmin: true,
        createdAt: true,
        updatedAt: true,
        lastLogin: true,
        _count: {
          select: {
            albums: true,
            photos: true
          }
        }
      }
    });

    const userWithAlias = {
      ...user,
      _count: {
        ...user._count,
        projects: user._count.albums
      }
    };

    return NextResponse.json({ 
      success: true,
      user: userWithAlias,
      message: 'Usuário criado com sucesso'
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: error.issues },
        { status: 400 }
      );
    }

    console.error('Erro ao criar usuário:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}