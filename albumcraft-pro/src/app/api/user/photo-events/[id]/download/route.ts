import { NextRequest, NextResponse } from 'next/server'
import { authenticateRequest } from '@/lib/auth-middleware'
import { prisma } from '@/lib/prisma'
import JSZip from 'jszip'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    console.log('Iniciando download de fotos...')
    
    // Verificar autenticação
    const user = await authenticateRequest(request)
    if (!user) {
      console.log('Usuário não autenticado')
      return NextResponse.json({ error: 'Token não fornecido' }, { status: 401 })
    }

    const { id: eventId } = await params
    console.log('Event ID:', eventId)
    console.log('User ID:', user.userId)

    // Verificar se o usuário tem acesso ao evento
    const photoEvent = await prisma.photoEvent.findFirst({
      where: {
        id: eventId,
        users: {
          some: {
            id: user.userId
          }
        }
      },
      include: {
        albums: {
          include: {
            photos: {
              select: {
                id: true,
                filename: true,
                url: true
              }
            }
          }
        }
      }
    })

    if (!photoEvent) {
      console.log('Evento não encontrado ou acesso negado')
      return NextResponse.json({ error: 'Evento não encontrado ou acesso negado' }, { status: 404 })
    }

    console.log('Evento encontrado:', photoEvent.name)
    console.log('Número de álbuns:', photoEvent.albums.length)

    // Verificar se há fotos para download
    const totalPhotos = photoEvent.albums.reduce((total, album) => total + album.photos.length, 0)
    console.log('Total de fotos:', totalPhotos)
    
    if (totalPhotos === 0) {
      return NextResponse.json({ error: 'Nenhuma foto disponível para download' }, { status: 400 })
    }

    // Criar ZIP
    console.log('Criando ZIP...')
    const zip = new JSZip()

    // Função para baixar imagem e adicionar ao ZIP
    type EventPhoto = { id: string; filename: string; url: string }
    const addPhotoToZip = async (photo: EventPhoto, albumName: string) => {
      try {
        const response = await fetch(photo.url)
        if (!response.ok) {
          console.warn(`Erro ao baixar foto ${photo.filename}: ${response.statusText}`)
          return
        }
        
        const arrayBuffer = await response.arrayBuffer()
        const folderName = albumName.replace(/[<>:"/\\|?*]/g, '_') // Sanitizar nome da pasta
        const fileName = photo.filename.replace(/[<>:"/\\|?*]/g, '_') // Sanitizar nome do arquivo
        
        zip.folder(folderName)?.file(fileName, arrayBuffer)
      } catch (error) {
        console.warn(`Erro ao processar foto ${photo.filename}:`, error)
      }
    }

    // Adicionar todas as fotos ao ZIP organizadas por álbum
    const downloadPromises: Promise<void>[] = []
    
    for (const album of photoEvent.albums) {
      for (const photo of album.photos) {
        downloadPromises.push(addPhotoToZip(photo, album.name))
      }
    }

    // Aguardar todos os downloads
    await Promise.all(downloadPromises)

    // Gerar o arquivo ZIP
    const zipBuffer = await zip.generateAsync({ 
      type: 'arraybuffer',
      compression: 'DEFLATE',
      compressionOptions: {
        level: 6
      }
    })

    // Sanitizar nome do evento para o arquivo
    const eventName = photoEvent.name.replace(/[<>:"/\\|?*]/g, '_')
    const fileName = `${eventName}_fotos.zip`

    // Retornar o arquivo ZIP
    return new NextResponse(zipBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="${fileName}"`,
        'Content-Length': zipBuffer.byteLength.toString()
      }
    })

  } catch (error) {
    console.error('Erro ao gerar ZIP:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}