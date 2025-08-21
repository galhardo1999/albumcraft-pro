import { NextResponse } from 'next/server'

/**
 * Configuração centralizada para cookies de autenticação
 * Padroniza opções de segurança em todas as rotas
 */

export interface CookieOptions {
  httpOnly: boolean
  secure: boolean
  sameSite: 'strict' | 'lax' | 'none'
  maxAge: number
  path?: string
}

/**
 * Configurações padrão para cookies de autenticação
 */
export const AUTH_COOKIE_CONFIG: CookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax', // Permite navegação entre sites (melhor UX) mas mantém proteção CSRF
  maxAge: 7 * 24 * 60 * 60, // 7 dias em segundos
  path: '/'
}

/**
 * Configurações para cookies de sessão temporária (ex: reset de senha)
 */
export const TEMP_COOKIE_CONFIG: CookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict', // Mais restritivo para operações sensíveis
  maxAge: 15 * 60, // 15 minutos em segundos
  path: '/'
}

/**
 * Nome padrão do cookie de autenticação
 */
export const AUTH_COOKIE_NAME = 'auth-token'

/**
 * Utilitário para definir cookie de autenticação com configurações padronizadas
 */
export function setAuthCookie(response: NextResponse, token: string, options?: Partial<CookieOptions>) {
  const config = { ...AUTH_COOKIE_CONFIG, ...options }
  
  response.cookies.set(AUTH_COOKIE_NAME, token, config)
}

/**
 * Utilitário para remover cookie de autenticação
 */
export function clearAuthCookie(response: NextResponse) {
  const config = {
    ...AUTH_COOKIE_CONFIG,
    maxAge: 0, // Expira imediatamente
  }
  
  response.cookies.set(AUTH_COOKIE_NAME, '', config)
}