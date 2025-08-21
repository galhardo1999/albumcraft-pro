import { NextRequest } from 'next/server'

interface RateLimitConfig {
  windowMs: number // Janela de tempo em milissegundos
  maxRequests: number // Máximo de requests por janela
  keyGenerator?: (req: NextRequest) => string // Função para gerar chave única
}

interface RateLimitEntry {
  count: number
  resetTime: number
}

// Store em memória para rate limiting
// Em produção, considere usar Redis ou similar
const rateLimitStore = new Map<string, RateLimitEntry>()

/**
 * Limpa entradas expiradas do store
 */
function cleanupExpiredEntries() {
  const now = Date.now()
  for (const [key, entry] of rateLimitStore.entries()) {
    if (now > entry.resetTime) {
      rateLimitStore.delete(key)
    }
  }
}

/**
 * Gera chave padrão baseada no IP do cliente
 */
function defaultKeyGenerator(req: NextRequest): string {
  // Tenta obter o IP real considerando proxies
  const forwarded = req.headers.get('x-forwarded-for')
  const realIp = req.headers.get('x-real-ip')
  const ip = forwarded?.split(',')[0] || realIp || 'unknown'
  return `rate_limit:${ip}`
}

/**
 * Middleware de rate limiting
 */
export function rateLimit(config: RateLimitConfig) {
  return async (req: NextRequest) => {
    // Limpa entradas expiradas periodicamente
    if (Math.random() < 0.01) { // 1% de chance
      cleanupExpiredEntries()
    }

    const keyGenerator = config.keyGenerator || defaultKeyGenerator
    const key = keyGenerator(req)
    const now = Date.now()
    const windowStart = now
    const windowEnd = now + config.windowMs

    const entry = rateLimitStore.get(key)

    if (!entry || now > entry.resetTime) {
      // Nova janela ou primeira requisição
      rateLimitStore.set(key, {
        count: 1,
        resetTime: windowEnd
      })
      return {
        success: true,
        remaining: config.maxRequests - 1,
        resetTime: windowEnd
      }
    }

    if (entry.count >= config.maxRequests) {
      // Limite excedido
      return {
        success: false,
        remaining: 0,
        resetTime: entry.resetTime,
        retryAfter: Math.ceil((entry.resetTime - now) / 1000)
      }
    }

    // Incrementa contador
    entry.count++
    rateLimitStore.set(key, entry)

    return {
      success: true,
      remaining: config.maxRequests - entry.count,
      resetTime: entry.resetTime
    }
  }
}

/**
 * Configurações pré-definidas para diferentes tipos de rotas
 */
export const rateLimitConfigs = {
  // Login/Register: 5 tentativas por 15 minutos
  auth: {
    windowMs: 15 * 60 * 1000, // 15 minutos
    maxRequests: 5
  },
  
  // Password reset: 3 tentativas por hora
  passwordReset: {
    windowMs: 60 * 60 * 1000, // 1 hora
    maxRequests: 3
  },
  
  // Rotas gerais: 100 requests por 15 minutos
  general: {
    windowMs: 15 * 60 * 1000, // 15 minutos
    maxRequests: 100
  },
  
  // OAuth: 10 tentativas por 5 minutos
  oauth: {
    windowMs: 5 * 60 * 1000, // 5 minutos
    maxRequests: 10
  }
}

/**
 * Helper para criar resposta de rate limit excedido
 */
export function createRateLimitResponse(retryAfter: number) {
  return new Response(
    JSON.stringify({
      error: 'Rate limit exceeded',
      message: 'Muitas tentativas. Tente novamente mais tarde.',
      retryAfter
    }),
    {
      status: 429,
      headers: {
        'Content-Type': 'application/json',
        'Retry-After': retryAfter.toString(),
        'X-RateLimit-Limit': '5',
        'X-RateLimit-Remaining': '0'
      }
    }
  )
}

/**
 * Helper para adicionar headers de rate limit nas respostas
 */
export function addRateLimitHeaders(
  response: Response,
  remaining: number,
  resetTime: number,
  limit: number
) {
  response.headers.set('X-RateLimit-Limit', limit.toString())
  response.headers.set('X-RateLimit-Remaining', remaining.toString())
  response.headers.set('X-RateLimit-Reset', Math.ceil(resetTime / 1000).toString())
  return response
}