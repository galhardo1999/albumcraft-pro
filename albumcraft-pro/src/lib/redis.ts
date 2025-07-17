import Redis from 'ioredis'

// Configuração segura do Redis com fallback
const createRedisConnection = () => {
  const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379'
  
  try {
    const redis = new Redis(redisUrl, {
      maxRetriesPerRequest: 3,
      retryDelayOnFailover: 100,
      enableReadyCheck: false,
      maxRetriesPerRequest: null,
      lazyConnect: true,
      // Configurações de segurança
      connectTimeout: 10000,
      commandTimeout: 5000,
      // Pool de conexões para escalabilidade
      family: 4,
      keepAlive: true,
    })

    redis.on('error', (error) => {
      console.error('Redis connection error:', error)
    })

    redis.on('connect', () => {
      console.log('✅ Redis connected successfully')
    })

    return redis
  } catch (error) {
    console.error('Failed to create Redis connection:', error)
    return null
  }
}

export const redis = createRedisConnection()

// Verificar se Redis está disponível
export const isRedisAvailable = async (): Promise<boolean> => {
  if (!redis) return false
  
  try {
    await redis.ping()
    return true
  } catch (error) {
    console.warn('Redis not available:', error)
    return false
  }
}

export default redis