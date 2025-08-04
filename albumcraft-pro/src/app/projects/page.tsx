'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useProtectedRoute } from '@/hooks/useAuth'
import { getAlbumSizeByIdWithFallback, formatSizeDisplay } from '@/lib/album-sizes'

interface Project {
  id: string
  name: string
  description?: string
  albumSize: string
  status: string
  creationType: string
  group?: string
  createdAt: string
  updatedAt: string
  photos?: Array<{
    id: string
    filename: string
    thumbnailUrl: string
  }>
  _count: {
    pages: number
  }
}

export default function ProjectsPage() {
  const { logout } = useProtectedRoute()
  const [projects, setProjects] = useState<Project[]>([])
  const [filteredProjects, setFilteredProjects] = useState<Project[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [creationTypeFilter, setCreationTypeFilter] = useState('ALL')
  const [sortBy, setSortBy] = useState('updatedAt')
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [projectToDelete, setProjectToDelete] = useState<Project | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set())
  const [viewMode, setViewMode] = useState<'list' | 'groups'>('list')
  const [deleteGroupModalOpen, setDeleteGroupModalOpen] = useState(false)
  const [groupToDelete, setGroupToDelete] = useState<string | null>(null)
  const [isDeletingGroup, setIsDeletingGroup] = useState(false)

  const fetchProjects = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/projects?limit=1000');
      if (response.ok) {
        const data = await response.json();
        setProjects(data.data || []);
      } else {
        setError('Erro ao carregar projetos');
      }
    } catch (error: unknown) {
      console.error('Erro ao buscar projetos:', error);
      setError('Erro ao carregar projetos');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const filterAndSortProjects = useCallback(() => {
    const filtered = projects.filter(project => {
      const matchesSearch = project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           project.description?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'ALL' || project.status === statusFilter;
      const matchesCreationType = creationTypeFilter === 'ALL' || project.creationType === creationTypeFilter;
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

    setFilteredProjects(filtered);
  }, [projects, searchTerm, statusFilter, creationTypeFilter, sortBy]);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  useEffect(() => {
    filterAndSortProjects();
  }, [filterAndSortProjects]);

  const handleLogout = async () => {
    await logout()
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return 'bg-green-50 text-green-700 border-green-200'
      case 'IN_PROGRESS':
        return 'bg-blue-50 text-blue-700 border-blue-200'
      default:
        return 'bg-gray-50 text-gray-700 border-gray-200'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return 'Concluído'
      case 'IN_PROGRESS':
        return 'Finalizado'
      default:
        return 'Em Andamento'
    }
  }

  const getAlbumSizeText = (size: string) => {
    const albumSize = getAlbumSizeByIdWithFallback(size)
    return formatSizeDisplay(albumSize)
  }

  const getStatusCount = (status: string) => {
    if (status === 'ALL') return projects.length
    return projects.filter(p => p.status === status).length
  }

  const getCreationTypeCount = (creationType: string) => {
    if (creationType === 'ALL') return projects.length
    return projects.filter(p => p.creationType === creationType).length
  }

  const handleDeleteClick = (project: Project) => {
    setProjectToDelete(project)
    setDeleteModalOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (!projectToDelete) return

    setIsDeleting(true)
    try {
      const response = await fetch(`/api/projects/${projectToDelete.id}`, {
        method: 'DELETE',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || 'Erro ao excluir álbum')
      }

      setProjects(prev => prev.filter(p => p.id !== projectToDelete.id))
      setDeleteModalOpen(false)
      setProjectToDelete(null)
    } catch (error) {
      console.error('Erro ao excluir álbum:', error)
    } finally {
      setIsDeleting(false)
    }
  }

  const handleDeleteCancel = () => {
    setDeleteModalOpen(false)
    setProjectToDelete(null)
  }

  const handleDeleteGroupClick = (groupName: string) => {
    setGroupToDelete(groupName)
    setDeleteGroupModalOpen(true)
  }

  const handleDeleteGroupConfirm = async () => {
    if (!groupToDelete) return

    setIsDeletingGroup(true)
    try {
      const projectsToDelete = projects.filter(p => p.group === groupToDelete)
      
      for (const project of projectsToDelete) {
        const response = await fetch(`/api/projects/${project.id}`, {
          method: 'DELETE',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
        })

        if (!response.ok) {
          throw new Error(`Erro ao excluir álbum ${project.name}`)
        }
      }

      setProjects(prev => prev.filter(p => p.group !== groupToDelete))
      setDeleteGroupModalOpen(false)
      setGroupToDelete(null)
    } catch (error) {
      console.error('Erro ao excluir grupo:', error)
    } finally {
      setIsDeletingGroup(false)
    }
  }

  const handleDeleteGroupCancel = () => {
    setDeleteGroupModalOpen(false)
    setGroupToDelete(null)
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

  const getGroupedProjects = () => {
    const grouped: { [key: string]: Project[] } = {}
    const ungrouped: Project[] = []

    filteredProjects.forEach(project => {
      if (project.group) {
        if (!grouped[project.group]) {
          grouped[project.group] = []
        }
        grouped[project.group].push(project)
      } else {
        ungrouped.push(project)
      }
    })

    return { grouped, ungrouped }
  }

  const getGroupCount = (groupName: string) => {
    return projects.filter(p => p.group === groupName).length
  }

  useEffect(() => {
    const hasGroups = projects.some(p => p.group)
    if (hasGroups && viewMode === 'list') {
      setViewMode('groups')
    }
  }, [projects, viewMode])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando álbuns...</p>
        </div>
      </div>
    )
  }

  const { grouped, ungrouped } = getGroupedProjects()

  return (
    <div className="min-h-screen bg-background">
      <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <Link href="/dashboard" className="flex items-center">
              <h1 className="text-xl font-semibold tracking-tight">AlbumCraft Pro</h1>
            </Link>
            
            {/* Navigation Links */}
            <div className="hidden md:flex items-center space-x-8">
              <Link 
                href="/dashboard" 
                className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                Dashboard
              </Link>
              <Link 
                href="/projects" 
                className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                Meus Álbuns
              </Link>
              <Link 
                href="/profile" 
                className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                Perfil
              </Link>
              <button
                onClick={handleLogout}
                className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                Sair
              </button>
            </div>

            {/* Mobile menu button */}
            <div className="md:hidden">
              <button
                onClick={handleLogout}
                className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                Sair
              </button>
            </div>
          </div>
        </div>
      </nav>

      {error && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-lg">
            {error}
          </div>
        </div>
      )}

      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Meus Álbuns</h1>
            <p className="text-muted-foreground mt-2">
              Gerencie seus projetos de álbuns
            </p>
          </div>
          <Link href="/projects/new">
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

        {filteredProjects.length === 0 ? (
          <div className="text-center py-12">
            <div className="mx-auto w-24 h-24 bg-muted rounded-full flex items-center justify-center mb-4">
              <svg className="w-12 h-12 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold mb-2">Nenhum álbum encontrado</h3>
            <p className="text-muted-foreground mb-6">
              {projects.length === 0 
                ? 'Comece criando seu primeiro álbum de fotos.'
                : 'Tente ajustar os filtros de busca.'
              }
            </p>
            {projects.length === 0 && (
              <Link href="/projects/new">
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
                    {grouped[groupName].map((project) => (
                      <Link key={project.id} href={`/projects/${project.id}`}>
                        <div className="rounded-xl border bg-card hover:bg-accent/50 transition-colors group cursor-pointer">
                          {project.photos && project.photos.length > 0 && (
                            <div className="flex gap-1 h-32 overflow-hidden rounded-t-xl bg-gray-100">
                              {project.photos.slice(0, 3).map((photo) => (
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
                                {project.name}
                              </h3>
                              <button
                                onClick={(e) => {
                                  e.preventDefault()
                                  e.stopPropagation()
                                  handleDeleteClick(project)
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
                                {getAlbumSizeText(project.albumSize)}
                              </span>
                              <span className="flex items-center">
                                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                                {project._count?.pages || 0} páginas
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
                  {ungrouped.map((project) => (
                    <Link key={project.id} href={`/projects/${project.id}`}>
                      <div className="rounded-xl border bg-card hover:bg-accent/50 transition-colors group cursor-pointer">
                        {project.photos && project.photos.length > 0 && (
                          <div className="flex gap-1 h-32 overflow-hidden rounded-t-xl bg-gray-100">
                            {project.photos.slice(0, 3).map((photo) => (
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
                              {project.name}
                            </h3>
                            <button
                              onClick={(e) => {
                                e.preventDefault()
                                e.stopPropagation()
                                handleDeleteClick(project)
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
                              {getAlbumSizeText(project.albumSize)}
                            </span>
                            <span className="flex items-center">
                              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                              </svg>
                              {project._count?.pages || 0} páginas
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

        {filteredProjects.length > 0 && (
          <div className="mt-8 text-center text-sm text-muted-foreground">
            Mostrando {filteredProjects.length} de {projects.length} álbuns
          </div>
        )}
      </main>

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
                Tem certeza que deseja excluir o álbum <strong>&quot;{projectToDelete?.name}&quot;</strong>?
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
                onClick={handleDeleteCancel}
                disabled={isDeleting}
              >
                Cancelar
              </Button>
              <Button
                variant="destructive"
                onClick={handleDeleteConfirm}
                disabled={isDeleting}
              >
                {isDeleting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                    Excluindo...
                  </>
                ) : (
                  'Excluir Álbum'
                )}
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
                onClick={handleDeleteGroupCancel}
                disabled={isDeletingGroup}
              >
                Cancelar
              </Button>
              <Button
                variant="destructive"
                onClick={handleDeleteGroupConfirm}
                disabled={isDeletingGroup}
              >
                {isDeletingGroup ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                    Excluindo...
                  </>
                ) : (
                  'Excluir Grupo'
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}