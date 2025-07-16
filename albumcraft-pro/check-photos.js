const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function checkPhotos() {
  try {
    console.log('🔍 Verificando fotos no banco de dados...')
    
    const photos = await prisma.photo.findMany({
      orderBy: { uploadedAt: 'desc' },
      take: 10
    })
    
    console.log(`📊 Total de fotos encontradas: ${photos.length}`)
    
    if (photos.length > 0) {
      console.log('📸 Últimas fotos:')
      photos.forEach((photo, index) => {
        console.log(`  ${index + 1}. ID: ${photo.id}`)
        console.log(`     Arquivo: ${photo.filename}`)
        console.log(`     Usuário: ${photo.userId}`)
        console.log(`     Tamanho: ${photo.fileSize} bytes`)
        console.log(`     Dimensões: ${photo.width}x${photo.height}`)
        console.log(`     Upload: ${photo.uploadedAt}`)
        console.log(`     S3 Key: ${photo.s3Key || 'N/A'}`)
        console.log('     ---')
      })
    } else {
      console.log('❌ Nenhuma foto encontrada no banco de dados')
      
      // Verificar se existem usuários
      const users = await prisma.user.findMany({
        select: { id: true, email: true }
      })
      console.log(`👥 Usuários disponíveis: ${users.length}`)
      users.forEach(user => {
        console.log(`  - ID: ${user.id}, Email: ${user.email}`)
      })
    }
    
  } catch (error) {
    console.error('❌ Erro ao verificar fotos:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkPhotos()