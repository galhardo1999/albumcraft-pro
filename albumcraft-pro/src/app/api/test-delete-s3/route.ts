import { NextRequest, NextResponse } from 'next/server'
import { deletePhotoVariants } from '@/lib/s3'

export async function POST(request: NextRequest) {
  try {
    const { s3Key } = await request.json()
    
    if (!s3Key) {
      return NextResponse.json({
        success: false,
        error: 'S3 key é obrigatório'
      }, { status: 400 })
    }
    
    console.log(`🧪 Testando exclusão do S3 para chave: ${s3Key}`)
    
    const result = await deletePhotoVariants(s3Key)
    
    console.log(`🧪 Resultado do teste:`, result)
    
    return NextResponse.json({
      success: true,
      data: result,
      message: `Teste de exclusão concluído. ${result.deleted.length} arquivos deletados, ${result.errors.length} erros.`
    })
    
  } catch (error) {
    console.error('❌ Erro no teste de exclusão:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    }, { status: 500 })
  }
}