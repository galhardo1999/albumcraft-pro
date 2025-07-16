import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { uploadToS3, generateS3Key, generateThumbnailKey, isS3Configured } from '@/lib/s3'
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
    const { searchParams } = new URL(request.url)
    let userId = searchParams.get('userId')
    const projectId = searchParams.get('projectId') // Novo parâmetro para filtrar por projeto
    
    // Se não foi fornecido userId, usar o primeiro usuário disponível
    if (!userId) {
      const firstUser = await prisma.user.findFirst({
        select: { id: true }
      })
      
      if (!firstUser) {
        return NextResponse.json({ 
          success: false, 
          error: 'Nenhum usuário encontrado no sistema' 
        }, { status: 404 })
      }
      
      userId = firstUser.id
    }

    // Verificar se o usuário existe
    const userExists = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true }
    })

    if (!userExists) {
      return NextResponse.json({ 
        success: false, 
        error: 'Usuário não encontrado' 
      }, { status: 404 })
    }

    // Construir filtros para a busca
    const whereClause: { userId: string; projectId?: string } = {
      userId: userId
    }

    // Se projectId foi fornecido, filtrar por projeto específico
    if (projectId) {
      whereClause.projectId = projectId
    }

    const photos = await prisma.photo.findMany({
      where: whereClause,
      orderBy: {
        uploadedAt: 'desc'
      }
    })

    // Transformar para o formato esperado pelo frontend
    const formattedPhotos = photos.map(photo => ({
      id: photo.id,
      name: photo.filename,
      url: photo.originalUrl,
      width: photo.width,
      height: photo.height,
      fileSize: photo.fileSize,
      uploadedAt: photo.uploadedAt.toISOString(),
      projectId: photo.projectId // Incluir projectId na resposta
    }))

    return NextResponse.json({ 
      success: true, 
      data: formattedPhotos 
    })
  } catch (error) {
    console.error('Erro ao buscar fotos:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Erro interno do servidor' 
    }, { status: 500 })
  }
}

// POST - Upload de novas fotos
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const files = formData.getAll('files') as File[]
    let userId = formData.get('userId') as string
    const projectId = formData.get('projectId') as string // Novo parâmetro para associar ao projeto
    
    // Se não foi fornecido userId, usar o primeiro usuário disponível
    if (!userId) {
      const firstUser = await prisma.user.findFirst({
        select: { id: true }
      })
      
      if (!firstUser) {
        return NextResponse.json({ 
          success: false, 
          error: 'Nenhum usuário encontrado no sistema' 
        }, { status: 404 })
      }
      
      userId = firstUser.id
    }

    // Verificar se o usuário existe
    const userExists = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true }
    })

    if (!userExists) {
      return NextResponse.json({ 
        success: false, 
        error: 'Usuário não encontrado' 
      }, { status: 404 })
    }

    // Se projectId foi fornecido, verificar se o projeto existe e pertence ao usuário
    if (projectId) {
      const projectExists = await prisma.project.findFirst({
        where: { 
          id: projectId,
          userId: userId 
        },
        select: { id: true }
      })

      if (!projectExists) {
        return NextResponse.json({ 
          success: false, 
          error: 'Projeto não encontrado ou não pertence ao usuário' 
        }, { status: 404 })
      }
    }

    if (!files || files.length === 0) {
      return NextResponse.json({ 
        success: false, 
        error: 'Nenhum arquivo enviado' 
      }, { status: 400 })
    }

    const uploadedPhotos = []
    const errors = []

    for (const file of files) {
      try {
        console.log(`🔍 Processando arquivo: ${file.name}, tipo: ${file.type}, tamanho: ${file.size}`)
        
        // Validar tipo de arquivo
        if (!isValidImageFormat(file.type)) {
          console.log(`❌ Formato não suportado: ${file.type}`)
          errors.push(`${file.name}: Formato não suportado`)
          continue
        }

        // Validar tamanho do arquivo
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
        console.log(`🔍 Obtendo metadados da imagem...`)
        const originalMetadata = await getImageMetadata(buffer)
        console.log(`✅ Metadados obtidos:`, originalMetadata)
        
        // Sanitizar nome do arquivo
        const sanitizedFileName = sanitizeFileName(file.name)
        console.log(`✅ Nome sanitizado: ${sanitizedFileName}`)

        let originalUrl: string
        let thumbnailUrl: string

        if (isS3Configured()) {
          console.log(`🌐 S3 configurado, fazendo upload para S3...`)
          // **MODO PRODUÇÃO: Upload para S3**
          
          // Processar imagem original (otimizar)
          console.log(`🔄 Processando imagem original...`)
          const processedImage = await processImage(buffer, {
            format: 'jpeg',
            quality: 85
          })
          console.log(`✅ Imagem processada: ${processedImage.buffer.length} bytes`)
          
          // Criar thumbnail
          console.log(`🔄 Criando thumbnail...`)
          const thumbnail = await createThumbnail(buffer)
          console.log(`✅ Thumbnail criado: ${thumbnail.buffer.length} bytes`)
          
          // Gerar chaves únicas para S3
          const originalKey = generateS3Key(userId, sanitizedFileName, projectId)
          const thumbnailKey = generateThumbnailKey(originalKey)
          console.log(`🔑 Chaves S3: original=${originalKey}, thumbnail=${thumbnailKey}`)
          
          // Upload para S3
          console.log(`📤 Fazendo upload da imagem original...`)
          originalUrl = await uploadToS3(
            processedImage.buffer,
            originalKey,
            processedImage.contentType
          )
          console.log(`✅ Upload original concluído: ${originalUrl}`)
          
          console.log(`📤 Fazendo upload do thumbnail...`)
          thumbnailUrl = await uploadToS3(
            thumbnail.buffer,
            thumbnailKey,
            thumbnail.contentType
          )
          console.log(`✅ Upload thumbnail concluído: ${thumbnailUrl}`)
          
          console.log(`✅ Upload S3 realizado: ${originalKey}`)
          
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
        }

        console.log(`💾 Salvando no banco de dados...`)
        // Salvar no banco de dados
        const photo = await prisma.photo.create({
          data: {
            userId: userId,
            projectId: projectId || null, // Associar ao projeto se fornecido
            filename: sanitizedFileName,
            originalUrl: originalUrl,
            thumbnailUrl: thumbnailUrl,
            fileSize: originalMetadata.size,
            width: originalMetadata.width,
            height: originalMetadata.height,
            mimeType: file.type,
            s3Key: isS3Configured() ? generateS3Key(userId, sanitizedFileName, projectId) : null,
          }
        })
        console.log(`✅ Foto salva no banco com ID: ${photo.id}`)

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
        console.error(`Erro ao processar ${file.name}:`, fileError)
        errors.push(`${file.name}: Erro no processamento`)
      }
    }

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
    console.error('Erro ao fazer upload das fotos:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Erro interno do servidor' 
    }, { status: 500 })
  }
}