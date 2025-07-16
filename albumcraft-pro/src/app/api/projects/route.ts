import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { withAuth } from '@/lib/auth-middleware'
import { CreateProjectSchema } from '@/lib/validations'

// GET /api/projects - Listar projetos do usuário
export const GET = withAuth(async (request: NextRequest, user) => {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const skip = (page - 1) * limit
    
    const [projects, total] = await Promise.all([
      prisma.project.findMany({
        where: { userId: user.userId },
        include: {
          pages: {
            select: { id: true }
          },
          _count: {
            select: { pages: true }
          }
        },
        orderBy: { updatedAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.project.count({
        where: { userId: user.userId }
      })
    ])
    
    return NextResponse.json({
      success: true,
      data: projects,
      meta: {
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      }
    })
  } catch (error) {
    console.error('Get projects error:', error)
    return NextResponse.json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Erro ao buscar projetos'
      }
    }, { status: 500 })
  }
})

// POST /api/projects - Criar novo projeto
export const POST = withAuth(async (request: NextRequest, user) => {
  try {
    const body = await request.json()
    
    // Validar dados de entrada
    const validatedData = CreateProjectSchema.parse(body)
    
    // Verificar limites do plano
    if (user.plan === 'FREE') {
      const projectCount = await prisma.project.count({
        where: { userId: user.userId }
      })
      
      if (projectCount >= 3) {
        return NextResponse.json({
          success: false,
          error: {
            code: 'PLAN_LIMIT_EXCEEDED',
            message: 'Limite de projetos atingido para o plano gratuito'
          }
        }, { status: 403 })
      }
    }
    
    // Criar projeto
    const project = await prisma.project.create({
      data: {
        userId: user.userId,
        name: validatedData.name,
        description: validatedData.description,
        albumSize: validatedData.albumSize,
        template: validatedData.template || 'classic',
        status: validatedData.status || 'DRAFT',
        creationType: validatedData.creationType || 'SINGLE',
        group: validatedData.group,
        settings: {
          customWidth: validatedData.customWidth,
          customHeight: validatedData.customHeight,
        }
      },
      include: {
        _count: {
          select: { pages: true }
        }
      }
    })
    
    return NextResponse.json({
      success: true,
      project: project
    }, { status: 201 })
    
  } catch (error) {
    console.error('Create project error:', error)
    
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Dados inválidos',
          details: error
        }
      }, { status: 400 })
    }
    
    return NextResponse.json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Erro ao criar projeto'
      }
    }, { status: 500 })
  }
})