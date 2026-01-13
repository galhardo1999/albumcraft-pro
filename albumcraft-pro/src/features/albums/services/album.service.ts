import 'server-only'
import { prisma } from '@/shared/lib/prisma'
import { unstable_cache } from 'next/cache'
import { CreateAlbumInput, UpdateAlbumInput } from '../schemas/album.schema'
import { Prisma } from '@prisma/client'
import { PhotoService } from '@/features/photos/services/photo.service'

export class AlbumService {
    static async createAlbum(data: CreateAlbumInput & { userId: string }) {
        return prisma.album.create({
            data: {
                name: data.name,
                description: data.description,
                albumSize: data.albumSize,
                status: data.status ?? 'DRAFT',
                userId: data.userId,
                settings: (data.customWidth || data.customHeight) ? {
                    customWidth: data.customWidth,
                    customHeight: data.customHeight
                } : undefined,
            }
        })
    }

    static async updateAlbum(id: string, data: UpdateAlbumInput, userId: string) {
        const album = await prisma.album.findUnique({
            where: { id },
        })

        if (!album || album.userId !== userId) {
            throw new Error('Album not found or unauthorized')
        }

        return prisma.album.update({
            where: { id },
            data: {
                ...data,
                updatedAt: new Date(),
            }
        })
    }

    static async deleteAlbum(id: string, userId: string) {
        const album = await prisma.album.findUnique({
            where: { id },
        })

        if (!album || album.userId !== userId) {
            throw new Error('Album not found or unauthorized')
        }

        // Clean up photos from S3 first
        await PhotoService.deletePhotosByAlbumId(id)

        return prisma.album.delete({
            where: { id }
        })
    }

    static async getAlbumById(id: string) {
        // Cache the result for 1 minute
        const getCachedAlbum = unstable_cache(
            async (albumId: string) => {
                return prisma.album.findUnique({
                    where: { id: albumId },
                    include: {
                        pages: {
                            orderBy: { pageNumber: 'asc' },
                            include: {
                                photoPlacement: true
                            }
                        }
                    }
                })
            },
            [`album-${id}`],
            { tags: [`album-${id}`], revalidate: 60 }
        )

        return getCachedAlbum(id)
    }

    static async getUserAlbums(userId: string) {
        const getCachedUserAlbums = unstable_cache(
            async (uid: string) => {
                return prisma.album.findMany({
                    where: { userId: uid },
                    orderBy: { updatedAt: 'desc' }
                })
            },
            [`user-albums-${userId}`],
            { tags: [`user-albums-${userId}`], revalidate: 60 }
        )

        return getCachedUserAlbums(userId)
    }
}
