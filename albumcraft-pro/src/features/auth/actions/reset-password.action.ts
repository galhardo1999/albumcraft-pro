'use server'

import { resetPasswordSchema } from '../schemas/auth.schema'
import { AuthService } from '../services/auth.service'

export type ResetPasswordActionState = {
    success?: boolean
    error?: string
    fieldErrors?: Record<string, string[]>
}

export async function resetPasswordAction(
    prevState: ResetPasswordActionState | null,
    formData: FormData
): Promise<ResetPasswordActionState> {
    const rawInput = Object.fromEntries(formData)
    const validation = resetPasswordSchema.safeParse(rawInput)

    if (!validation.success) {
        return {
            success: false,
            fieldErrors: validation.error.flatten().fieldErrors,
        }
    }

    const result = await AuthService.resetPassword(validation.data.token, validation.data.password)

    if (!result.success) {
        return {
            success: false,
            error: result.message
        }
    }

    return { success: true }
}
