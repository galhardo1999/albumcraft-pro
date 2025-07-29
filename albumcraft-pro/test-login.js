// Script para fazer login e testar a funcionalidade
async function loginAndTest() {
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
    
    const loginData = await loginResponse.json();
    
    if (!loginData.success) {
      console.error('❌ Erro no login:', loginData.error);
      return;
    }
    
    console.log('✅ Login realizado com sucesso!');
    console.log('👤 Usuário:', loginData.data.user.name);
    console.log('🔑 Admin:', loginData.data.user.isAdmin);
    
    // Testar endpoint /api/auth/me com o token
    const token = loginData.data.token;
    
    const meResponse = await fetch('http://localhost:3001/api/auth/me', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    const meData = await meResponse.json();
    
    if (meData.success) {
      console.log('✅ Endpoint /api/auth/me funcionando!');
      console.log('👤 Dados do usuário:', meData.data.user);
    } else {
      console.error('❌ Erro no /api/auth/me:', meData.error);
    }
    
    // Testar endpoint de usuários admin
    const usersResponse = await fetch('http://localhost:3001/api/admin/users', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    const usersData = await usersResponse.json();
    
    if (usersData.success) {
      console.log('✅ Endpoint /api/admin/users funcionando!');
      console.log('👥 Número de usuários:', usersData.data.users.length);
    } else {
      console.error('❌ Erro no /api/admin/users:', usersData.error);
    }
    
  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

// Executar o teste
loginAndTest();