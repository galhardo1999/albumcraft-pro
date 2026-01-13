import 'server-only'
import { prisma } from '@/shared/lib/prisma'
import { unstable_cache } from 'next/cache'

export interface DashboardStats {
    totalProjects: number
    activeProjects: number
    totalPhotos: number
    storageUsed: number
}

export class DashboardService {
    static async getStats(userId: string): Promise<DashboardStats> {
        const getCachedStats = unstable_cache(
            async (uid: string) => {
                const [totalProjects, activeProjects, totalPhotos, storageUsed] = await Promise.all([
                    prisma.album.count({
                        where: { userId: uid }
                    }),
                    prisma.album.count({
                        where: {
                            userId: uid,
                            status: { in: ['DRAFT', 'IN_PROGRESS'] }
                        }
                    }),
                    prisma.photo.count({
                        where: { userId: uid }
                    }),
                    prisma.photo.aggregate({
                        where: { userId: uid },
                        _sum: {
                            size: true
                        }
                    })
                ]);

                return {
                    totalProjects,
                    activeProjects,
                    totalPhotos,
                    storageUsed: storageUsed._sum.size || 0
                }
            },
            [`dashboard-stats-${userId}`],
            { tags: [`dashboard-stats-${userId}`], revalidate: 60 }
        )

        return getCachedStats(userId)
    }

    // Placeholder for photo events if we migrate that too
    static async getUserPhotoEvents(userId: string) {
        // Implement or fetch logic if needed. 
        // detailed implementation depends on where photo events are stored.
        // For now returning empty or basic check if not critical.
        return { hasPhotoEvents: false, count: 0 }
    }
}
