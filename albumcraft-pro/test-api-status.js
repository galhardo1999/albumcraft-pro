const { default: fetch } = require('node-fetch')

async function testPhotoAPI() {
  try {
    console.log('🧪 Testando GET /api/photos...')
    
    // Testar GET
    const getResponse = await fetch('https://albumcraft-pro.vercel.app/api/photos')
    console.log('📊 Status GET:', getResponse.status)
    
    if (getResponse.status === 404) {
      console.log('❌ Erro 404 na rota GET /api/photos')
      const errorText = await getResponse.text()
      console.log('📄 Resposta:', errorText)
    } else {
      const getResult = await getResponse.json()
      console.log('✅ Resposta GET:', JSON.stringify(getResult, null, 2))
    }
    
    console.log('\n🧪 Testando POST /api/photos...')
    
    // Testar POST sem arquivos para ver se a rota existe
    const postResponse = await fetch('https://albumcraft-pro.vercel.app/api/photos', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({})
    })
    
    console.log('📊 Status POST:', postResponse.status)
    
    if (postResponse.status === 404) {
      console.log('❌ Erro 404 na rota POST /api/photos')
      const errorText = await postResponse.text()
      console.log('📄 Resposta:', errorText)
    } else {
      const postResult = await postResponse.json()
      console.log('✅ Resposta POST:', JSON.stringify(postResult, null, 2))
    }
    
  } catch (error) {
    console.error('❌ Erro no teste:', error)
  }
}

testPhotoAPI()