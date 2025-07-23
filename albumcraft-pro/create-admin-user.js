const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function createAdminUser() {
  try {
    // Verificar se o usuário admin já existe
    const existingAdmin = await prisma.user.findUnique({
      where: { email: 'admin@admin.com' }
    });

    if (existingAdmin) {
      console.log('✅ Usuário admin já existe');
      return;
    }

    // Hash da senha
    const hashedPassword = await bcrypt.hash('admin', 10);

    // Criar usuário admin
    const admin = await prisma.user.create({
      data: {
        email: 'admin@admin.com',
        passwordHash: hashedPassword,
        name: 'Administrador',
        plan: 'ENTERPRISE', // Dar plano premium para o admin
        isAdmin: true // Vamos adicionar este campo ao schema
      }
    });

    console.log('✅ Usuário administrador criado com sucesso!');
    console.log('📧 Email: admin@admin.com');
    console.log('🔑 Senha: admin');
    
  } catch (error) {
    console.error('❌ Erro ao criar usuário admin:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createAdminUser();