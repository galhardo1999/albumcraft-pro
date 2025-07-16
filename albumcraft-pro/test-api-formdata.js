const FormData = require('form-data')
const { default: fetch } = require('node-fetch')

async function testPhotoAPICorrect() {
  try {
    console.log('🧪 Testando POST /api/photos com FormData vazio...')
    
    // Testar POST com FormData vazio (como o frontend faria)
    const formData = new FormData()
    // Não adicionar nenhum arquivo para simular o erro
    
    const postResponse = await fetch('https://albumcraft-pro.vercel.app/api/photos', {
      method: 'POST',
      body: formData
    })
    
    console.log('📊 Status POST:', postResponse.status)
    const postResult = await postResponse.json()
    console.log('✅ Resposta POST:', JSON.stringify(postResult, null, 2))
    
    console.log('\n🧪 Testando POST /api/photos com arquivo...')
    
    // Testar POST com arquivo real
    const sharp = require('sharp')
    const fs = require('fs')
    
    // Criar uma imagem real
    const testImage = await sharp({
      create: {
        width: 100,
        height: 100,
        channels: 3,
        background: { r: 0, g: 255, b: 0 } // verde
      }
    })
    .jpeg({ quality: 90 })
    .toBuffer()
    
    // Salvar temporariamente
    fs.writeFileSync('/tmp/test-upload.jpg', testImage)
    
    // Criar FormData com arquivo
    const formDataWithFile = new FormData()
    formDataWithFile.append('files', fs.createReadStream('/tmp/test-upload.jpg'), {
      filename: 'test-upload.jpg',
      contentType: 'image/jpeg'
    })
    
    const uploadResponse = await fetch('https://albumcraft-pro.vercel.app/api/photos', {
      method: 'POST',
      body: formDataWithFile
    })
    
    console.log('📊 Status Upload:', uploadResponse.status)
    const uploadResult = await uploadResponse.json()
    console.log('✅ Resposta Upload:', JSON.stringify(uploadResult, null, 2))
    
    // Limpar arquivo temporário
    fs.unlinkSync('/tmp/test-upload.jpg')
    
  } catch (error) {
    console.error('❌ Erro no teste:', error)
  }
}

testPhotoAPICorrect()