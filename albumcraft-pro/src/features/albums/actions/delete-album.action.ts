'use server'

import { revalidatePath, revalidateTag } from 'next/cache'
import { cookies } from 'next/headers'
import { AlbumService } from '../services/album.service'
import { AUTH_COOKIE_NAME } from '@/core/auth/cookies'
import { JWTConfig } from '@/core/auth/jwt'

export type DeleteAlbumActionState = {
    success?: boolean
    error?: string
}

export async function deleteAlbumAction(
    prevState: DeleteAlbumActionState | null,
    formData: FormData
): Promise<DeleteAlbumActionState> {
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

    try {
        await AlbumService.deleteAlbum(id, verification.payload.userId as string)

        revalidatePath('/dashboard')
        revalidateTag(`user-albums-${verification.payload.userId}`)

        return { success: true }
    } catch (error) {
        console.error('Delete album error:', error)
        return { success: false, error: 'Failed to delete album' }
    }
}
