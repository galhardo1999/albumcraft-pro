import bcrypt from 'bcryptjs'
import { verifyJWTToken } from './jwt-config'
import crypto from 'crypto'

export class AuthService {
  static async hashPassword(password: string): Promise<string> {
    const saltRounds = 12
    return bcrypt.hash(password, saltRounds)
  }

  static async verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
    return bcrypt.compare(password, hashedPassword)
  }

  static generateSecureToken(): string {
    return crypto.randomUUID()
  }

  /**
   * Gera um token de reset de senha seguro
   * Retorna tanto o token original (para envio por email) quanto o hash (para armazenamento)
   */
  static generateResetToken(): { token: string; hashedToken: string } {
    const token = crypto.randomBytes(32).toString('hex')
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex')
    return { token, hashedToken }
  }

  /**
   * Cria hash de um token de reset para comparação
   */
  static hashResetToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex')
  }
}

export async function verifyToken(token: string): Promise<{ valid: boolean; payload?: Record<string, unknown> }> {
  return verifyJWTToken(token)
}

import { sanitizeFileName } from './image-processing'

export class SecurityUtils {
  static validateFileType(mimeType: string): boolean {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp']
    return allowedTypes.includes(mimeType)
  }

  static validateFileSize(size: number): boolean {
    const maxSize = 50 * 1024 * 1024 // 50MB
    return size <= maxSize
  }

  static generateSecureUrl(filename: string): string {
    const timestamp = Date.now()
    const random = Math.random().toString(36).substring(2)
    const sanitized = sanitizeFileName(filename)
    return `${timestamp}-${random}-${sanitized}`
  }
}