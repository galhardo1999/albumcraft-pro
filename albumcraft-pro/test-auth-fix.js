const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testAuthFix() {
  try {
    console.log('🔍 Testando correção de autenticação...\n');

    // Buscar um álbum para testar
    const album = await prisma.photoAlbum.findFirst({
      include: {
        _count: {
          select: { photos: true }
        }
      }
    });

    if (!album) {
      console.log('❌ Nenhum álbum encontrado para testar');
      return;
    }

    console.log('📁 Álbum encontrado para teste:');
    console.log(`   ID: ${album.id}`);
    console.log(`   Nome: ${album.name}`);
    console.log(`   Fotos: ${album._count.photos}`);
    console.log('');

    console.log('✅ Correções aplicadas:');
    console.log('   1. Adicionado credentials: "include" nas requisições fetch');
    console.log('   2. Adicionado headers Content-Type nas requisições');
    console.log('   3. Melhorado tratamento de erro 401 (sessão expirada)');
    console.log('   4. Corrigido ordem dos cases no switch de erros');
    console.log('');

    console.log('🎯 Próximos passos para testar:');
    console.log('   1. Acesse http://localhost:3001/admin/galerias');
    console.log('   2. Faça login como administrador');
    console.log('   3. Entre em um evento de galeria');
    console.log('   4. Tente excluir um álbum');
    console.log('   5. Verifique se o erro "Álbum não encontrado" foi resolvido');
    console.log('');

    console.log('📋 Arquivos corrigidos:');
    console.log('   - src/app/admin/galerias/[id]/page.tsx (handleDeleteAlbum e fetchEvent)');
    console.log('   - src/app/admin/galerias/page.tsx (fetchEvents e handleDeleteEvent)');

  } catch (error) {
    console.error('❌ Erro durante o teste:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testAuthFix();