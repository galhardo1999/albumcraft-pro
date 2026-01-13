'use client'

import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/hooks/useAuth'

interface AlbumHeaderProps {
    album: {
        name: string
        description?: string | null
    }
}

export function AlbumHeader({ album }: AlbumHeaderProps) {
    const router = useRouter()
    const { logout } = useAuth()

    return (
        <header className="border-b bg-card flex-shrink-0">
            <div className="flex items-center justify-between px-6 py-4">
                <div className="flex items-center space-x-4">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => router.push('/albums')}
                    >
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                        Voltar
                    </Button>
                    <div>
                        <h1 className="text-xl font-semibold">{album.name}</h1>
                        <p className="text-sm text-muted-foreground">
                            {album.description || 'Diagramador de Álbum'}
                        </p>
                    </div>
                </div>

                <div className="flex items-center space-x-2">
                    <Button variant="outline" size="sm">
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3-3m0 0l-3 3m3-3v12" />
                        </svg>
                        Exportar
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => logout()}>
                        Sair
                    </Button>
                </div>
            </div>
        </header>
    )
}
