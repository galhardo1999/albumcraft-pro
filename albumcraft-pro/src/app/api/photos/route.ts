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

// GET - Buscar fotos do usuário
export async function GET(request: NextRequest) {
  try {
    // Verificar autenticação usando o middleware existente
    const user = await authenticateRequest(request)
    
    if (!user) {
      return createAuthResponse('Token de autenticação inválido ou expirado')
    }

    // Obter parâmetros da query
    const { searchParams } = new URL(request.url)
    const projectId = searchParams.get('projectId')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    console.log('🔍 GET /api/photos - Parâmetros:', {
      userId: user.userId,
      projectId,
      limit,
      offset
    })

    // Construir filtros
    const whereClause: any = {
      userId: user.userId
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
        isS3Stored: true,
        s3Key: true,
        uploadedAt: true,
        metadata: true
      }
    })

    console.log(`📸 Encontradas ${photos.length} fotos para o usuário ${user.userId}`)
    
    if (projectId) {
      console.log(`📂 Fotos do projeto ${projectId}:`, photos.map(p => ({ id: p.id, filename: p.filename, projectId: p.projectId })))
    }

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

// POST - Upload de novas fotos
export async function POST(request: NextRequest) {
  console.log('=== INÍCIO DO UPLOAD DE FOTOS ===')
  
  try {
    // Autenticar usuário
    const user = await authenticateRequest(request)
    if (!user) {
      return createAuthResponse('Token de autenticação inválido ou expirado')
    }

    // Obter dados do formulário
    console.log('2. Processando FormData...')
    const formData = await request.formData()
    const files = formData.getAll('files') as File[]
    const projectId = formData.get('projectId') as string | null
    
    console.log('📁 Arquivos recebidos:', files.length)

    // Verificar se o projeto existe e pertence ao usuário (se projectId fornecido)
    if (projectId) {
      console.log('3. Verificando projeto...')
      const projectExists = await prisma.project.findFirst({
        where: {
          id: projectId,
          userId: user.userId,
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
          errors.push(`${file.name}: Formato não suportado`)
          continue
        }

        // Validar tamanho do arquivo
        console.log('📏 Validando tamanho...')
        if (!isValidFileSize(file.size)) {
          console.log(`❌ Arquivo muito grande: ${file.size} bytes`)
          errors.push(`${file.name}: Arquivo muito grande (máximo 50MB)`)
          continue
        }

        console.log(`✅ Validações passaram, convertendo para buffer...`)
        
        // Converter arquivo para buffer
        const buffer = Buffer.from(await file.arrayBuffer())
        console.log(`✅ Buffer criado com ${buffer.length} bytes`)
        
        // Obter metadados originais
        console.log(`📊 Obtendo metadados da imagem...`)
        const originalMetadata = await getImageMetadata(buffer)
        console.log(`✅ Metadados obtidos`)
        
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
          const processedImage = await processImage(buffer, {
            format: 'jpeg',
            quality: 85
          })
          console.log(`✅ Imagem processada: ${processedImage.buffer.length} bytes`)
          
          // Criar thumbnail
          console.log(`🖼️ Criando thumbnail...`)
          const thumbnail = await createThumbnail(buffer)
          console.log(`✅ Thumbnail criado: ${thumbnail.buffer.length} bytes`)
          
          // Gerar chaves únicas para S3
          const originalKey = generateS3Key(user.userId, sanitizedFileName, projectId || undefined)
          const thumbnailKey = generateThumbnailKey(originalKey)
          
          // Upload para S3
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
          
        } else {
          console.log(`💾 S3 não configurado, usando fallback Base64...`)
          // **MODO DESENVOLVIMENTO: Base64 (fallback)**
          console.log('⚠️  S3 não configurado, usando fallback Base64')
          
          const processedImage = await processImage(buffer, {
            maxWidth: 1200,
            maxHeight: 1200,
            format: 'jpeg',
            quality: 80
          })
          
          const thumbnail = await createThumbnail(buffer)
          
          originalUrl = `data:${processedImage.contentType};base64,${processedImage.buffer.toString('base64')}`
          thumbnailUrl = `data:${thumbnail.contentType};base64,${thumbnail.buffer.toString('base64')}`
          console.log('✅ URLs Base64 geradas')
        }

        console.log(`💾 Salvando no banco de dados...`)
        // Salvar no banco de dados
        const photo = await prisma.photo.create({
          data: {
            userId: user.userId,
            projectId: projectId || null, // Associar ao projeto se fornecido
            filename: sanitizedFileName,
            originalUrl: originalUrl,
            thumbnailUrl: thumbnailUrl,
            fileSize: originalMetadata.size,
            width: originalMetadata.width,
            height: originalMetadata.height,
            mimeType: file.type,
            s3Key: isS3Configured() ? generateS3Key(user.userId, sanitizedFileName, projectId || undefined) : null,
          }
        })
        console.log(`✅ Foto salva no banco`)

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

      } catch (fileError) {
        console.error(`❌ Erro ao processar ${file.name}:`, fileError)
        errors.push(`${file.name}: Erro no processamento`)
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
        projectId?: string | null; // Incluir projectId no tipo
      }>;
      message: string;
      warnings?: string[];
    } = { 
      success: true, 
      photos: uploadedPhotos,
      message: `${uploadedPhotos.length} foto(s) enviada(s) com sucesso`
    }

    if (errors.length > 0) {
      response.warnings = errors
      response.message += `. ${errors.length} arquivo(s) com erro.`
    }

    return NextResponse.json(response)

  } catch (error) {
    console.error('💥 ERRO GERAL NO UPLOAD:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Erro interno do servidor' 
    }, { status: 500 })
  }
}