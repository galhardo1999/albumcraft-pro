// Importação dinâmica para evitar problemas no lado do cliente
import { redis, isRedisAvailable } from './redis'

// Re-exportar para facilitar o uso
export { isRedisAvailable }

// Tipos para os jobs
export interface AlbumCreationJobData {
  userId: string
  eventName: string
  albumName: string
  template: string
  files: Array<{
    name: string
    size: number
    type: string
    buffer: Buffer
  }>
  sessionId: string // Para notificações em tempo real
}

export interface JobProgress {
  step: string
  progress: number
  message: string
  albumName: string
}

// Verificar se estamos no servidor
const isServer = typeof window === 'undefined'

// Configuração da fila com segurança e escalabilidade
const createQueue = async () => {
  // Só criar fila no servidor
  if (!isServer) {
    console.warn('⚠️ Queue can only be created on server side')
    return null
  }

  if (!redis) {
    console.warn('⚠️ Redis not available, queue system disabled')
    return null
  }

  try {
    // Importação dinâmica do Bull apenas no servidor
    const Bull = (await import('bull')).default
    
    const queue = new Bull('album-creation', {
      redis: {
        port: parseInt(process.env.REDIS_PORT || '6379'),
        host: process.env.REDIS_HOST || 'localhost',
        password: process.env.REDIS_PASSWORD,
        db: parseInt(process.env.REDIS_DB || '0'),
      },
      defaultJobOptions: {
        removeOnComplete: 10, // Manter apenas 10 jobs completos
        removeOnFail: 50, // Manter 50 jobs falhados para debug
        attempts: 3, // Tentar 3 vezes em caso de falha
        backoff: {
          type: 'exponential',
          delay: 2000, // Delay exponencial começando em 2s
        },
      },
      settings: {
        stalledInterval: 30 * 1000, // 30 segundos
        maxStalledCount: 1,
      },
    })

    // Event listeners para monitoramento
    queue.on('error', (error) => {
      console.error('❌ Queue error:', error)
    })

    queue.on('waiting', (jobId) => {
      console.log(`⏳ Job ${jobId} waiting`)
    })

    queue.on('active', (job) => {
      console.log(`🚀 Job ${job.id} started processing`)
    })

    queue.on('completed', (job) => {
      console.log(`✅ Job ${job.id} completed`)
    })

    queue.on('failed', (job, err) => {
      console.error(`❌ Job ${job.id} failed:`, err)
    })

    return queue
  } catch (error) {
    console.error('Failed to create queue:', error)
    return null
  }
}

// Instância da fila (lazy loading)
let albumQueueInstance: any = null
let queuePromise: Promise<any> | null = null

export const getAlbumQueue = async () => {
  if (!isServer) return null
  
  if (albumQueueInstance) return albumQueueInstance
  
  if (!queuePromise) {
    queuePromise = createQueue()
  }
  
  albumQueueInstance = await queuePromise
  return albumQueueInstance
}

// Função para adicionar job à fila
export const addAlbumCreationJob = async (
  data: AlbumCreationJobData,
  priority: number = 0
): Promise<any | null> => {
  if (!isServer) {
    console.warn('addAlbumCreationJob can only be called on server side')
    return null
  }

  const albumQueue = await getAlbumQueue()
  
  if (!albumQueue) {
    console.warn('Queue not available, processing synchronously')
    return null
  }

  try {
    const job = await albumQueue.add('create-album', data, {
      priority, // Maior prioridade = processado primeiro
      delay: 0,
      jobId: `album-${data.sessionId}-${Date.now()}`, // ID único
    })

    console.log(`📋 Job ${job.id} added to queue for album: ${data.albumName}`)
    return job
  } catch (error) {
    console.error('Failed to add job to queue:', error)
    return null
  }
}

// Função para verificar status da fila
export const getQueueStats = async () => {
  if (!isServer) return null

  const albumQueue = await getAlbumQueue()
  if (!albumQueue) return null

  try {
    const [waiting, active, completed, failed] = await Promise.all([
      albumQueue.getWaiting(),
      albumQueue.getActive(),
      albumQueue.getCompleted(),
      albumQueue.getFailed(),
    ])

    return {
      waiting: waiting.length,
      active: active.length,
      completed: completed.length,
      failed: failed.length,
    }
  } catch (error) {
    console.error('Failed to get queue stats:', error)
    return null
  }
}

// Exportar a função para obter a fila
export const albumQueue = isServer ? getAlbumQueue() : Promise.resolve(null)

export default albumQueue