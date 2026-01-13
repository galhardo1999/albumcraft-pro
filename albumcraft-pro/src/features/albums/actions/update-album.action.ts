'use server'

import { revalidatePath, revalidateTag } from 'next/cache'
import { cookies } from 'next/headers'
import { updateAlbumSchema } from '../schemas/album.schema'
import { AlbumService } from '../services/album.service'
import { AUTH_COOKIE_NAME } from '@/core/auth/cookies'
import { JWTConfig } from '@/core/auth/jwt'

export type UpdateAlbumActionState = {
    success?: boolean
    error?: string
    fieldErrors?: Record<string, string[]>
}

export async function updateAlbumAction(
    prevState: UpdateAlbumActionState | null,
    formData: FormData
): Promise<UpdateAlbumActionState> {
    const cookieStore = await cookies()
    const token = cookieStore.get(AUTH_COOKIE_NAME)?.value

    if (!token) {
        return { success: false, error: 'Unauthorized' }
    }

    const verification = await JWTConfig.verifyToken(token)
    if (!verification.valid || !verification.payload) {
        return { success: false, error: 'Unauthorized' }
    }

    const id = formData.get('id') as string
    if (!id) {
        return { success: false, error: 'Album ID is required' }
    }

    const rawInput = {
        name: formData.get('name'),
        description: formData.get('description') || undefined,
        status: formData.get('status') || undefined,
        // Add other fields as needed
    }

    // Remove undefined keys to allow partial updates
    Object.keys(rawInput).forEach(key => (rawInput as any)[key] === undefined && delete (rawInput as any)[key])

    const validation = updateAlbumSchema.safeParse(rawInput)

    if (!validation.success) {
        return {
            success: false,
            fieldErrors: validation.error.flatten().fieldErrors,
        }
    }

    try {
        await AlbumService.updateAlbum(id, validation.data, verification.payload.userId as string)

        revalidatePath('/dashboard')
        revalidatePath(`/albums/${id}`)
        revalidateTag(`album-${id}`)

        return { success: true }
    } catch (error) {
        console.error('Update album error:', error)
        return { success: false, error: 'Failed to update album' }
    }
}
