import { PrismaClient } from '@prisma/client';

async function testDatabase() {
  const prisma = new PrismaClient();
  
  try {
    console.log('🔍 Testando conexão com o banco de dados...');
    
    // Teste de conexão
    await prisma.$connect();
    console.log('✅ Conexão com o banco estabelecida com sucesso!');
    
    // Teste de consulta
    const userCount = await prisma.user.count();
    console.log(`📊 Total de usuários no banco: ${userCount}`);
    
    // Verificar se as tabelas do NextAuth existem
    const accountCount = await prisma.account.count();
    const sessionCount = await prisma.session.count();
    
    console.log(`🔐 Tabelas do NextAuth:`);
    console.log(`   - Accounts: ${accountCount}`);
    console.log(`   - Sessions: ${sessionCount}`);
    
    console.log('✅ Todas as verificações passaram!');
    
  } catch (error) {
    console.error('❌ Erro ao conectar com o banco:', error.message);
    
    if (error.code === 'P1001') {
      console.error('💡 Verifique se as credenciais do banco estão corretas no .env');
    } else if (error.code === 'P2021') {
      console.error('💡 A tabela não existe. Execute: npx prisma db push');
    }
  } finally {
    await prisma.$disconnect();
  }
}

testDatabase();