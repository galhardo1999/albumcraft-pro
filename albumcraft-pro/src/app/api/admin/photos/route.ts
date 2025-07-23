import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { uploadToS3, generateS3Key, generateThumbnailKey, isS3Configured } from '@/lib/s3'
import { authenticateRequest, createAuthResponse } from '@/lib/auth-middleware'
import { 
  processImage, 
  createThumbnail, 
  getImageMetadata, 
  isValidImageFormat, 
  isValidFileSize, 
  sanitizeFileName 
} from '@/lib/image-processing'

const prisma = new PrismaClient()

// GET - Buscar fotos (admin pode ver fotos de qualquer usuário)
export async function GET(request: NextRequest) {
  try {
    // Verificar autenticação usando o middleware existente
    const user = await authenticateRequest(request)
    
    if (!user) {
      return createAuthResponse('Token de autenticação inválido ou expirado')
    }

    // Verificar se é admin
    const adminUser = await prisma.user.findUnique({
      where: { id: user.userId },
      select: { isAdmin: true }
    })

    if (!adminUser?.isAdmin) {
      return NextResponse.json(
        { success: false, message: 'Acesso negado. Apenas administradores podem acessar esta funcionalidade.' },
        { status: 403 }
      )
    }

    // Obter parâmetros da query
    const { searchParams } = new URL(request.url)
    const projectId = searchParams.get('projectId')
    const userId = searchParams.get('userId')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    console.log('🔍 GET /api/admin/photos - Parâmetros:', {
      adminUserId: user.userId,
      projectId,
      userId,
      limit,
      offset
    })

    // Construir filtros
    const whereClause: any = {}

    // Filtrar por usuário se especificado
    if (userId) {
      whereClause.userId = userId
    }

    // Filtrar por projeto se especificado
    if (projectId) {
      whereClause.projectId = projectId
      console.log('📂 Filtrando fotos do projeto:', projectId)
    }

    // Buscar fotos no banco de dados
    const photos = await prisma.photo.findMany({
      where: whereClause,
      orderBy: {
        uploadedAt: 'desc'
      },
      take: limit,
      skip: offset,
      select: {
        id: true,
        filename: true,
        originalUrl: true,
        thumbnailUrl: true,
        mediumUrl: true,
        width: true,
        height: true,
        fileSize: true,
        projectId: true,
        userId: true,
        isS3Stored: true,
        s3Key: true,
        uploadedAt: true,
        metadata: true,
        user: {
          select: {
            name: true,
            email: true
          }
        }
      }
    })

    console.log(`📸 Encontradas ${photos.length} fotos`)

    // Contar total de fotos (para paginação)
    const totalPhotos = await prisma.photo.count({
      where: whereClause
    })

    return NextResponse.json({
      success: true,
      data: photos,
      pagination: {
        total: totalPhotos,
        limit,
        offset,
        hasMore: offset + photos.length < totalPhotos
      }
    })

  } catch (error) {
    console.error('❌ Erro ao buscar fotos:', error)
    return NextResponse.json(
      { 
        success: false,
        message: 'Erro interno do servidor',
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}

// POST - Upload de novas fotos (admin pode fazer upload para qualquer usuário)
export async function POST(request: NextRequest) {
  console.log('=== INÍCIO DO UPLOAD DE FOTOS (ADMIN) ===')
  
  try {
    // Autenticar usuário
    const user = await authenticateRequest(request)
    if (!user) {
      return createAuthResponse('Token de autenticação inválido ou expirado')
    }

    // Verificar se é admin
    const adminUser = await prisma.user.findUnique({
      where: { id: user.userId },
      select: { isAdmin: true }
    })

    if (!adminUser?.isAdmin) {
      return NextResponse.json(
        { success: false, message: 'Acesso negado. Apenas administradores podem acessar esta funcionalidade.' },
        { status: 403 }
      )
    }

    // Obter dados do formulário
    console.log('2. Processando FormData...')
    let formData: FormData
    try {
      formData = await request.formData()
    } catch (error) {
      console.error('Erro ao fazer parse do FormData:', error)
      return NextResponse.json({
        success: false,
        error: 'Dados do formulário inválidos'
      }, { status: 400 })
    }

    const files = formData.getAll('files') as File[]
    const projectId = formData.get('projectId') as string | null
    const targetUserId = formData.get('userId') as string // ID do usuário para quem as fotos serão enviadas
    
    console.log('📁 Arquivos recebidos:', files.length)
    console.log('👤 Usuário alvo:', targetUserId)

    if (!targetUserId) {
      return NextResponse.json({
        success: false,
        error: 'ID do usuário é obrigatório'
      }, { status: 400 })
    }

    // Verificar se o usuário alvo existe
    const targetUser = await prisma.user.findUnique({
      where: { id: targetUserId }
    })

    if (!targetUser) {
      return NextResponse.json({
        success: false,
        error: 'Usuário não encontrado'
      }, { status: 404 })
    }

    // Verificar se o projeto existe e pertence ao usuário alvo (se projectId fornecido)
    if (projectId) {
      console.log('3. Verificando projeto...')
      const projectExists = await prisma.project.findFirst({
        where: {
          id: projectId,
          userId: targetUserId,
        },
      })

      if (!projectExists) {
        console.log('❌ Projeto não encontrado ou não pertence ao usuário')
        return NextResponse.json({
          success: false,
          error: 'Projeto não encontrado ou não pertence ao usuário'
        }, { status: 404 })
      }
      console.log('✅ Projeto verificado')
    }

    if (!files || files.length === 0) {
      console.log('❌ Nenhum arquivo enviado')
      return NextResponse.json({ 
        success: false, 
        error: 'Nenhum arquivo enviado' 
      }, { status: 400 })
    }

    console.log('4. Iniciando processamento dos arquivos...')
    const uploadedPhotos = []
    const errors = []

    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      console.log(`\n--- Processando arquivo ${i + 1}/${files.length}: ${file.name} ---`)
      console.log(`📋 Tipo: ${file.type}, Tamanho: ${file.size} bytes`)
      
      try {
        // Validar tipo de arquivo
        console.log('📋 Validando formato...')
        if (!isValidImageFormat(file.type)) {
          console.log(`❌ Formato não suportado: ${file.type}`)
          errors.push(`${file.name}: Formato não suportado (${file.type})`)
          continue
        }

        // Validar tamanho do arquivo
        console.log('📏 Validando tamanho...')
        if (!isValidFileSize(file.size)) {
          console.log(`❌ Arquivo muito grande: ${file.size} bytes`)
          errors.push(`${file.name}: Muito grande (${(file.size / 1024 / 1024).toFixed(1)}MB). Máximo: 50MB`)
          continue
        }

        console.log(`✅ Validações passaram, convertendo para buffer...`)
        
        // Converter arquivo para buffer
        let buffer: Buffer
        try {
          buffer = Buffer.from(await file.arrayBuffer())
          console.log(`✅ Buffer criado com ${buffer.length} bytes`)
        } catch (error) {
          console.error(`Erro ao converter arquivo ${file.name} para buffer:`, error)
          errors.push(`${file.name}: Erro ao processar arquivo`)
          continue
        }
        
        // Obter metadados originais
        console.log(`📊 Obtendo metadados da imagem...`)
        let originalMetadata
        try {
          originalMetadata = await getImageMetadata(buffer)
          console.log(`✅ Metadados obtidos`)
        } catch (error) {
          console.error(`Erro ao obter metadados de ${file.name}:`, error)
          errors.push(`${file.name}: Erro ao ler metadados da imagem`)
          continue
        }
        
        // Sanitizar nome do arquivo
        const sanitizedFileName = sanitizeFileName(file.name)
        console.log(`🧹 Nome sanitizado: ${sanitizedFileName}`)

        let originalUrl: string
        let thumbnailUrl: string

        if (isS3Configured()) {
          console.log(`☁️ S3 configurado, fazendo upload para S3...`)
          // **MODO PRODUÇÃO: Upload para S3**
          
          // Processar imagem original (otimizar)
          console.log(`🖼️ Processando imagem original...`)
          let processedImage
          try {
            processedImage = await processImage(buffer, {
              format: 'jpeg',
              quality: 85
            })
            console.log(`✅ Imagem processada: ${processedImage.buffer.length} bytes`)
          } catch (error) {
            console.error(`Erro ao processar imagem ${file.name}:`, error)
            
            if (error instanceof Error) {
              if (error.message.includes('Input buffer contains unsupported image format')) {
                errors.push(`${file.name}: Formato de imagem não suportado`)
              } else if (error.message.includes('Input image exceeds pixel limit')) {
                errors.push(`${file.name}: Imagem muito grande (muitos pixels)`)
              } else if (error.message.includes('memory')) {
                errors.push(`${file.name}: Erro de memória durante processamento`)
              } else {
                errors.push(`${file.name}: Erro no processamento da imagem`)
              }
            } else {
              errors.push(`${file.name}: Erro desconhecido no processamento`)
            }
            continue
          }
          
          // Criar thumbnail
          console.log(`🖼️ Criando thumbnail...`)
          let thumbnail
          try {
            thumbnail = await createThumbnail(buffer)
            console.log(`✅ Thumbnail criado: ${thumbnail.buffer.length} bytes`)
          } catch (error) {
            console.error(`Erro ao criar thumbnail de ${file.name}:`, error)
            errors.push(`${file.name}: Erro ao criar thumbnail`)
            continue
          }
          
          // Gerar chaves únicas para S3
          const originalKey = generateS3Key(targetUserId, sanitizedFileName, projectId || undefined)
          const thumbnailKey = generateThumbnailKey(originalKey)
          
          // Upload para S3
          try {
            console.log(`📤 Fazendo upload da imagem original...`)
            originalUrl = await uploadToS3(
              processedImage.buffer,
              originalKey,
              processedImage.contentType
            )
            console.log(`✅ Upload original concluído`)
            
            console.log(`📤 Fazendo upload do thumbnail...`)
            thumbnailUrl = await uploadToS3(
              thumbnail.buffer,
              thumbnailKey,
              thumbnail.contentType
            )
            console.log(`✅ Upload thumbnail concluído`)
          } catch (error) {
            console.error(`Erro no upload S3 para ${file.name}:`, error)
            errors.push(`${file.name}: Erro no upload para armazenamento`)
            continue
          }
          
        } else {
          console.log(`💾 S3 não configurado, usando fallback Base64...`)
          // **MODO DESENVOLVIMENTO: Base64 (fallback)**
          console.log('⚠️  S3 não configurado, usando fallback Base64')
          
          let processedImage
          let thumbnail
          
          try {
            processedImage = await processImage(buffer, {
              maxWidth: 1200,
              maxHeight: 1200,
              format: 'jpeg',
              quality: 80
            })
            
            thumbnail = await createThumbnail(buffer)
            
            originalUrl = `data:${processedImage.contentType};base64,${processedImage.buffer.toString('base64')}`
            thumbnailUrl = `data:${thumbnail.contentType};base64,${thumbnail.buffer.toString('base64')}`
            console.log('✅ URLs Base64 geradas')
          } catch (error) {
            console.error(`Erro ao processar imagem ${file.name} para Base64:`, error)
            
            if (error instanceof Error) {
              if (error.message.includes('Input buffer contains unsupported image format')) {
                errors.push(`${file.name}: Formato de imagem não suportado`)
              } else if (error.message.includes('Input image exceeds pixel limit')) {
                errors.push(`${file.name}: Imagem muito grande (muitos pixels)`)
              } else if (error.message.includes('memory')) {
                errors.push(`${file.name}: Erro de memória durante processamento`)
              } else {
                errors.push(`${file.name}: Erro no processamento da imagem`)
              }
            } else {
              errors.push(`${file.name}: Erro na conversão da imagem`)
            }
            continue
          }
        }

        console.log(`💾 Salvando no banco de dados...`)
        // Salvar no banco de dados
        try {
          const photo = await prisma.photo.create({
            data: {
              userId: targetUserId, // Usar o ID do usuário alvo
              projectId: projectId || null, // Associar ao projeto se fornecido
              filename: sanitizedFileName,
              originalUrl: originalUrl,
              thumbnailUrl: thumbnailUrl,
              fileSize: originalMetadata.size,
              width: originalMetadata.width,
              height: originalMetadata.height,
              mimeType: file.type,
              s3Key: isS3Configured() ? generateS3Key(targetUserId, sanitizedFileName, projectId || undefined) : null,
            }
          })
          console.log(`✅ Foto salva no banco (ID: ${photo.id})`)

          uploadedPhotos.push({
            id: photo.id,
            name: photo.filename,
            url: photo.originalUrl,
            width: photo.width,
            height: photo.height,
            fileSize: photo.fileSize,
            uploadedAt: photo.uploadedAt.toISOString(),
            projectId: photo.projectId // Incluir projectId na resposta
          })
        } catch (error) {
          console.error(`Erro ao salvar foto ${file.name} no banco:`, error)
          errors.push(`${file.name}: Erro ao salvar no banco de dados`)
          continue
        }

      } catch (fileError) {
        console.error(`❌ Erro geral no processamento de ${file.name}:`, fileError)
        errors.push(`${file.name}: Erro inesperado`)
      }
    }

    console.log('\n=== RESULTADO FINAL ===')
    console.log('✅ Fotos carregadas:', uploadedPhotos.length)
    console.log('❌ Erros:', errors.length)

    // Preparar resposta
    const response: {
      success: boolean;
      photos: Array<{
        id: string;
        name: string;
        url: string;
        width: number;
        height: number;
        fileSize: number;
        uploadedAt: string;
        projectId?: string | null;
      }>;
      message: string;
      warnings?: string[];
      errorCount?: number;
      totalFiles?: number;
    } = { 
      success: uploadedPhotos.length > 0, 
      photos: uploadedPhotos,
      message: `${uploadedPhotos.length} foto(s) enviada(s) com sucesso`,
      totalFiles: files.length,
      errorCount: errors.length
    }

    if (errors.length > 0) {
      response.warnings = errors
      response.message += `. ${errors.length} arquivo(s) com erro.`
      console.log('Erros encontrados:', errors)
    }

    return NextResponse.json(response, {
      status: uploadedPhotos.length > 0 ? 200 : 400
    })

  } catch (error) {
    console.error('💥 ERRO GERAL NO UPLOAD:', error)
    
    // Verificar tipos específicos de erro
    if (error instanceof Error) {
      if (error.message.includes('timeout')) {
        return NextResponse.json({ 
          success: false,
          error: 'Timeout no processamento. Tente com menos fotos ou imagens menores.' 
        }, { status: 408 })
      } else if (error.message.includes('memory') || error.message.includes('heap')) {
        return NextResponse.json({ 
          success: false,
          error: 'Erro de memória. Tente com imagens menores ou menos fotos por vez.' 
        }, { status: 507 })
      }
    }
    
    return NextResponse.json({ 
      success: false, 
      error: 'Erro interno do servidor durante upload' 
    }, { status: 500 })
  } finally {
    await prisma.$disconnect()
  }
}