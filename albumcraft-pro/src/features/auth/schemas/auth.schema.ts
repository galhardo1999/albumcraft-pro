import { z } from 'zod'

export const createUserSchema = z.object({
    email: z.string().email('Email inválido'),
    password: z.string().min(8, 'Senha deve ter pelo menos 8 caracteres'),
    name: z.string().min(1, 'Nome é obrigatório').max(100, 'Nome muito longo'),
})

export const loginSchema = z.object({
    email: z.string().email('Email inválido'),
    password: z.string().min(1, 'Senha é obrigatória'),
})

export const forgotPasswordSchema = z.object({
    email: z.string().email('Email inválido'),
})

export const resetPasswordSchema = z.object({
    token: z.string().min(1, 'Token é obrigatório'),
    password: z.string().min(8, 'A senha deve ter pelo menos 8 caracteres'),
})

export const verifyResetTokenSchema = z.object({
    token: z.string().min(1, 'Token é obrigatório'),
})

export type CreateUserInput = z.infer<typeof createUserSchema>
export type LoginInput = z.infer<typeof loginSchema>
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>
export type VerifyResetTokenInput = z.infer<typeof verifyResetTokenSchema>
