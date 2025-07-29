// Script para adicionar fotos aos álbuns existentes
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function addPhotosToAlbums() {
  try {
    console.log('🔍 Buscando álbuns do evento de teste...');
    
    // Buscar evento de teste
    const testEvent = await prisma.photoEvent.findFirst({
      where: { name: 'Evento de Teste' },
      include: {
        albums: true
      }
    });

    if (!testEvent) {
      console.error('❌ Evento de teste não encontrado');
      return;
    }

    console.log('✅ Evento encontrado:', testEvent.name);
    console.log('📁 Álbuns encontrados:', testEvent.albums.length);

    const album1 = testEvent.albums.find(a => a.name.includes('Paisagens'));
    const album2 = testEvent.albums.find(a => a.name.includes('Retratos'));

    if (!album1 || !album2) {
      console.error('❌ Álbuns não encontrados');
      return;
    }

    console.log('📸 Adicionando fotos...');

    // Fotos para álbum 1 (Paisagens)
    const paisagens = [
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
      }
    ];

    // Fotos para álbum 2 (Retratos)
    const retratos = [
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

    // Adicionar fotos
    for (const photo of [...paisagens, ...retratos]) {
      await prisma.photoGallery.create({
        data: photo
      });
      console.log(`✅ Foto adicionada: ${photo.filename}`);
    }

    console.log('🎉 Fotos adicionadas com sucesso!');

    // Verificar resultado
    const updatedEvent = await prisma.photoEvent.findUnique({
      where: { id: testEvent.id },
      include: {
        albums: {
          include: {
            photos: true
          }
        }
      }
    });

    console.log('\n📊 Resultado final:');
    updatedEvent.albums.forEach(album => {
      console.log(`📁 ${album.name}: ${album.photos.length} fotos`);
    });

  } catch (error) {
    console.error('❌ Erro:', error);
  } finally {
    await prisma.$disconnect();
  }
}

addPhotosToAlbums();