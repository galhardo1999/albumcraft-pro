'use client'

import Link from 'next/link'
import { Camera } from 'lucide-react'
import { DashboardStats } from '../services/dashboard.service'
import { formatSizeDisplay } from '@/lib/album-sizes'

interface DashboardViewProps {
    stats: DashboardStats
    userPhotoEvents?: {
        hasPhotoEvents: boolean
        count: number
    }
}

export function DashboardView({ stats, userPhotoEvents }: DashboardViewProps) {
    return (
        <div>
            {/* Welcome Section */}
            <div className="mb-8">
                <h1 className="text-2xl font-semibold tracking-tight mb-2">Dashboard</h1>
                <p className="text-muted-foreground">Gerencie seus álbuns e projetos</p>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                <div className="rounded-xl border bg-card p-6">
                    <div className="flex items-center space-x-4">
                        <div className="p-2 bg-primary/10 rounded-lg">
                            <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                            </svg>
                        </div>
                        <div>
                            <p className="text-sm font-medium text-muted-foreground">Total de Álbuns</p>
                            <p className="text-2xl font-semibold">{stats.totalProjects}</p>
                        </div>
                    </div>
                </div>

                <div className="rounded-xl border bg-card p-6">
                    <div className="flex items-center space-x-4">
                        <div className="p-2 bg-green-100 rounded-lg">
                            <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                        <div>
                            <p className="text-sm font-medium text-muted-foreground">Em Progresso</p>
                            <p className="text-2xl font-semibold">{stats.activeProjects}</p>
                        </div>
                    </div>
                </div>

                <div className="rounded-xl border bg-card p-6">
                    <div className="flex items-center space-x-4">
                        <div className="p-2 bg-blue-100 rounded-lg">
                            <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                        </div>
                        <div>
                            <p className="text-sm font-medium text-muted-foreground">Total de Fotos</p>
                            <p className="text-2xl font-semibold">{stats.totalPhotos}</p>
                        </div>
                    </div>
                </div>

                <div className="rounded-xl border bg-card p-6">
                    <div className="flex items-center space-x-4">
                        <div className="p-2 bg-orange-100 rounded-lg">
                            <svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                            </svg>
                        </div>
                        <div>
                            <p className="text-sm font-medium text-muted-foreground">Armazenamento</p>
                            <p className="text-2xl font-semibold">{formatSizeDisplay(stats.storageUsed)}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Quick Actions */}
            <div className="mb-8">
                <h2 className="text-lg font-semibold mb-4">Ações Rápidas</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-w-4xl">
                    <Link
                        href="/albums/new"
                        className="rounded-xl border bg-card p-6 text-center hover:bg-accent transition-colors group"
                    >
                        <div className="p-3 bg-primary/10 rounded-lg w-fit mx-auto mb-3 group-hover:bg-primary/20 transition-colors">
                            <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                        </div>
                        <h3 className="font-semibold mb-1">Novo Álbum</h3>
                        <p className="text-sm text-muted-foreground">Criar um novo projeto</p>
                    </Link>

                    <Link
                        href="/albums"
                        className="rounded-xl border bg-card p-6 text-center hover:bg-accent transition-colors group"
                    >
                        <div className="p-3 bg-blue-100 rounded-lg w-fit mx-auto mb-3 group-hover:bg-blue-200 transition-colors">
                            <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                            </svg>
                        </div>
                        <h3 className="font-semibold mb-1">Meus Álbuns</h3>
                        <p className="text-sm text-muted-foreground">Ver todos os projetos</p>
                    </Link>

                    {userPhotoEvents?.hasPhotoEvents && (
                        <Link
                            href="/fotos-disponiveis"
                            className="rounded-xl border bg-card p-6 text-center hover:bg-accent transition-colors group"
                        >
                            <div className="p-3 bg-purple-100 rounded-lg w-fit mx-auto mb-3 group-hover:bg-purple-200 transition-colors">
                                <Camera className="w-6 h-6 text-purple-600" />
                            </div>
                            <h3 className="font-semibold mb-1">Fotos Disponíveis</h3>
                            <p className="text-sm text-muted-foreground">
                                {userPhotoEvents.count} evento{userPhotoEvents.count !== 1 ? 's' : ''} disponível{userPhotoEvents.count !== 1 ? 'eis' : ''}
                            </p>
                        </Link>
                    )}
                </div>
            </div>
        </div>
    )
}
