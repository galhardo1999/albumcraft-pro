// Script de teste para verificar a configuração do S3
console.log('🔍 Testando configuração do S3...')

console.log('📋 Variáveis de ambiente:')
console.log('AWS_ACCESS_KEY_ID:', !!process.env.AWS_ACCESS_KEY_ID ? 'Definida' : 'Não definida')
console.log('AWS_SECRET_ACCESS_KEY:', !!process.env.AWS_SECRET_ACCESS_KEY ? 'Definida' : 'Não definida')
console.log('AWS_REGION:', process.env.AWS_REGION || 'Não definida')
console.log('AWS_S3_BUCKET:', process.env.AWS_S3_BUCKET || 'Não definida')

// Verificar se todas as variáveis estão definidas
const isConfigured = !!(
  process.env.AWS_ACCESS_KEY_ID &&
  process.env.AWS_SECRET_ACCESS_KEY &&
  process.env.AWS_REGION &&
  process.env.AWS_S3_BUCKET
)

console.log('\n🔧 S3 configurado:', isConfigured ? 'SIM' : 'NÃO')

if (isConfigured) {
  console.log('✅ S3 está configurado corretamente!')
} else {
  console.log('❌ S3 não está configurado corretamente!')
  console.log('💡 Verifique se o arquivo .env.local existe e contém todas as variáveis necessárias.')
}