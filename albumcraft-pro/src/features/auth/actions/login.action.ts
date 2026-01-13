'use server'

import { cookies } from 'next/headers'
import { loginSchema } from '../schemas/auth.schema'
import { AuthService } from '../services/auth.service'
import { AUTH_COOKIE_NAME, AUTH_COOKIE_CONFIG } from '@/core/auth/cookies'

export type LoginActionState = {
    success?: boolean
    error?: string
    fieldErrors?: Record<string, string[]>
}

export async function loginAction(
    prevState: LoginActionState | null,
    formData: FormData
): Promise<LoginActionState> {
    const rawInput = Object.fromEntries(formData)
    const validation = loginSchema.safeParse(rawInput)

    if (!validation.success) {
        return {
            success: false,
            fieldErrors: validation.error.flatten().fieldErrors,
        }
    }

    const result = await AuthService.login(validation.data)

    if (!result.success) {
        return {
            success: false,
            error: result.message,
        }
    }

    // Set auth cookie
    const cookieStore = await cookies()
    cookieStore.set(AUTH_COOKIE_NAME, result.token, AUTH_COOKIE_CONFIG)

    return { success: true }
}
