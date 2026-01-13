import 'server-only'
import bcrypt from 'bcryptjs'
import crypto from 'crypto'
import { prisma } from '@/shared/lib/prisma'
import { JWTConfig } from '@/core/auth/jwt'
import { CreateUserInput, LoginInput } from '../schemas/auth.schema'

export class AuthService {
    /**
     * Hashes a password securely
     */
    static async hashPassword(password: string): Promise<string> {
        const saltRounds = 12
        return bcrypt.hash(password, saltRounds)
    }

    /**
     * Verifies a password against a hash
     */
    static async verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
        return bcrypt.compare(password, hashedPassword)
    }

    /**
     * Generates a random secure token
     */
    static generateSecureToken(): string {
        return crypto.randomUUID()
    }

    /**
     * Generates a reset token and its hash
     */
    static generateResetToken(): { token: string; hashedToken: string } {
        const token = crypto.randomBytes(32).toString('hex')
        const hashedToken = crypto.createHash('sha256').update(token).digest('hex')
        return { token, hashedToken }
    }

    /**
     * Hashes a comparison token (useful for verifying inputs to DB hash)
     */
    static hashResetToken(token: string): string {
        return crypto.createHash('sha256').update(token).digest('hex')
    }

    /**
     * Login logic
     */
    static async login(input: LoginInput) {
        const user = await prisma.user.findUnique({
            where: { email: input.email }
        })

        if (!user) {
            return { success: false, error: 'INVALID_CREDENTIALS', message: 'Email ou senha inválidos' } as const
        }

        const isValidPassword = await this.verifyPassword(input.password, user.passwordHash)

        if (!isValidPassword) {
            return { success: false, error: 'INVALID_CREDENTIALS', message: 'Email ou senha inválidos' } as const
        }

        // Atualizar último login
        await prisma.user.update({
            where: { id: user.id },
            data: { lastLogin: new Date() }
        })

        // Gerar JWT token
        const token = await JWTConfig.createToken({
            userId: user.id,
            email: user.email,
            plan: user.plan,
            isAdmin: user.isAdmin
        }, '7d')

        return {
            success: true,
            token,
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                plan: user.plan,
                avatarUrl: user.avatarUrl,
                isAdmin: user.isAdmin
            }
        } as const
    }

    /**
     * Register logic
     */
    static async register(input: CreateUserInput) {
        const existingUser = await prisma.user.findUnique({
            where: { email: input.email }
        })

        if (existingUser) {
            return { success: false, error: 'USER_EXISTS', message: 'Usuário já existe com este email' } as const
        }

        const passwordHash = await this.hashPassword(input.password)

        const user = await prisma.user.create({
            data: {
                email: input.email,
                passwordHash,
                name: input.name,
            },
            select: {
                id: true,
                email: true,
                name: true,
                plan: true,
                createdAt: true,
                isAdmin: true,
                avatarUrl: true
            }
        })

        const token = await JWTConfig.createToken({
            userId: user.id,
            email: user.email,
            plan: user.plan,
            isAdmin: false
        }, '7d')

        return { success: true, user, token } as const
    }

    /**
     * Forgot Password logic
     */
    static async forgotPassword(email: string) {
        const user = await prisma.user.findUnique({
            where: { email }
        })

        // Retorna true sempre por segurança
        if (!user) {
            return { success: true } as const
        }

        const { token, hashedToken } = this.generateResetToken()
        const resetExpires = new Date(Date.now() + 60 * 60 * 1000) // 1 hora

        await prisma.user.update({
            where: { id: user.id },
            data: {
                resetPasswordToken: hashedToken,
                resetPasswordExpires: resetExpires
            }
        })

        // TODO: Adicionar serviço de email
        // await sendEmail(...)
        console.log(`[DEV] Link de reset para ${email}: ${process.env.NEXTAUTH_URL}/auth/reset-password?token=${token}`)

        return { success: true } as const
    }

    /**
     * Reset Password logic
     */
    static async resetPassword(token: string, newPassword: string) {
        const hashedToken = this.hashResetToken(token)

        const user = await prisma.user.findFirst({
            where: {
                resetPasswordToken: hashedToken,
                resetPasswordExpires: {
                    gt: new Date()
                }
            }
        })

        if (!user) {
            return { success: false, error: 'INVALID_TOKEN', message: 'Token inválido ou expirado' } as const
        }

        const passwordHash = await this.hashPassword(newPassword)

        await prisma.user.update({
            where: { id: user.id },
            data: {
                passwordHash,
                resetPasswordToken: null,
                resetPasswordExpires: null
            }
        })

        return { success: true } as const
    }
}
