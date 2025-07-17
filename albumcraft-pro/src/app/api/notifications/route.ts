import { NextRequest } from 'next/server'
import { notificationManager } from '@/lib/notifications'
import { getQueueStats } from '@/lib/queue'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const sessionId = searchParams.get('sessionId')

  if (!sessionId) {
    return new Response('Session ID required', { status: 400 })
  }

  // Configurar headers para Server-Sent Events
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
      // Função para enviar dados
      const send = (data: string) => {
        controller.enqueue(new TextEncoder().encode(data))
      }

      // Enviar evento inicial de conexão
      send(`data: ${JSON.stringify({
        type: 'connected',
        sessionId,
        timestamp: Date.now(),
        message: 'Conectado ao sistema de notificações'
      })}\n\n`)


      // Enviar notificações armazenadas (se houver)
      notificationManager.getStoredNotifications(sessionId).then(notifications => {
        notifications.forEach(notification => {
          send(`data: ${JSON.stringify(notification)}\n\n`)
        })
      })

      // Enviar status da fila periodicamente
      const statusInterval = setInterval(async () => {
        try {
          const stats = await getQueueStats()
          if (stats) {
            send(`data: ${JSON.stringify({
              type: 'queue_status',
              sessionId,
              data: stats,
              timestamp: Date.now()
            })}\n\n`)
          }
        } catch (error) {
          console.error('Error sending queue status:', error)
        }
      }, 10000) // A cada 10 segundos

      // Cleanup quando conexão for fechada
      request.signal?.addEventListener('abort', () => {
        clearInterval(statusInterval)
        notificationManager.removeConnection(sessionId)
        controller.close()
      })
    },

    cancel() {
      notificationManager.removeConnection(sessionId)
    }
  })

  return new Response(stream, { headers })
}

// Endpoint para obter estatísticas
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, sessionId } = body

    switch (action) {
      case 'get_stats':
        const queueStats = await getQueueStats()
        const connectionStats = notificationManager.getConnectionStats()
        
        return Response.json({
          queue: queueStats,
          connections: connectionStats
        })

      case 'clear_notifications':
        if (sessionId) {
          await notificationManager.clearStoredNotifications(sessionId)
          return Response.json({ success: true })
        }
        return Response.json({ error: 'Session ID required' }, { status: 400 })

      default:
        return Response.json({ error: 'Invalid action' }, { status: 400 })
    }
  } catch (error) {
    console.error('SSE API error:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}