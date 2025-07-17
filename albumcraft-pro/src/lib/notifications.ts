import { redis } from './redis'

export interface NotificationData {
  type: 'album_progress' | 'album_completed' | 'album_failed' | 'queue_status'
  sessionId: string
  data: any
  timestamp: number
}

// Classe para gerenciar notificações em tempo real
export class NotificationManager {
  private static instance: NotificationManager
  private connections: Map<string, Response> = new Map()

  static getInstance(): NotificationManager {
    if (!NotificationManager.instance) {
      NotificationManager.instance = new NotificationManager()
    }
    return NotificationManager.instance
  }

  // Adicionar conexão SSE
  addConnection(sessionId: string, response: Response): void {
    this.connections.set(sessionId, response)
    console.log(`📡 SSE connection added for session: ${sessionId}`)
    
    // Limpar conexão quando cliente desconectar
    response.signal?.addEventListener('abort', () => {
      this.removeConnection(sessionId)
    })
  }

  // Remover conexão
  removeConnection(sessionId: string): void {
    this.connections.delete(sessionId)
    console.log(`📡 SSE connection removed for session: ${sessionId}`)
  }

  // Enviar notificação para sessão específica
  async sendToSession(sessionId: string, notification: NotificationData): Promise<void> {
    const connection = this.connections.get(sessionId)
    
    if (connection) {
      try {
        const encoder = new TextEncoder()
        const data = `data: ${JSON.stringify(notification)}\n\n`
        
        await connection.body?.getWriter().write(encoder.encode(data))
        console.log(`📤 Notification sent to session ${sessionId}:`, notification.type)
      } catch (error) {
        console.error(`Failed to send notification to session ${sessionId}:`, error)
        this.removeConnection(sessionId)
      }
    }

    // Também salvar no Redis para persistência (caso o cliente reconecte)
    if (redis) {
      try {
        await redis.lpush(
          `notifications:${sessionId}`,
          JSON.stringify(notification)
        )
        // Manter apenas as últimas 50 notificações
        await redis.ltrim(`notifications:${sessionId}`, 0, 49)
        // Expirar após 1 hora
        await redis.expire(`notifications:${sessionId}`, 3600)
      } catch (error) {
        console.error('Failed to save notification to Redis:', error)
      }
    }
  }

  // Enviar para todas as conexões (broadcast)
  async broadcast(notification: Omit<NotificationData, 'sessionId'>): Promise<void> {
    const promises = Array.from(this.connections.keys()).map(sessionId =>
      this.sendToSession(sessionId, { ...notification, sessionId })
    )
    
    await Promise.allSettled(promises)
  }

  // Recuperar notificações perdidas do Redis
  async getStoredNotifications(sessionId: string): Promise<NotificationData[]> {
    if (!redis) return []

    try {
      const notifications = await redis.lrange(`notifications:${sessionId}`, 0, -1)
      return notifications.map(n => JSON.parse(n)).reverse() // Mais recentes primeiro
    } catch (error) {
      console.error('Failed to get stored notifications:', error)
      return []
    }
  }

  // Limpar notificações antigas
  async clearStoredNotifications(sessionId: string): Promise<void> {
    if (!redis) return

    try {
      await redis.del(`notifications:${sessionId}`)
    } catch (error) {
      console.error('Failed to clear stored notifications:', error)
    }
  }

  // Obter estatísticas das conexões
  getConnectionStats() {
    return {
      activeConnections: this.connections.size,
      sessions: Array.from(this.connections.keys())
    }
  }
}

// Funções utilitárias para notificações
export const notificationManager = NotificationManager.getInstance()

export const sendAlbumProgress = async (
  sessionId: string,
  albumName: string,
  progress: number,
  message: string
) => {
  await notificationManager.sendToSession(sessionId, {
    type: 'album_progress',
    sessionId,
    data: { albumName, progress, message },
    timestamp: Date.now()
  })
}

export const sendAlbumCompleted = async (
  sessionId: string,
  albumName: string,
  albumId: string
) => {
  await notificationManager.sendToSession(sessionId, {
    type: 'album_completed',
    sessionId,
    data: { albumName, albumId },
    timestamp: Date.now()
  })
}

export const sendAlbumFailed = async (
  sessionId: string,
  albumName: string,
  error: string
) => {
  await notificationManager.sendToSession(sessionId, {
    type: 'album_failed',
    sessionId,
    data: { albumName, error },
    timestamp: Date.now()
  })
}