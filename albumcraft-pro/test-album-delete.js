const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testDeleteAlbum() {
  try {
    console.log('🧪 Testando exclusão de álbum...\n');

    // Buscar um álbum para testar
    const album = await prisma.photoAlbum.findFirst({
      include: {
        photos: true,
        event: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!album) {
      console.log('❌ Nenhum álbum encontrado para testar');
      return;
    }

    console.log(`📁 Álbum encontrado para teste:`);
    console.log(`   Nome: ${album.name}`);
    console.log(`   ID: ${album.id}`);
    console.log(`   Evento: ${album.event.name} (${album.event.id})`);
    console.log(`   Fotos: ${album.photos.length}`);
    console.log('');

    // Simular a chamada da API
    console.log('🔍 Simulando busca do álbum pela API...');
    
    const foundAlbum = await prisma.photoAlbum.findUnique({
      where: { id: album.id },
      include: {
        photos: true,
        event: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!foundAlbum) {
      console.log('❌ Álbum não encontrado na busca (isso seria o problema!)');
    } else {
      console.log('✅ Álbum encontrado na busca');
      console.log(`   Nome: ${foundAlbum.name}`);
      console.log(`   Fotos: ${foundAlbum.photos.length}`);
    }

    console.log('\n🔍 Verificando se o álbum existe com uma busca simples...');
    const simpleCheck = await prisma.photoAlbum.findUnique({
      where: { id: album.id }
    });

    if (simpleCheck) {
      console.log('✅ Álbum existe na busca simples');
    } else {
      console.log('❌ Álbum não existe na busca simples');
    }

  } catch (error) {
    console.error('❌ Erro no teste:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testDeleteAlbum();