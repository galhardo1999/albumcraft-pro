import { NextRequest, NextResponse } from 'next/server'
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
import { prisma } from '@/lib/prisma'
import type { Prisma } from '@prisma/client'

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
    const albumId = searchParams.get('albumId')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    console.log('🔍 GET /api/photos - Parâmetros:', {
      userId: user.userId,
      albumId,
      limit,
      offset
    })

    // Construir filtros
    const whereClause: Prisma.PhotoWhereInput = {
      userId: user.userId
    }

    // Filtrar por álbum se especificado
    if (albumId) {
      whereClause.albumId = albumId
      console.log('📂 Filtrando fotos do álbum:', albumId)
    }

    // Buscar fotos no banco de dados
    const photos = await prisma.photo.findMany({
      where: whereClause,
      orderBy: {
          createdAt: 'desc'
        },
      take: limit,
      skip: offset,
      select: {
          id: true,
          filename: true,
          originalName: true,
          mimeType: true,
          s3Url: true,
          width: true,
          height: true,
          size: true,
          albumId: true,
          s3Key: true,
          createdAt: true,
          metadata: true,
          userId: true
        }
      })

    console.log(`📸 Encontradas ${photos.length} fotos para o usuário ${user.userId}`)
    
    if (albumId) {
      console.log(`📂 Fotos do álbum ${albumId}:`, photos.map(p => ({ id: p.id, filename: p.filename, albumId: p.albumId })))
    }

    // Contar total de fotos (para paginação)
    const totalPhotos = await prisma.photo.count({
      where: whereClause
    })

    // Normalizar saída adicionando alias url -> s3Url (compatibilidade com consumidores)
    const photosPayload = photos.map(p => ({ ...p, url: p.s3Url }))

    return NextResponse.json({
      success: true,
      data: photosPayload,
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
    const albumId = formData.get('albumId') as string | null
    
    console.log('📁 Arquivos recebidos:', files.length)

    // Verificar se o álbum existe e pertence ao usuário (se albumId foi fornecido)
    if (albumId) {
      console.log('3. Verificando se o álbum existe...')
      const albumExists = await prisma.album.findFirst({
        where: {
          id: albumId,
          userId: user.userId,
        },
      })

      if (!albumExists) {
        console.log('❌ Álbum não encontrado ou não pertence ao usuário')
        return NextResponse.json({
          success: false,
          error: 'Álbum não encontrado ou não pertence ao usuário'
        }, { status: 404 })
      }
      console.log('✅ Álbum verificado')
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
        const originalKey = generateS3Key(user.userId, sanitizedFileName, albumId || undefined)
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
            albumId: albumId || null, // Associar ao álbum se fornecido
            filename: sanitizedFileName,
            originalName: file.name,
            s3Url: originalUrl,
            size: originalMetadata.size,
            width: originalMetadata.width,
            height: originalMetadata.height,
            mimeType: file.type,
            s3Key: generateS3Key(user.userId, sanitizedFileName, albumId || undefined),
          }
        })
        console.log(`✅ Foto salva no banco`)

        uploadedPhotos.push({
          id: photo.id,
          name: photo.filename,
          url: photo.s3Url,
          width: photo.width ?? 0,
          height: photo.height ?? 0,
          fileSize: photo.size,
          uploadedAt: photo.createdAt?.toISOString() || new Date().toISOString(),
          albumId: photo.albumId, // Incluir albumId na resposta
          thumbnailUrl: thumbnailUrl
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
        albumId?: string | null; // Incluir albumId no tipo
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