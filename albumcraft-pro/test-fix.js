const sharp = require('sharp')
const FormData = require('form-data')
const { default: fetch } = require('node-fetch')

async function testFix() {
  console.log('🧪 Testando se o problema do erro 404 foi resolvido...\n')
  
  try {
    // 1. Testar GET /api/photos
    console.log('1️⃣ Testando GET /api/photos...')
    const getResponse = await fetch('https://albumcraft-pro.vercel.app/api/photos')
    console.log(`   Status: ${getResponse.status}`)
    
    if (getResponse.ok) {
      const getData = await getResponse.json()
      console.log(`   ✅ Sucesso! Fotos encontradas: ${getData.data?.length || 0}`)
    } else {
      console.log(`   ❌ Erro: ${getResponse.statusText}`)
    }
    
    console.log()
    
    // 2. Testar POST /api/photos com FormData vazio
    console.log('2️⃣ Testando POST /api/photos com FormData vazio...')
    const emptyFormData = new FormData()
    
    const emptyResponse = await fetch('https://albumcraft-pro.vercel.app/api/photos', {
      method: 'POST',
      body: emptyFormData
    })
    
    console.log(`   Status: ${emptyResponse.status}`)
    
    if (emptyResponse.status === 400) {
      const emptyData = await emptyResponse.json()
      console.log(`   ✅ Comportamento esperado: ${emptyData.error}`)
    } else {
      console.log(`   ⚠️  Status inesperado: ${emptyResponse.statusText}`)
    }
    
    console.log()
    
    // 3. Testar POST /api/photos com imagem real
    console.log('3️⃣ Testando POST /api/photos com imagem real...')
    
    // Criar uma imagem de teste
    const testImageBuffer = await sharp({
      create: {
        width: 100,
        height: 100,
        channels: 3,
        background: { r: 255, g: 0, b: 0 }
      }
    })
    .jpeg({ quality: 90 })
    .toBuffer()
    
    const formData = new FormData()
    formData.append('files', testImageBuffer, {
      filename: 'test-fix-image.jpg',
      contentType: 'image/jpeg'
    })
    
    const uploadResponse = await fetch('https://albumcraft-pro.vercel.app/api/photos', {
      method: 'POST',
      body: formData
    })
    
    console.log(`   Status: ${uploadResponse.status}`)
    
    if (uploadResponse.ok) {
      const uploadData = await uploadResponse.json()
      console.log(`   ✅ Upload bem-sucedido!`)
      console.log(`   📸 Fotos enviadas: ${uploadData.photos?.length || 0}`)
      if (uploadData.photos?.[0]) {
        console.log(`   📋 Primeira foto: ${uploadData.photos[0].name} (${uploadData.photos[0].width}x${uploadData.photos[0].height})`)
      }
    } else {
      const errorData = await uploadResponse.json()
      console.log(`   ❌ Erro no upload: ${errorData.error}`)
    }
    
    console.log()
    
    // 4. Verificar se as fotos foram salvas
    console.log('4️⃣ Verificando fotos salvas após o teste...')
    const finalResponse = await fetch('https://albumcraft-pro.vercel.app/api/photos')
    
    if (finalResponse.ok) {
      const finalData = await finalResponse.json()
      console.log(`   📊 Total de fotos no sistema: ${finalData.data?.length || 0}`)
      
      if (finalData.data?.length > 0) {
        const lastPhoto = finalData.data[finalData.data.length - 1]
        console.log(`   📸 Última foto: ${lastPhoto.name} (${lastPhoto.width}x${lastPhoto.height})`)
      }
    }
    
    console.log('\n🎉 Teste concluído!')
    
  } catch (error) {
    console.error('❌ Erro durante o teste:', error.message)
  }
}

testFix()