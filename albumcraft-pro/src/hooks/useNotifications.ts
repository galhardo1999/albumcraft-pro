import { useEffect, useState, useCallback, useRef } from 'react'

export interface NotificationData {
  type: 'album_progress' | 'album_completed' | 'album_failed' | 'queue_status' | 'connected'
  sessionId: string
  data: Record<string, unknown>
  timestamp: number
  message?: string
}

export interface QueueStats {
  waiting: number
  active: number
  completed: number
  failed: number
}

export interface UseNotificationsReturn {
  notifications: NotificationData[]
  queueStats: QueueStats | null
  isConnected: boolean
  connectionError: string | null
  clearNotifications: () => void
  reconnect: () => void
}

export const useNotifications = (sessionId: string): UseNotificationsReturn => {
  const [notifications, setNotifications] = useState<NotificationData[]>([])
  const [queueStats, setQueueStats] = useState<QueueStats | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [connectionError, setConnectionError] = useState<string | null>(null)
  
  const eventSourceRef = useRef<EventSource | null>(null)
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const reconnectAttempts = useRef(0)
  const maxReconnectAttempts = 5

  const connect = useCallback(() => {
    if (!sessionId) return

    try {
      // Fechar conexão existente
      if (eventSourceRef.current) {
        eventSourceRef.current.close()
      }

      console.log(`🔌 Connecting to SSE for session: ${sessionId}`)
      
      const eventSource = new EventSource(`/api/notifications?sessionId=${sessionId}`)
      eventSourceRef.current = eventSource

      eventSource.onopen = () => {
        console.log('✅ SSE connection opened')
        setIsConnected(true)
        setConnectionError(null)
        reconnectAttempts.current = 0
      }

      eventSource.onmessage = (event) => {
        try {
          const notification: NotificationData = JSON.parse(event.data)
          
          console.log('📨 Received notification:', notification.type)
          
          // Atualizar notificações
          setNotifications(prev => {
            // Manter apenas as últimas 100 notificações
            const updated = [...prev, notification].slice(-100)
            return updated
          })

          // Atualizar estatísticas da fila
          if (notification.type === 'queue_status') {
            setQueueStats(notification.data as unknown as QueueStats)
          }

        } catch (error) {
          console.error('Error parsing notification:', error)
        }
      }

      eventSource.onerror = (error) => {
        console.error('❌ SSE connection error:', error)
        setIsConnected(false)
        setConnectionError('Erro de conexão com o servidor')
        
        // Tentar reconectar automaticamente
        if (reconnectAttempts.current < maxReconnectAttempts) {
          const delay = Math.min(1000 * Math.pow(2, reconnectAttempts.current), 30000) // Exponential backoff
          
          reconnectTimeoutRef.current = setTimeout(() => {
            reconnectAttempts.current++
            console.log(`🔄 Reconnecting... Attempt ${reconnectAttempts.current}/${maxReconnectAttempts}`)
            connect()
          }, delay)
        } else {
          setConnectionError('Falha ao conectar após múltiplas tentativas')
        }
      }

    } catch (error) {
      console.error('Failed to create SSE connection:', error)
      setConnectionError('Falha ao criar conexão')
    }
  }, [sessionId])

  const disconnect = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close()
      eventSourceRef.current = null
    }
    
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current)
      reconnectTimeoutRef.current = null
    }
    
    setIsConnected(false)
  }, [])

  const reconnect = useCallback(() => {
    disconnect()
    reconnectAttempts.current = 0
    setConnectionError(null)
    connect()
  }, [connect, disconnect])

  const clearNotifications = useCallback(async () => {
    try {
      await fetch('/api/notifications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'clear_notifications',
          sessionId
        })
      })
      
      setNotifications([])
    } catch (error) {
      console.error('Failed to clear notifications:', error)
    }
  }, [sessionId])

  // Conectar quando o hook for montado
  useEffect(() => {
    connect()
    
    // Cleanup na desmontagem
    return () => {
      disconnect()
    }
  }, [connect, disconnect])

  // Cleanup dos timeouts
  useEffect(() => {
    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current)
      }
    }
  }, [])

  return {
    notifications,
    queueStats,
    isConnected,
    connectionError,
    clearNotifications,
    reconnect
  }
}

// Hook para filtrar notificações por tipo
export const useNotificationsByType = (
  sessionId: string,
  type: NotificationData['type']
) => {
  const { notifications, ...rest } = useNotifications(sessionId)
  
  const filteredNotifications = notifications.filter(n => n.type === type)
  
  return {
    notifications: filteredNotifications,
    ...rest
  }
}

// Hook para obter progresso de álbuns específicos
export const useAlbumProgress = (sessionId: string) => {
  const { notifications } = useNotifications(sessionId)
  
  const albumProgress = notifications
    .filter(n => n.type === 'album_progress')
    .reduce((acc, notification) => {
      const albumName = notification.data.albumName as string
      acc[albumName] = notification.data
      return acc
    }, {} as Record<string, Record<string, unknown>>)
  
  const completedAlbums = notifications
    .filter(n => n.type === 'album_completed')
    .map(n => n.data.albumName as string)
  
  const failedAlbums = notifications
    .filter(n => n.type === 'album_failed')
    .map(n => ({ 
      name: n.data.albumName as string, 
      error: n.data.error as string 
    }))
  
  return {
    albumProgress,
    completedAlbums,
    failedAlbums
  }
}