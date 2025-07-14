import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

async function createTestUser() {
  const prisma = new PrismaClient();
  
  try {
    console.log('👤 Criando usuário de teste...');
    
    // Hash da senha
    const hashedPassword = await bcrypt.hash('123456', 12);
    
    // Criar usuário de teste
    const user = await prisma.user.create({
      data: {
        email: 'test@albumcraft.com',
        firstName: 'Usuário',
        lastName: 'Teste',
        name: 'Usuário Teste',
        password: hashedPassword,
        plan: 'FREE'
      }
    });
    
    console.log('✅ Usuário de teste criado com sucesso!');
    console.log(`📧 Email: ${user.email}`);
    console.log(`🔑 Senha: 123456`);
    console.log(`👤 Nome: ${user.name}`);
    console.log(`📋 Plano: ${user.plan}`);
    
  } catch (error) {
    if (error.code === 'P2002') {
      console.log('ℹ️  Usuário de teste já existe!');
      
      // Buscar o usuário existente
      const existingUser = await prisma.user.findUnique({
        where: { email: 'test@albumcraft.com' }
      });
      
      if (existingUser) {
        console.log(`📧 Email: ${existingUser.email}`);
        console.log(`🔑 Senha: 123456`);
        console.log(`👤 Nome: ${existingUser.name}`);
      }
    } else {
      console.error('❌ Erro ao criar usuário:', error.message);
    }
  } finally {
    await prisma.$disconnect();
  }
}

createTestUser();