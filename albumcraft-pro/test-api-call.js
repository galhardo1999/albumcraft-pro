const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testApiCall() {
  try {
    console.log('🧪 Testando chamada da API de exclusão...\n');

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

    console.log(`📁 Álbum para teste:`);
    console.log(`   Nome: ${album.name}`);
    console.log(`   ID: ${album.id}`);
    console.log(`   Evento: ${album.event.name}`);
    console.log(`   Fotos: ${album.photos.length}`);
    console.log('');

    // Simular a chamada HTTP para a API
    console.log('🌐 Fazendo chamada HTTP para a API...');
    
    try {
      const response = await fetch(`http://localhost:3001/api/admin/photo-albums/${album.id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          // Vamos tentar sem autenticação primeiro para ver o erro
        },
      });

      console.log(`📊 Status da resposta: ${response.status}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        console.log('❌ Erro na API:', errorData);
      } else {
        const successData = await response.json();
        console.log('✅ Sucesso na API:', successData);
      }
    } catch (fetchError) {
      console.error('❌ Erro na chamada HTTP:', fetchError);
    }

  } catch (error) {
    console.error('❌ Erro no teste:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testApiCall();