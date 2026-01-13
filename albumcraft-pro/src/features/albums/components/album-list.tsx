'use client'

import { useState, useCallback, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Album } from '../types'
import { getAlbumSizeByIdWithFallback, formatSizeDisplay } from '@/lib/album-sizes'
import { deleteAlbumAction } from '../actions/delete-album.action'
import { useAuth } from '@/hooks/useAuth'

interface AlbumListProps {
    initialAlbums: Album[]
}

export function AlbumList({ initialAlbums }: AlbumListProps) {
    const router = useRouter()
    const [albums, setAlbums] = useState<Album[]>(initialAlbums)
    const [filteredAlbums, setFilteredAlbums] = useState<Album[]>(initialAlbums)
    const [searchTerm, setSearchTerm] = useState('')
    const [statusFilter, setStatusFilter] = useState('ALL')
    const [creationTypeFilter, setCreationTypeFilter] = useState('ALL')
    const [sortBy, setSortBy] = useState('updatedAt')

    const [deleteModalOpen, setDeleteModalOpen] = useState(false)
    const [albumToDelete, setAlbumToDelete] = useState<Album | null>(null)
    const [isDeleting, setIsDeleting] = useState(false)

    const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set())
    const [viewMode, setViewMode] = useState<'grid' | 'list' | 'groups'>('grid')

    const [deleteGroupModalOpen, setDeleteGroupModalOpen] = useState(false)
    const [groupToDelete, setGroupToDelete] = useState<string | null>(null)
    const [isDeletingGroup, setIsDeletingGroup] = useState(false)

    // Update local state when server data changes (revalidation)
    useEffect(() => {
        setAlbums(initialAlbums)
    }, [initialAlbums])

    const filterAndSortAlbums = useCallback(() => {
        const filtered = albums.filter(album => {
            const matchesSearch = album.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                album.description?.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesStatus = statusFilter === 'ALL' || album.status === statusFilter;
            // creationType is typically string, check type safety
            const matchesCreationType = creationTypeFilter === 'ALL' || album.creationType === creationTypeFilter;
            return matchesSearch && matchesStatus && matchesCreationType;
        });

        filtered.sort((a, b) => {
            if (sortBy === 'name') {
                return a.name.localeCompare(b.name);
            } else if (sortBy === 'createdAt') {
                return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
            } else if (sortBy === 'updatedAt') {
                return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
            }
            return 0;
        });

        setFilteredAlbums(filtered);
    }, [albums, searchTerm, statusFilter, creationTypeFilter, sortBy]);

    useEffect(() => {
        filterAndSortAlbums();
    }, [filterAndSortAlbums]);

    const getStatusCount = (status: string) => {
        if (status === 'ALL') return albums.length
        return albums.filter(p => p.status === status).length
    }

    const getCreationTypeCount = (creationType: string) => {
        if (creationType === 'ALL') return albums.length
        return albums.filter(p => p.creationType === creationType).length
    }

    const getAlbumSizeText = (size: string) => {
        const albumSize = getAlbumSizeByIdWithFallback(size)
        return formatSizeDisplay(albumSize)
    }

    const handleDeleteClick = (album: Album) => {
        setAlbumToDelete(album)
        setDeleteModalOpen(true)
    }

    const handleDeleteConfirm = async () => {
        if (!albumToDelete) return

        setIsDeleting(true)
        const formData = new FormData()
        formData.append('id', albumToDelete.id)

        try {
            const result = await deleteAlbumAction(null, formData)

            if (!result.success) {
                throw new Error(result.error || 'Failed to delete album')
            }

            setAlbums(prev => prev.filter(p => p.id !== albumToDelete.id))
            setDeleteModalOpen(false)
            setAlbumToDelete(null)
            router.refresh() // Ensure server state is synced
        } catch (error) {
            console.error('Error deleting album:', error)
            alert('Erro ao excluir álbum')
        } finally {
            setIsDeleting(false)
        }
    }

    const handleDeleteGroupClick = (groupName: string) => {
        setGroupToDelete(groupName)
        setDeleteGroupModalOpen(true)
    }

    const handleDeleteGroupConfirm = async () => {
        if (!groupToDelete) return

        setIsDeletingGroup(true)
        try {
            const albumsToDelete = albums.filter(p => p.group === groupToDelete)

            // Execute deletions sequentially (or parallelize if API supports)
            // Since we don't have batch delete action yet, we loop.
            await Promise.all(albumsToDelete.map(async (album) => {
                const formData = new FormData()
                formData.append('id', album.id)
                const result = await deleteAlbumAction(null, formData)
                if (!result.success) throw new Error(result.error)
            }))

            setAlbums(prev => prev.filter(p => p.group !== groupToDelete))
            setDeleteGroupModalOpen(false)
            setGroupToDelete(null)
            router.refresh()
        } catch (error) {
            console.error('Error deleting group:', error)
            alert('Erro ao excluir grupo')
        } finally {
            setIsDeletingGroup(false)
        }
    }

    const toggleGroup = (groupName: string) => {
        setExpandedGroups(prev => {
            const newSet = new Set(prev)
            if (newSet.has(groupName)) {
                newSet.delete(groupName)
            } else {
                newSet.add(groupName)
            }
            return newSet
        })
    }

    const getGroupedAlbums = () => {
        const grouped: { [key: string]: Album[] } = {}
        const ungrouped: Album[] = []

        filteredAlbums.forEach(album => {
            if (album.group) {
                if (!grouped[album.group]) {
                    grouped[album.group] = []
                }
                grouped[album.group].push(album)
            } else {
                ungrouped.push(album)
            }
        })

        return { grouped, ungrouped }
    }

    const { grouped, ungrouped } = getGroupedAlbums()

    const getGroupCount = (groupName: string) => {
        return albums.filter(p => p.group === groupName).length
    }

    useEffect(() => {
        const hasGroups = albums.some(p => p.group)
        if (hasGroups && viewMode === 'list') {
            setViewMode('groups')
        }
    }, [albums, viewMode])

    return (
        <div>
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Meus Álbuns</h1>
                    <p className="text-muted-foreground mt-2">
                        Gerencie seus projetos de álbuns
                    </p>
                </div>
                <Link href="/albums/new">
                    <Button>Criar Novo Projeto</Button>
                </Link>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 mb-8">
                <div className="flex-1">
                    <Input
                        placeholder="Buscar álbuns..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full"
                    />
                </div>
                <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="px-3 py-2 border border-input bg-background rounded-md text-sm"
                >
                    <option value="ALL">Todos os Status ({getStatusCount('ALL')})</option>
                    <option value="COMPLETED">Concluídos ({getStatusCount('COMPLETED')})</option>
                    <option value="IN_PROGRESS">Em Andamento ({getStatusCount('IN_PROGRESS')})</option>
                </select>
                <select
                    value={creationTypeFilter}
                    onChange={(e) => setCreationTypeFilter(e.target.value)}
                    className="px-3 py-2 border border-input bg-background rounded-md text-sm"
                >
                    <option value="ALL">Todos os Tipos ({getCreationTypeCount('ALL')})</option>
                    <option value="MANUAL">Manual ({getCreationTypeCount('MANUAL')})</option>
                    <option value="AUTOMATIC">Automático ({getCreationTypeCount('AUTOMATIC')})</option>
                </select>
                <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="px-3 py-2 border border-input bg-background rounded-md text-sm"
                >
                    <option value="updatedAt">Mais Recentes</option>
                    <option value="createdAt">Data de Criação</option>
                    <option value="name">Nome</option>
                </select>
            </div>

            {filteredAlbums.length === 0 ? (
                <div className="text-center py-12">
                    <div className="mx-auto w-24 h-24 bg-muted rounded-full flex items-center justify-center mb-4">
                        <svg className="w-12 h-12 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                        </svg>
                    </div>
                    <h3 className="text-lg font-semibold mb-2">Nenhum álbum encontrado</h3>
                    <p className="text-muted-foreground mb-6">
                        {albums.length === 0
                            ? 'Comece criando seu primeiro álbum de fotos.'
                            : 'Tente ajustar os filtros de busca.'
                        }
                    </p>
                    {albums.length === 0 && (
                        <Link href="/albums/new">
                            <Button>Criar Primeiro Álbum</Button>
                        </Link>
                    )}
                </div>
            ) : (
                <div className="space-y-8">
                    {Object.keys(grouped).map((groupName) => (
                        <div key={groupName} className="space-y-4">
                            <div
                                className="flex items-center justify-between p-4 bg-muted/30 rounded-lg cursor-pointer hover:bg-muted/50 transition-colors"
                                onClick={() => toggleGroup(groupName)}
                            >
                                <div className="flex items-center space-x-3">
                                    <div className="p-2 bg-orange-100 rounded-lg">
                                        <svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                                        </svg>
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-semibold">{groupName}</h3>
                                        <p className="text-sm text-muted-foreground">
                                            {getGroupCount(groupName)} álbum{getGroupCount(groupName) !== 1 ? 's' : ''}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation()
                                            handleDeleteGroupClick(groupName)
                                        }}
                                        className="p-2 text-muted-foreground hover:text-destructive transition-colors"
                                        title="Excluir todos os álbuns do grupo"
                                    >
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                        </svg>
                                    </button>
                                    <div className="p-2 text-muted-foreground">
                                        <svg
                                            className={`w-5 h-5 transition-transform ${expandedGroups.has(groupName) ? 'rotate-180' : ''}`}
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
                                        >
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                        </svg>
                                    </div>
                                </div>
                            </div>

                            {expandedGroups.has(groupName) && (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 ml-4">
                                    {grouped[groupName].map((album) => (
                                        <Link key={album.id} href={`/albums/${album.id}`}>
                                            <div className="rounded-xl border bg-card hover:bg-accent/50 transition-colors group cursor-pointer">
                                                {album.photos && album.photos.length > 0 && (
                                                    <div className="flex gap-1 h-32 overflow-hidden rounded-t-xl bg-gray-100">
                                                        {album.photos.slice(0, 3).map((photo) => (
                                                            <img
                                                                key={photo.id}
                                                                src={photo.thumbnailUrl}
                                                                alt={photo.filename}
                                                                className="object-cover h-full w-full max-w-[33%] group-hover:scale-105 transition-transform duration-300"
                                                                loading="lazy"
                                                            />
                                                        ))}
                                                    </div>
                                                )}
                                                <div className="p-4">
                                                    <div className="flex justify-between items-start mb-3">
                                                        <h3 className="font-semibold text-lg truncate group-hover:text-primary transition-colors">
                                                            {album.name}
                                                        </h3>
                                                        <button
                                                            onClick={(e) => {
                                                                e.preventDefault()
                                                                e.stopPropagation()
                                                                handleDeleteClick(album)
                                                            }}
                                                            className="p-1 text-muted-foreground hover:text-destructive transition-colors opacity-0 group-hover:opacity-100"
                                                            title="Excluir álbum"
                                                        >
                                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                            </svg>
                                                        </button>
                                                    </div>

                                                    <div className="flex justify-between items-center text-sm text-muted-foreground">
                                                        <span className="flex items-center">
                                                            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                                                            </svg>
                                                            {getAlbumSizeText(album.albumSize)}
                                                        </span>
                                                        <span className="flex items-center">
                                                            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                                            </svg>
                                                            {album._count?.pages || 0} páginas
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                            )}
                        </div>
                    ))}

                    {ungrouped.length > 0 && (
                        <div className="space-y-4">
                            {Object.keys(grouped).length > 0 && (
                                <div className="flex items-center space-x-3 mb-4">
                                    <div className="p-2 bg-purple-100 rounded-lg">
                                        <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                        </svg>
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-semibold">Álbuns Individuais</h3>
                                        <p className="text-sm text-muted-foreground">
                                            {ungrouped.length} álbum{ungrouped.length !== 1 ? 's' : ''}
                                        </p>
                                    </div>
                                </div>
                            )}

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {ungrouped.map((album) => (
                                    <Link key={album.id} href={`/albums/${album.id}`}>
                                        <div className="rounded-xl border bg-card hover:bg-accent/50 transition-colors group cursor-pointer">
                                            {album.photos && album.photos.length > 0 && (
                                                <div className="flex gap-1 h-32 overflow-hidden rounded-t-xl bg-gray-100">
                                                    {album.photos.slice(0, 3).map((photo) => (
                                                        <img
                                                            key={photo.id}
                                                            src={photo.thumbnailUrl}
                                                            alt={photo.filename}
                                                            className="object-cover h-full w-full max-w-[33%] group-hover:scale-105 transition-transform duration-300"
                                                            loading="lazy"
                                                        />
                                                    ))}
                                                </div>
                                            )}
                                            <div className="p-4">
                                                <div className="flex justify-between items-start mb-3">
                                                    <h3 className="font-semibold text-lg truncate group-hover:text-primary transition-colors">
                                                        {album.name}
                                                    </h3>
                                                    <button
                                                        onClick={(e) => {
                                                            e.preventDefault()
                                                            e.stopPropagation()
                                                            handleDeleteClick(album)
                                                        }}
                                                        className="p-1 text-muted-foreground hover:text-destructive transition-colors opacity-0 group-hover:opacity-100"
                                                        title="Excluir álbum"
                                                    >
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                        </svg>
                                                    </button>
                                                </div>

                                                <div className="flex justify-between items-center text-sm text-muted-foreground">
                                                    <span className="flex items-center">
                                                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                                                        </svg>
                                                        {getAlbumSizeText(album.albumSize)}
                                                    </span>
                                                    <span className="flex items-center">
                                                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                                        </svg>
                                                        {album._count?.pages || 0} páginas
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {deleteModalOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-background rounded-xl border p-6 max-w-md w-full mx-4">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-2 bg-destructive/10 rounded-lg">
                                <svg className="w-5 h-5 text-destructive" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                                </svg>
                            </div>
                            <div>
                                <h3 className="text-lg font-semibold">Confirmar Exclusão</h3>
                                <p className="text-sm text-muted-foreground">Esta ação não pode ser desfeita</p>
                            </div>
                        </div>

                        <div className="text-sm mb-6 space-y-3">
                            <p>
                                Tem certeza que deseja excluir o álbum <strong>&quot;{albumToDelete?.name}&quot;</strong>?
                            </p>

                            <div className="bg-muted/50 rounded-lg p-3 space-y-2">
                                <p className="font-medium text-destructive">Esta ação irá:</p>
                                <ul className="text-xs space-y-1 text-muted-foreground">
                                    <li className="flex items-center gap-2">
                                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                        </svg>
                                        Excluir permanentemente o álbum e todas as páginas
                                    </li>
                                    <li className="flex items-center gap-2">
                                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                        </svg>
                                        Remover todas as fotos armazenadas no S3
                                    </li>
                                    <li className="flex items-center gap-2">
                                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                        </svg>
                                        Apagar todas as configurações e metadados
                                    </li>
                                </ul>
                            </div>

                            <p className="text-xs text-muted-foreground">
                                <strong>Atenção:</strong> Esta ação não pode ser desfeita e todos os dados serão perdidos permanentemente.
                            </p>
                        </div>

                        <div className="flex gap-3 justify-end">
                            <Button
                                variant="outline"
                                onClick={() => {
                                    setDeleteModalOpen(false)
                                    setAlbumToDelete(null)
                                }}
                                disabled={isDeleting}
                            >
                                Cancelar
                            </Button>
                            <Button
                                variant="destructive"
                                onClick={handleDeleteConfirm}
                                disabled={isDeleting}
                            >
                                {isDeleting ? 'Excluindo...' : 'Excluir Álbum'}
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Group Confirmation Modal */}
            {deleteGroupModalOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-background rounded-xl border p-6 max-w-md w-full mx-4">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-2 bg-destructive/10 rounded-lg">
                                <svg className="w-5 h-5 text-destructive" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                                </svg>
                            </div>
                            <div>
                                <h3 className="text-lg font-semibold">Confirmar Exclusão do Grupo</h3>
                                <p className="text-sm text-muted-foreground">Esta ação não pode ser desfeita</p>
                            </div>
                        </div>

                        <div className="text-sm mb-6 space-y-3">
                            <p>
                                Tem certeza que deseja excluir todos os álbuns do grupo <strong>&quot;{groupToDelete}&quot;</strong>?
                            </p>

                            <div className="bg-muted/50 rounded-lg p-3 space-y-2">
                                <p className="font-medium text-destructive">Esta ação irá:</p>
                                <ul className="text-xs space-y-1 text-muted-foreground">
                                    <li className="flex items-center gap-2">
                                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                        </svg>
                                        Excluir permanentemente todos os álbuns do grupo
                                    </li>
                                </ul>
                            </div>

                            <p className="text-xs text-muted-foreground">
                                <strong>Atenção:</strong> Esta ação não pode ser desfeita e todos os dados serão perdidos permanentemente.
                            </p>
                        </div>

                        <div className="flex gap-3 justify-end">
                            <Button
                                variant="outline"
                                onClick={() => {
                                    setDeleteGroupModalOpen(false)
                                    setGroupToDelete(null)
                                }}
                                disabled={isDeletingGroup}
                            >
                                Cancelar
                            </Button>
                            <Button
                                variant="destructive"
                                onClick={handleDeleteGroupConfirm}
                                disabled={isDeletingGroup}
                            >
                                {isDeletingGroup ? 'Excluindo...' : 'Excluir Grupo'}
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
