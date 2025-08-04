import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/auth-middleware'
import { getQueueStats, getQueueStatsBySession } from '@/lib/queue'

export const GET = withAuth(async (request: NextRequest, user) => {
  try {
    const { searchParams } = new URL(request.url)
    const sessionId = searchParams.get('sessionId')
    
    if (sessionId) {
      // Obter estatísticas por sessionId
      const stats = await getQueueStatsBySession(sessionId)
      
      return NextResponse.json({
        success: true,
        stats,
        sessionId,
        isProcessingComplete: stats.waiting === 0 && stats.active === 0,
        progress: stats.totalJobs > 0 ? Math.round((stats.completed / stats.totalJobs) * 100) : 0
      })
    } else {
      // Obter estatísticas gerais
      const stats = await getQueueStats()
      
      return NextResponse.json({
        success: true,
        stats,
        isProcessingComplete: stats.waiting === 0 && stats.active === 0
      })
    }
  } catch (error) {
    console.error('Erro ao obter status da fila:', error)
    
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
})