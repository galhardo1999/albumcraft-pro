import { SignJWT, jwtVerify } from 'jose'

/**
 * Configuração centralizada para JWT
 * Elimina fallbacks inseguros e centraliza a lógica de JWT
 */
class JWTConfig {
  private static _secret: Uint8Array | null = null

  /**
   * Obtém o secret do JWT de forma segura
   * Lança erro se NEXTAUTH_SECRET não estiver configurado
   */
  private static getSecret(): Uint8Array {
    if (!this._secret) {
      const secretString = process.env.NEXTAUTH_SECRET
      
      if (!secretString) {
        throw new Error(
          'NEXTAUTH_SECRET não está configurado. ' +
          'Configure esta variável de ambiente antes de usar JWT.'
        )
      }

      if (secretString.length < 32) {
        throw new Error(
          'NEXTAUTH_SECRET deve ter pelo menos 32 caracteres para segurança adequada.'
        )
      }

      this._secret = new TextEncoder().encode(secretString)
    }
    
    return this._secret
  }

  /**
   * Cria um token JWT com payload e expiração
   */
  static async createToken(payload: Record<string, unknown>, expiresIn: string = '7d'): Promise<string> {
    const secret = this.getSecret()
    
    return new SignJWT(payload)
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime(expiresIn)
      .sign(secret)
  }

  /**
   * Verifica um token JWT
   */
  static async verifyToken(token: string): Promise<{ valid: boolean; payload?: Record<string, unknown> }> {
    try {
      const secret = this.getSecret()
      const { payload } = await jwtVerify(token, secret)
      return { valid: true, payload: payload as Record<string, unknown> }
    } catch (error) {
      return { valid: false }
    }
  }

  /**
   * Obtém o secret para uso direto (quando necessário)
   * Use apenas quando precisar do secret raw para bibliotecas específicas
   */
  static getSecretForDirectUse(): Uint8Array {
    return this.getSecret()
  }
}

export { JWTConfig }

// Funções de conveniência para manter compatibilidade
export const createJWTToken = JWTConfig.createToken.bind(JWTConfig)
export const verifyJWTToken = JWTConfig.verifyToken.bind(JWTConfig)
export const getJWTSecret = JWTConfig.getSecretForDirectUse.bind(JWTConfig)