const fs = require('fs');
const path = require('path');

// Função para criar dados de teste simulando múltiplos álbuns
function createTestData() {
  // Simular 5 álbuns pequenos para teste rápido
  const albums = [];
  
  // Templates válidos conforme o schema
  const validTemplates = ['classic', 'modern', 'artistic', 'minimal'];
  
  for (let i = 1; i <= 5; i++) {
    const album = {
      albumName: `Álbum Teste ${i}`,
      template: validTemplates[i % validTemplates.length], // Usar templates válidos
      files: []
    };
    
    // Adicionar 2-3 fotos por álbum para teste rápido
    const photoCount = Math.floor(Math.random() * 2) + 2; // 2-3 fotos
    
    for (let j = 1; j <= photoCount; j++) {
      // Criar um buffer de imagem simples (1x1 pixel PNG)
      const pngBuffer = Buffer.from([
        0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, // PNG signature
        0x00, 0x00, 0x00, 0x0D, 0x49, 0x48, 0x44, 0x52, // IHDR chunk
        0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01, // 1x1 pixel
        0x08, 0x02, 0x00, 0x00, 0x00, 0x90, 0x77, 0x53, 0xDE,
        0x00, 0x00, 0x00, 0x0C, 0x49, 0x44, 0x41, 0x54, // IDAT chunk
        0x08, 0x99, 0x01, 0x01, 0x00, 0x00, 0x00, 0xFF, 0xFF,
        0x00, 0x00, 0x00, 0x02, 0x00, 0x01, 0x73, 0x75, 0x01, 0x18,
        0x00, 0x00, 0x00, 0x00, 0x49, 0x45, 0x4E, 0x44, 0xAE, 0x42, 0x60, 0x82 // IEND
      ]);
      
      album.files.push({
        name: `foto_${i}_${j}.png`,
        size: pngBuffer.length,
        type: 'image/png',
        buffer: pngBuffer.toString('base64')
      });
    }
    
    albums.push(album);
  }
  
  return {
    eventName: 'Evento Teste Atualizado',
    albums: albums,
    sessionId: `test-session-${Date.now()}`
  };
}

// Função para testar a criação de álbuns
async function testAlbumCreation() {
  console.log('🧪 === TESTE DA IMPLEMENTAÇÃO ATUALIZADA ===');
  console.log('📅 Data:', new Date().toLocaleString());
  
  try {
    const testData = createTestData();
    
    console.log(`📊 Dados de teste criados:`);
    console.log(`   - Evento: ${testData.eventName}`);
    console.log(`   - Template: ${testData.template}`);
    console.log(`   - Álbuns: ${testData.albums.length}`);
    console.log(`   - Total de fotos: ${testData.albums.reduce((total, album) => total + album.files.length, 0)}`);
    
    console.log('\n🚀 Enviando requisição para criação em lote...');
    
    const response = await fetch('http://localhost:3001/api/projects/batch', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testData)
    });
    
    console.log(`📡 Status da resposta: ${response.status}`);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Erro na requisição:', errorText);
      return;
    }
    
    const result = await response.json();
    console.log('✅ Resposta recebida:', JSON.stringify(result, null, 2));
    
    if (result.success) {
      console.log(`\n🎉 Teste iniciado com sucesso!`);
      console.log(`📋 Session ID: ${result.sessionId}`);
      console.log(`⏳ Aguarde o processamento dos álbuns...`);
      console.log(`\n💡 Dica: Monitore os logs do servidor para acompanhar o progresso.`);
      
      // Aguardar um pouco e verificar estatísticas
      setTimeout(async () => {
        try {
          const statsResponse = await fetch('http://localhost:3001/api/queue/stats');
          if (statsResponse.ok) {
            const stats = await statsResponse.json();
            console.log('\n📊 Estatísticas da fila:', JSON.stringify(stats, null, 2));
          }
        } catch (error) {
          console.log('ℹ️ Não foi possível obter estatísticas da fila');
        }
      }, 2000);
      
    } else {
      console.error('❌ Falha no teste:', result.error);
    }
    
  } catch (error) {
    console.error('❌ Erro durante o teste:', error.message);
  }
}

// Executar o teste
testAlbumCreation();