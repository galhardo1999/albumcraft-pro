const fs = require('fs');
const path = require('path');

// Função para fazer login e obter token
async function login() {
  console.log('🔐 Fazendo login para obter token...');
  
  try {
    const response = await fetch('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'test@example.com', // Email de teste
        password: 'password123'    // Senha de teste
      })
    });
    
    if (!response.ok) {
      console.log('❌ Login falhou, tentando criar usuário de teste...');
      return await createTestUser();
    }
    
    const result = await response.json();
    
    if (result.success && result.data.token) {
      console.log('✅ Login realizado com sucesso');
      return result.data.token;
    } else {
      console.log('❌ Login falhou:', result.error?.message);
      return await createTestUser();
    }
    
  } catch (error) {
    console.error('❌ Erro durante login:', error.message);
    return await createTestUser();
  }
}

// Função para criar usuário de teste
async function createTestUser() {
  console.log('👤 Criando usuário de teste...');
  
  try {
    const response = await fetch('http://localhost:3000/api/auth/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: 'Usuário Teste Schema',
        email: 'test@example.com',
        password: 'password123'
      })
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.log('❌ Falha ao criar usuário:', errorText);
      return null;
    }
    
    const result = await response.json();
    
    if (result.success && result.data.token) {
      console.log('✅ Usuário de teste criado com sucesso');
      return result.data.token;
    } else {
      console.log('❌ Falha ao criar usuário:', result.error?.message);
      return null;
    }
    
  } catch (error) {
    console.error('❌ Erro ao criar usuário:', error.message);
    return null;
  }
}

// Função para criar dados de teste com schema correto
function createTestData() {
  // Simular 3 álbuns pequenos para teste rápido
  const albums = [];
  
  // Templates válidos conforme o schema
  const validTemplates = ['classic', 'modern', 'artistic', 'minimal'];
  
  for (let i = 1; i <= 3; i++) {
    const album = {
      albumName: `Álbum Schema Test ${i}`,
      template: validTemplates[i % validTemplates.length], // Usar templates válidos
      files: []
    };
    
    // Adicionar 2 fotos por álbum para teste rápido
    for (let j = 1; j <= 2; j++) {
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
        name: `foto_schema_${i}_${j}.png`,
        size: pngBuffer.length,
        type: 'image/png',
        buffer: pngBuffer.toString('base64')
      });
    }
    
    albums.push(album);
  }
  
  return {
    eventName: 'Evento Teste Schema Corrigido',
    albums: albums,
    sessionId: `schema-test-session-${Date.now()}`
  };
}

// Função para testar a criação de álbuns
async function testSchemaCompliance() {
  console.log('🧪 === TESTE DE CONFORMIDADE COM SCHEMA CORRIGIDO ===');
  console.log('📅 Data:', new Date().toLocaleString());
  
  try {
    // 1. Fazer login para obter token
    const token = await login();
    
    if (!token) {
      console.error('❌ Não foi possível obter token de autenticação');
      return;
    }
    
    // 2. Criar dados de teste conforme schema
    const testData = createTestData();
    
    console.log(`\n📊 Dados de teste criados (conforme schema):`);
    console.log(`   - Evento: ${testData.eventName}`);
    console.log(`   - Session ID: ${testData.sessionId}`);
    console.log(`   - Álbuns: ${testData.albums.length}`);
    testData.albums.forEach((album, index) => {
      console.log(`     ${index + 1}. ${album.albumName} (template: ${album.template})`);
    });
    console.log(`   - Total de fotos: ${testData.albums.reduce((total, album) => total + album.files.length, 0)}`);
    
    // 3. Validar dados antes de enviar
    console.log('\n🔍 Validando dados conforme schema...');
    
    // Verificar se templates são válidos
    const validTemplates = ['classic', 'modern', 'artistic', 'minimal'];
    const invalidTemplates = testData.albums.filter(album => !validTemplates.includes(album.template));
    
    if (invalidTemplates.length > 0) {
      console.error('❌ Templates inválidos encontrados:', invalidTemplates.map(a => a.template));
      return;
    }
    
    console.log('✅ Todos os templates são válidos');
    
    // Verificar se todos os campos obrigatórios estão presentes
    const missingFields = [];
    if (!testData.eventName) missingFields.push('eventName');
    if (!testData.sessionId) missingFields.push('sessionId');
    if (!testData.albums || testData.albums.length === 0) missingFields.push('albums');
    
    testData.albums.forEach((album, index) => {
      if (!album.albumName) missingFields.push(`albums[${index}].albumName`);
      if (!album.template) missingFields.push(`albums[${index}].template`);
      if (!album.files || album.files.length === 0) missingFields.push(`albums[${index}].files`);
      
      album.files.forEach((file, fileIndex) => {
        if (!file.name) missingFields.push(`albums[${index}].files[${fileIndex}].name`);
        if (!file.type) missingFields.push(`albums[${index}].files[${fileIndex}].type`);
        if (!file.buffer) missingFields.push(`albums[${index}].files[${fileIndex}].buffer`);
        if (typeof file.size !== 'number') missingFields.push(`albums[${index}].files[${fileIndex}].size`);
      });
    });
    
    if (missingFields.length > 0) {
      console.error('❌ Campos obrigatórios ausentes:', missingFields);
      return;
    }
    
    console.log('✅ Todos os campos obrigatórios estão presentes');
    
    // 4. Enviar requisição para criação em lote
    console.log('\n🚀 Enviando requisição para criação em lote...');
    
    const response = await fetch('http://localhost:3000/api/projects/batch', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
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
      console.log(`\n🎉 Teste de schema iniciado com sucesso!`);
      console.log(`📋 Session ID: ${result.sessionId}`);
      console.log(`⏳ Aguarde o processamento dos álbuns...`);
      
      // 5. Monitorar progresso
      console.log('\n🔄 Monitorando progresso por 20 segundos...');
      let attempts = 0;
      const maxAttempts = 10; // 20 segundos
      
      const checkProgress = setInterval(async () => {
        attempts++;
        try {
          const notificationsResponse = await fetch(`http://localhost:3000/api/notifications?sessionId=${result.sessionId}`, {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
          
          if (notificationsResponse.ok) {
            const notifications = await notificationsResponse.json();
            if (notifications.length > 0) {
              const lastNotification = notifications[notifications.length - 1];
              console.log(`📢 [${new Date().toLocaleTimeString()}] ${lastNotification.message}`);
            }
          }
        } catch (error) {
          console.log('ℹ️ Erro ao verificar notificações');
        }
        
        if (attempts >= maxAttempts) {
          clearInterval(checkProgress);
          console.log('\n✅ Monitoramento finalizado.');
          console.log('💡 Verifique o dashboard para ver os álbuns criados conforme o schema Prisma.');
          
          // Verificar estatísticas finais
          try {
            const statsResponse = await fetch('http://localhost:3000/api/queue/stats', {
              headers: {
                'Authorization': `Bearer ${token}`
              }
            });
            if (statsResponse.ok) {
              const stats = await statsResponse.json();
              console.log('\n📊 Estatísticas finais da fila:', JSON.stringify(stats, null, 2));
            }
          } catch (error) {
            console.log('ℹ️ Não foi possível obter estatísticas finais');
          }
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
testSchemaCompliance();