'use server'

import { forgotPasswordSchema } from '../schemas/auth.schema'
import { AuthService } from '../services/auth.service'

export type ForgotPasswordActionState = {
    success?: boolean
    error?: string
    message?: string
    fieldErrors?: Record<string, string[]>
}

export async function forgotPasswordAction(
    prevState: ForgotPasswordActionState | null,
    formData: FormData
): Promise<ForgotPasswordActionState> {
    const rawInput = Object.fromEntries(formData)
    const validation = forgotPasswordSchema.safeParse(rawInput)

    if (!validation.success) {
        return {
            success: false,
            fieldErrors: validation.error.flatten().fieldErrors,
        }
    }

    await AuthService.forgotPassword(validation.data.email)

    return {
        success: true,
        message: 'Se o email estiver cadastrado, você receberá um link de recuperação'
    }
}
