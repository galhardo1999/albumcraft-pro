// Worker para processar fila de álbuns
// Este arquivo compila e executa o worker TypeScript

const { spawn } = require('child_process');
const path = require('path');

console.log('🚀 Iniciando worker de processamento de álbuns...');

// Executar o worker TypeScript
const worker = spawn('npx', ['ts-node', 'src/lib/worker.ts'], {
  cwd: __dirname,
  stdio: 'inherit'
});

worker.on('error', (error) => {
  console.error('❌ Erro ao iniciar worker:', error);
  process.exit(1);
});

worker.on('exit', (code) => {
  console.log(`🔄 Worker finalizado com código: ${code}`);
  if (code !== 0) {
    console.log('🔄 Reiniciando worker em 5 segundos...');
    setTimeout(() => {
      // Reiniciar o processo
      const newWorker = spawn('node', ['worker.js'], {
        cwd: __dirname,
        stdio: 'inherit'
      });
    }, 5000);
  }
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Parando worker...');
  worker.kill('SIGINT');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Parando worker...');
  worker.kill('SIGTERM');
  process.exit(0);
});