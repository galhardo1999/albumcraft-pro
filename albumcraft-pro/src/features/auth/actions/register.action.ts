'use server'

import { cookies } from 'next/headers'
import { createUserSchema } from '../schemas/auth.schema'
import { AuthService } from '../services/auth.service'
import { AUTH_COOKIE_NAME, AUTH_COOKIE_CONFIG } from '@/core/auth/cookies'

export type RegisterActionState = {
    success?: boolean
    error?: string
    fieldErrors?: Record<string, string[]>
}

export async function registerAction(
    prevState: RegisterActionState | null,
    formData: FormData
): Promise<RegisterActionState> {
    const rawInput = Object.fromEntries(formData)
    const validation = createUserSchema.safeParse(rawInput)

    if (!validation.success) {
        return {
            success: false,
            fieldErrors: validation.error.flatten().fieldErrors,
        }
    }

    const result = await AuthService.register(validation.data)

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
