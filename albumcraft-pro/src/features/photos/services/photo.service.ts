import 'server-only'
import { prisma } from '@/shared/lib/prisma'
import { unstable_cache } from 'next/cache'
import { uploadToS3, deleteFromS3, generateS3Key, deletePhotoVariants } from '@/shared/lib/s3'
import { Photo } from '../types'

export class PhotoService {
    static async createPhoto(
        userId: string,
        file: Buffer,
        filename: string,
        mimeType: string,
        size: number,
        albumId?: string | null,
        width?: number,
        height?: number
    ) {
        // 1. Upload to S3
        const s3Key = generateS3Key(userId, filename, albumId || undefined)
        const s3Url = await uploadToS3(file, s3Key, mimeType)

        // 2. Create Database Record
        const photo = await prisma.photo.create({
            data: {
                userId,
                albumId,
                filename,
                originalName: filename,
                mimeType,
                size,
                width,
                height,
                s3Key,
                s3Url,
            }
        })

        return photo
    }

    static async getPhotosByAlbumId(albumId: string) {
        const getCachedPhotos = unstable_cache(
            async (id: string) => {
                return prisma.photo.findMany({
                    where: { albumId: id },
                    orderBy: { createdAt: 'desc' },
                })
            },
            [`album-photos-${albumId}`],
            { tags: [`album-photos-${albumId}`], revalidate: 60 }
        )
        return getCachedPhotos(albumId)
    }

    static async getPhotosByUserId(userId: string) {
        const getCachedPhotos = unstable_cache(
            async (uid: string) => {
                return prisma.photo.findMany({
                    where: { userId: uid },
                    orderBy: { createdAt: 'desc' },
                })
            },
            [`user-photos-${userId}`],
            { tags: [`user-photos-${userId}`], revalidate: 60 }
        )
        return getCachedPhotos(userId)
    }

    static async deletePhoto(photoId: string, userId: string) {
        const photo = await prisma.photo.findUnique({
            where: { id: photoId }
        })

        if (!photo) {
            throw new Error('Photo not found')
        }

        if (photo.userId !== userId) {
            throw new Error('Unauthorized')
        }

        // 1. Delete from S3 (original + variants)
        await deletePhotoVariants(photo.s3Key)

        // 2. Delete from Database
        await prisma.photo.delete({
            where: { id: photoId }
        })

        return true
    }

    static async deletePhotosByAlbumId(albumId: string) {
        const photos = await prisma.photo.findMany({
            where: { albumId }
        })

        if (photos.length === 0) return

        // Delete all from S3
        for (const photo of photos) {
            await deletePhotoVariants(photo.s3Key)
        }

        // Prisma cascade delete will handle DB records if Album is deleted
        // But if we just want to clear photos, we can delete them here.
        await prisma.photo.deleteMany({
            where: { albumId }
        })
    }
}
