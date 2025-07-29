// Script para testar login e download

async function testDownload() {
  try {
    console.log('🔐 Fazendo login...');
    
    // Fazer login
    const loginResponse = await fetch('http://localhost:3001/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'admin@admin.com',
        password: 'admin'
      })
    });

    if (!loginResponse.ok) {
      throw new Error(`Login falhou: ${loginResponse.status}`);
    }

    const loginData = await loginResponse.json();
    console.log('✅ Login realizado com sucesso!');
    
    // Extrair cookies
    const cookies = loginResponse.headers.get('set-cookie');
    console.log('🍪 Cookies:', cookies);

    // Testar endpoint /api/auth/me
    const meResponse = await fetch('http://localhost:3001/api/auth/me', {
      headers: {
        'Cookie': cookies
      }
    });

    if (meResponse.ok) {
      const userData = await meResponse.json();
      console.log('✅ Endpoint /api/auth/me funcionando!');
      console.log('👤 Dados do usuário:', JSON.stringify(userData, null, 2));
    } else {
      console.log('❌ Erro no /api/auth/me:', meResponse.status);
    }

    // Buscar eventos disponíveis (usando API do usuário)
    const eventsResponse = await fetch('http://localhost:3001/api/user/photo-events', {
      headers: {
        'Cookie': cookies
      }
    });

    if (!eventsResponse.ok) {
      console.error('❌ Erro ao buscar eventos:', eventsResponse.status, eventsResponse.statusText);
      return;
    }

    const eventsData = await eventsResponse.json();
    console.log('✅ Eventos encontrados:', eventsData.data?.length || 0);
    
    if (eventsData.data && eventsData.data.length > 0) {
      console.log('📅 Eventos disponíveis:');
      eventsData.data.forEach(event => {
        console.log(`   - ${event.name} (ID: ${event.id}) - ${event._count.albums} álbuns`);
      });

      // Testar download do primeiro evento
      const firstEvent = eventsData.data[0];
      console.log(`\n📥 Testando download do evento: ${firstEvent.name}`);
      
      const downloadResponse = await fetch(`http://localhost:3001/api/user/photo-events/${firstEvent.id}/download`, {
        headers: {
          'Cookie': cookies
        }
      });

      if (downloadResponse.ok) {
        console.log('✅ Download iniciado com sucesso!');
        console.log('📦 Content-Type:', downloadResponse.headers.get('content-type'));
        console.log('📦 Content-Length:', downloadResponse.headers.get('content-length'));
      } else {
        console.error('❌ Erro no download:', downloadResponse.status, downloadResponse.statusText);
        const errorText = await downloadResponse.text();
        console.error('❌ Detalhes do erro:', errorText);
      }
    } else {
      console.log('❌ Nenhum evento encontrado para testar download');
    }

  } catch (error) {
    console.error('❌ Erro:', error.message);
  }
}

testDownload();