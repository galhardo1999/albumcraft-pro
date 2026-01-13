'use server'

import { revalidatePath } from 'next/cache'
import { cookies } from 'next/headers'
import { createAlbumSchema } from '../schemas/album.schema'
import { AlbumService } from '../services/album.service'
import { AUTH_COOKIE_NAME } from '@/core/auth/cookies'
import { JWTConfig } from '@/core/auth/jwt'

export type CreateAlbumActionState = {
    success?: boolean
    error?: string
    fieldErrors?: Record<string, string[]>
    albumId?: string
}

export async function createAlbumAction(
    prevState: CreateAlbumActionState | null,
    formData: FormData
): Promise<CreateAlbumActionState> {
    const cookieStore = await cookies()
    const token = cookieStore.get(AUTH_COOKIE_NAME)?.value

    if (!token) {
        return { success: false, error: 'Unauthorized' }
    }

    const verification = await JWTConfig.verifyToken(token)
    if (!verification.valid || !verification.payload) {
        return { success: false, error: 'Unauthorized' }
    }

    const rawInput = {
        name: formData.get('name'),
        description: formData.get('description') || undefined,
        albumSize: formData.get('albumSize'),
        status: formData.get('status') || undefined,
        creationType: formData.get('creationType') || undefined,
        group: formData.get('group') || undefined,
        customWidth: formData.get('customWidth') ? Number(formData.get('customWidth')) : undefined,
        customHeight: formData.get('customHeight') ? Number(formData.get('customHeight')) : undefined,
    }

    const validation = createAlbumSchema.safeParse(rawInput)

    if (!validation.success) {
        return {
            success: false,
            fieldErrors: validation.error.flatten().fieldErrors,
        }
    }

    try {
        const album = await AlbumService.createAlbum({
            ...validation.data,
            userId: verification.payload.userId as string,
        })

        revalidatePath('/dashboard')
        return { success: true, albumId: album.id }
    } catch (error) {
        console.error('Create album error:', error)
        return { success: false, error: 'Failed to create album' }
    }
}
