const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function debugAlbums() {
  try {
    console.log('🔍 Verificando eventos e álbuns...\n');

    // Buscar todos os eventos
    const events = await prisma.photoEvent.findMany({
      include: {
        albums: {
          include: {
            _count: {
              select: {
                photos: true,
              },
            },
          },
        },
        _count: {
          select: {
            albums: true,
            users: true,
          },
        },
      },
    });

    console.log(`📊 Total de eventos: ${events.length}\n`);

    for (const event of events) {
      console.log(`📅 Evento: ${event.name} (ID: ${event.id})`);
      console.log(`   Descrição: ${event.description || 'Sem descrição'}`);
      console.log(`   Álbuns: ${event._count.albums}`);
      console.log(`   Usuários: ${event._count.users}`);
      console.log(`   Criado em: ${event.createdAt.toLocaleString('pt-BR')}\n`);

      if (event.albums.length > 0) {
        console.log(`   📁 Álbuns do evento:`);
        for (const album of event.albums) {
          console.log(`      - ${album.name} (ID: ${album.id})`);
          console.log(`        Descrição: ${album.description || 'Sem descrição'}`);
          console.log(`        Fotos: ${album._count.photos}`);
          console.log(`        Criado em: ${album.createdAt.toLocaleString('pt-BR')}`);
        }
        console.log('');
      } else {
        console.log(`   ⚠️ Nenhum álbum encontrado para este evento\n`);
      }
    }

    // Verificar total de álbuns
    const totalAlbums = await prisma.photoAlbum.count();
    console.log(`📊 Total de álbuns no sistema: ${totalAlbums}\n`);

    // Verificar total de fotos
    const totalPhotos = await prisma.photoGallery.count();
    console.log(`📸 Total de fotos no sistema: ${totalPhotos}\n`);

  } catch (error) {
    console.error('❌ Erro ao verificar álbuns:', error);
  } finally {
    await prisma.$disconnect();
  }
}

debugAlbums();