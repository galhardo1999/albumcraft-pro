import { NextRequest, NextResponse } from 'next/server'
import { getQueueStats } from '@/lib/queue'

// GET - Server-Sent Events para notificações em tempo real
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const sessionId = searchParams.get('sessionId')

  if (!sessionId) {
    return NextResponse.json({ error: 'Session ID required' }, { status: 400 })
  }

  // Configurar headers para SSE
  const headers = new Headers({
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Cache-Control',
  })

  // Criar stream para SSE
  const stream = new ReadableStream({
    start(controller) {
      // Enviar evento inicial
      const initialData = {
        type: 'connected',
        sessionId,
        timestamp: new Date().toISOString(),
        message: 'Conectado ao sistema de notificações'
      }

      controller.enqueue(`data: ${JSON.stringify(initialData)}\n\n`)

      // Enviar estatísticas da fila periodicamente
      const interval = setInterval(async () => {
        try {
          const stats = await getQueueStats()
          const statsData = {
            type: 'queue_stats',
            sessionId,
            timestamp: new Date().toISOString(),
            data: stats
          }

          controller.enqueue(`data: ${JSON.stringify(statsData)}\n\n`)
        } catch (error) {
          console.error('❌ Error sending queue stats:', error)
        }
      }, 5000) // A cada 5 segundos

      // Cleanup quando a conexão for fechada
      request.signal.addEventListener('abort', () => {
        clearInterval(interval)
        controller.close()
      })

      // Enviar heartbeat para manter conexão viva
      const heartbeat = setInterval(() => {
        try {
          controller.enqueue(`data: ${JSON.stringify({ type: 'heartbeat', timestamp: new Date().toISOString() })}\n\n`)
        } catch (error) {
          clearInterval(heartbeat)
          clearInterval(interval)
        }
      }, 30000) // A cada 30 segundos
    },
  })

  return new NextResponse(stream, { headers })
}

// POST - Enviar notificação manual
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { sessionId, type, message, data } = body

    if (!sessionId || !type || !message) {
      return NextResponse.json(
        { error: 'sessionId, type e message são obrigatórios' },
        { status: 400 }
      )
    }

    // Notificação manual registrada no log
    // Por enquanto, apenas log
    console.log('📢 Notification sent:', {
      sessionId,
      type,
      message,
      data,
      timestamp: new Date().toISOString()
    })

    return NextResponse.json({
      success: true,
      message: 'Notificação enviada com sucesso'
    })

  } catch (error) {
    console.error('❌ Error sending notification:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}