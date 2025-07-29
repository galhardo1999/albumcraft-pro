// Script para criar evento de teste com álbuns e fotos
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function createTestEvent() {
  try {
    console.log('🔍 Verificando usuário admin...');
    
    // Buscar usuário admin
    const adminUser = await prisma.user.findFirst({
      where: { email: 'admin@admin.com' }
    });

    if (!adminUser) {
      console.error('❌ Usuário admin não encontrado');
      return;
    }

    console.log('✅ Usuário admin encontrado:', adminUser.name);

    // Verificar se já existe um evento de teste
    const existingEvent = await prisma.photoEvent.findFirst({
      where: { name: 'Evento de Teste' }
    });

    if (existingEvent) {
      console.log('✅ Evento de teste já existe:', existingEvent.id);
      return;
    }

    console.log('📅 Criando evento de teste...');

    // Criar evento de teste
    const testEvent = await prisma.photoEvent.create({
      data: {
        name: 'Evento de Teste',
        description: 'Evento criado para testar a funcionalidade de download',
        users: {
          connect: { id: adminUser.id }
        }
      }
    });

    console.log('✅ Evento criado:', testEvent.id);

    // Criar álbuns de teste
    console.log('📁 Criando álbuns de teste...');

    const album1 = await prisma.photoAlbum.create({
      data: {
        name: 'Álbum 1 - Paisagens',
        description: 'Fotos de paisagens',
        eventId: testEvent.id
      }
    });

    const album2 = await prisma.photoAlbum.create({
      data: {
        name: 'Álbum 2 - Retratos',
        description: 'Fotos de retratos',
        eventId: testEvent.id
      }
    });

    console.log('✅ Álbuns criados:', album1.id, album2.id);

    // Criar fotos de teste (URLs de exemplo)
    console.log('📸 Criando fotos de teste...');

    const testPhotos = [
      // Álbum 1 - Paisagens
      {
        filename: 'paisagem1.jpg',
        url: 'https://picsum.photos/800/600?random=1',
        size: 150000,
        mimeType: 'image/jpeg',
        s3Key: 'test/paisagem1.jpg',
        albumId: album1.id
      },
      {
        filename: 'paisagem2.jpg',
        url: 'https://picsum.photos/800/600?random=2',
        size: 160000,
        mimeType: 'image/jpeg',
        s3Key: 'test/paisagem2.jpg',
        albumId: album1.id
      },
      {
        filename: 'paisagem3.jpg',
        url: 'https://picsum.photos/800/600?random=3',
        size: 140000,
        mimeType: 'image/jpeg',
        s3Key: 'test/paisagem3.jpg',
        albumId: album1.id
      },
      // Álbum 2 - Retratos
      {
        filename: 'retrato1.jpg',
        url: 'https://picsum.photos/600/800?random=4',
        size: 180000,
        mimeType: 'image/jpeg',
        s3Key: 'test/retrato1.jpg',
        albumId: album2.id
      },
      {
        filename: 'retrato2.jpg',
        url: 'https://picsum.photos/600/800?random=5',
        size: 170000,
        mimeType: 'image/jpeg',
        s3Key: 'test/retrato2.jpg',
        albumId: album2.id
      }
    ];

    for (const photo of testPhotos) {
      await prisma.photoGallery.create({
        data: photo
      });
    }

    console.log('✅ Fotos criadas:', testPhotos.length);

    // Verificar resultado final
    const finalEvent = await prisma.photoEvent.findUnique({
      where: { id: testEvent.id },
      include: {
        albums: {
          include: {
            photos: true
          }
        }
      }
    });

    console.log('🎉 Evento de teste criado com sucesso!');
    console.log('📊 Resumo:');
    console.log(`   - Evento: ${finalEvent.name}`);
    console.log(`   - Álbuns: ${finalEvent.albums.length}`);
    console.log(`   - Total de fotos: ${finalEvent.albums.reduce((total, album) => total + album.photos.length, 0)}`);

  } catch (error) {
    console.error('❌ Erro ao criar evento de teste:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createTestEvent();