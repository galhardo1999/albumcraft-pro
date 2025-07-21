// Interface para dados de notificação
export interface NotificationData {
  type?: string
  message: string
  timestamp?: string
  [key: string]: unknown
}

// Interface para estatísticas da fila
export interface QueueStats {
  waiting: number
  active: number
  completed: number
  failed: number
}

// Cache para conexões ativas
const activeConnections = new Map<string, WritableStreamDefaultWriter>()

// Função para enviar notificação simples
export const sendAlbumProgressSimple = async (
  sessionId: string,
  albumName: string,
  progress: number,
  message: string
) => {
  try {
    console.log(`📢 Enviando progresso: ${albumName} - ${progress}% - ${message}`)
    
    // Buscar conexão ativa
    const writer = activeConnections.get(sessionId)
    if (writer) {
      const data = {
        type: 'album_progress',
        albumName,
        progress,
        message,
        timestamp: new Date().toISOString()
      }
      
      await writer.write(`data: ${JSON.stringify(data)}\n\n`)
    } else {
      console.log(`⚠️ Nenhuma conexão ativa encontrada para sessão: ${sessionId}`)
    }
  } catch (error) {
    console.error('❌ Erro ao enviar notificação:', error)
  }
}

// Função para adicionar conexão ativa
export const addActiveConnection = (sessionId: string, writer: WritableStreamDefaultWriter) => {
  activeConnections.set(sessionId, writer)
  console.log(`✅ Conexão adicionada para sessão: ${sessionId}`)
}

// Função para remover conexão ativa
export const removeActiveConnection = (sessionId: string) => {
  activeConnections.delete(sessionId)
  console.log(`🗑️ Conexão removida para sessão: ${sessionId}`)
}

// Função para obter estatísticas da fila (simulada)
export const getQueueStats = (): QueueStats => {
  return {
    waiting: 0,
    active: 0,
    completed: 0,
    failed: 0
  }
}

// Função para enviar notificação geral
export const sendNotification = async (sessionId: string, data: NotificationData) => {
  try {
    const writer = activeConnections.get(sessionId)
    if (writer) {
      const notification = {
        ...data,
        timestamp: data.timestamp || new Date().toISOString()
      }
      
      await writer.write(`data: ${JSON.stringify(notification)}\n\n`)
      console.log(`📢 Notificação enviada para sessão ${sessionId}:`, notification)
    } else {
      console.log(`⚠️ Nenhuma conexão ativa para sessão: ${sessionId}`)
    }
  } catch (error) {
    console.error('❌ Erro ao enviar notificação:', error)
  }
}

// Função para broadcast para todas as conexões
export const broadcastNotification = async (data: NotificationData) => {
  const notification = {
    ...data,
    timestamp: data.timestamp || new Date().toISOString()
  }
  
  for (const [sessionId, writer] of activeConnections) {
    try {
      await writer.write(`data: ${JSON.stringify(notification)}\n\n`)
    } catch (error) {
      console.error(`❌ Erro ao enviar broadcast para sessão ${sessionId}:`, error)
      // Remover conexão inválida
      activeConnections.delete(sessionId)
    }
  }
  
  console.log(`📢 Broadcast enviado para ${activeConnections.size} conexões`)
}

// Limpeza periódica de conexões inativas
setInterval(() => {
  console.log(`🧹 Limpeza: ${activeConnections.size} conexões ativas`)
}, 60000) // A cada minuto