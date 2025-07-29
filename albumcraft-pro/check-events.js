// Script para verificar eventos no banco de dados
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkEvents() {
  try {
    console.log('🔍 Verificando eventos no banco...');
    
    // Buscar todos os eventos
    const allEvents = await prisma.photoEvent.findMany({
      include: {
        users: true,
        albums: {
          include: {
            photos: true
          }
        }
      }
    });

    console.log('📊 Total de eventos:', allEvents.length);

    for (const event of allEvents) {
      console.log(`\n📅 Evento: ${event.name} (ID: ${event.id})`);
      console.log(`   Descrição: ${event.description || 'N/A'}`);
      console.log(`   Usuários: ${event.users.length}`);
      console.log(`   Álbuns: ${event.albums.length}`);
      
      event.users.forEach(user => {
        console.log(`   👤 Usuário: ${user.name} (${user.email})`);
      });

      event.albums.forEach(album => {
        console.log(`   📁 Álbum: ${album.name} - ${album.photos.length} fotos`);
      });
    }

    // Verificar usuário admin
    console.log('\n🔍 Verificando usuário admin...');
    const adminUser = await prisma.user.findFirst({
      where: { email: 'admin@admin.com' },
      include: {
        photoEvents: {
          include: {
            albums: {
              include: {
                photos: true
              }
            }
          }
        }
      }
    });

    if (adminUser) {
      console.log(`✅ Admin encontrado: ${adminUser.name}`);
      console.log(`📅 Eventos do admin: ${adminUser.photoEvents.length}`);
      
      adminUser.photoEvents.forEach(event => {
        console.log(`   📅 ${event.name} - ${event.albums.length} álbuns`);
      });
    } else {
      console.log('❌ Admin não encontrado');
    }

  } catch (error) {
    console.error('❌ Erro:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkEvents();