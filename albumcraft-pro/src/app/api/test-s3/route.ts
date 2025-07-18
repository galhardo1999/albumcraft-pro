import { NextRequest, NextResponse } from 'next/server'
import { isS3Configured } from '@/lib/s3'

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Testando configuração do S3 via API...')
    
    const envVars = {
      AWS_ACCESS_KEY_ID: !!process.env.AWS_ACCESS_KEY_ID,
      AWS_SECRET_ACCESS_KEY: !!process.env.AWS_SECRET_ACCESS_KEY,
      AWS_REGION: process.env.AWS_REGION || 'Não definida',
      AWS_S3_BUCKET: process.env.AWS_S3_BUCKET || 'Não definida'
    }
    
    const s3Configured = isS3Configured()
    
    console.log('📋 Variáveis de ambiente:', envVars)
    console.log('🔧 S3 configurado:', s3Configured)
    
    return NextResponse.json({
      success: true,
      data: {
        s3Configured,
        envVars,
        message: s3Configured ? 'S3 está configurado corretamente!' : 'S3 não está configurado!'
      }
    })
    
  } catch (error) {
    console.error('❌ Erro ao testar S3:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    }, { status: 500 })
  }
}