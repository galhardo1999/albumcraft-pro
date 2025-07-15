import bcrypt from 'bcryptjs'

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
}

export class SecurityUtils {
  static sanitizeFilename(filename: string): string {
    // Remove caracteres perigosos e mantém apenas alfanuméricos, pontos e hífens
    return filename.replace(/[^a-zA-Z0-9.-]/g, '_')
  }

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
    const sanitized = this.sanitizeFilename(filename)
    return `${timestamp}-${random}-${sanitized}`
  }
}