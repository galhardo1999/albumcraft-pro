'use server'

import { revalidatePath, revalidateTag } from 'next/cache'
import { cookies } from 'next/headers'
import { PhotoService } from '../services/photo.service'
import { AUTH_COOKIE_NAME } from '@/core/auth/cookies'
import { JWTConfig } from '@/core/auth/jwt'

export type UploadPhotoActionState = {
    success?: boolean
    error?: string
    photo?: any
}

export async function uploadPhotoAction(
    prevState: UploadPhotoActionState | null,
    formData: FormData
): Promise<UploadPhotoActionState> {
    const cookieStore = await cookies()
    const token = cookieStore.get(AUTH_COOKIE_NAME)?.value

    if (!token) {
        return { success: false, error: 'Unauthorized' }
    }

    const verification = await JWTConfig.verifyToken(token)
    if (!verification.valid || !verification.payload) {
        return { success: false, error: 'Unauthorized' }
    }

    const file = formData.get('file') as File
    const albumId = formData.get('albumId') as string | null

    if (!file) {
        return { success: false, error: 'No file provided' }
    }

    try {
        const buffer = Buffer.from(await file.arrayBuffer())

        if (!file.type.startsWith('image/')) {
            return { success: false, error: 'Invalid file type' }
        }

        const photo = await PhotoService.createPhoto(
            verification.payload.userId as string,
            buffer,
            file.name,
            file.type,
            file.size,
            albumId
        )

        if (albumId) {
            revalidateTag(`album-photos-${albumId}`)
            revalidatePath(`/albums/${albumId}`)
        }

        return { success: true, photo }
    } catch (error) {
        console.error('Upload photo error:', error)
        return { success: false, error: 'Failed to upload photo' }
    }
}
