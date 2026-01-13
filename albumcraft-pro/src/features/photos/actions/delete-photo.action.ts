'use server'

import { revalidatePath, revalidateTag } from 'next/cache'
import { cookies } from 'next/headers'
import { PhotoService } from '../services/photo.service'
import { AUTH_COOKIE_NAME } from '@/core/auth/cookies'
import { JWTConfig } from '@/core/auth/jwt'

export async function deletePhotoAction(photoId: string, albumId?: string) {
    const cookieStore = await cookies()
    const token = cookieStore.get(AUTH_COOKIE_NAME)?.value

    if (!token) {
        return { success: false, error: 'Unauthorized' }
    }

    const verification = await JWTConfig.verifyToken(token)
    if (!verification.valid || !verification.payload) {
        return { success: false, error: 'Unauthorized' }
    }

    try {
        await PhotoService.deletePhoto(photoId, verification.payload.userId as string)

        if (albumId) {
            revalidateTag(`album-photos-${albumId}`)
            revalidatePath(`/albums/${albumId}`)
        }

        return { success: true }
    } catch (error) {
        console.error('Delete photo error:', error)
        return { success: false, error: 'Failed to delete photo' }
    }
}
