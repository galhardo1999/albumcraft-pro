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

  const fetchProjects = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/projects');
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
    // O middleware já garante que só usuários autenticados chegam aqui
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
      })

      if (!response.ok) {
        throw new Error('Erro ao excluir álbum')
      }

      const result = await response.json()

      // Remove o projeto da lista local
      setProjects(prev => prev.filter(p => p.id !== projectToDelete.id))
      setDeleteModalOpen(false)
      setProjectToDelete(null)

      // Mostrar mensagem de sucesso com detalhes do S3
      if (result.s3Result) {
        const { totalFiles, successCount, errorCount, ignoredCount, warnings } = result.s3Result
        
        let message = `Álbum "${projectToDelete.name}" excluído com sucesso!`
        
        if (totalFiles > 0) {
          message += ` ${successCount} arquivo(s) removido(s) do S3.`
          
          if (errorCount > 0) {
            message += ` ${errorCount} arquivo(s) não puderam ser removidos do S3.`
          }
          
          if (ignoredCount > 0) {
            message += ` ${ignoredCount} arquivo(s) já não existiam no S3.`
          }
        } else {
          message += ' Nenhum arquivo encontrado no S3.'
        }

        console.log(message)
        if (warnings && warnings.length > 0) {
          console.warn('Avisos da exclusão S3:', warnings)
        }
      }
    } catch (error) {
      console.error('Erro ao excluir álbum:', error)
      setError('Erro ao excluir álbum. Tente novamente.')
    } finally {
      setIsDeleting(false)
    }
  }

  const handleDeleteCancel = () => {
    setDeleteModalOpen(false)
    setProjectToDelete(null)
  }

  // Funções para gerenciamento de grupos
  const toggleGroup = (groupName: string) => {
    const newExpandedGroups = new Set(expandedGroups)
    if (newExpandedGroups.has(groupName)) {
      newExpandedGroups.delete(groupName)
    } else {
      newExpandedGroups.add(groupName)
    }
    setExpandedGroups(newExpandedGroups)
  }

  const getGroupedProjects = () => {
    const grouped: { [key: string]: Project[] } = {}
    const ungrouped: Project[] = []

    filteredProjects.forEach(project => {
      if (project.group && project.creationType === 'BATCH') {
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

  const getGroupCount = () => {
    const groups = new Set(projects.filter(p => p.group && p.creationType === 'BATCH').map(p => p.group))
    return groups.size
  }

  // Detectar automaticamente se deve mostrar visualização por grupos
  useEffect(() => {
    const hasGroups = projects.some(p => p.group && p.creationType === 'BATCH')
    if (hasGroups && viewMode === 'list') {
      setViewMode('groups')
    }
  }, [projects, viewMode])

  // Mostrar loading apenas para os dados da página
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Navbar */}
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
                className="text-sm font-medium text-primary"
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

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {error && (
          <div className="mb-6 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 text-sm">
            {error}
          </div>
        )}

        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight mb-2">Meus Álbuns</h1>
            <p className="text-muted-foreground">Gerencie todos os seus projetos de álbuns</p>
          </div>
          <Link href="/projects/new">
            <Button>
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Novo Álbum
            </Button>
          </Link>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-7 gap-4 mb-8">
          <div className="rounded-xl border bg-card p-6">
            <div className="flex items-center space-x-4">
              <div className="p-2 bg-primary/10 rounded-lg">
                <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total</p>
                <p className="text-2xl font-semibold">{getStatusCount('ALL')}</p>
              </div>
            </div>
          </div>

          <div className="rounded-xl border bg-card p-6">
            <div className="flex items-center space-x-4">
              <div className="p-2 bg-purple-100 rounded-lg">
                <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Individuais</p>
                <p className="text-2xl font-semibold">{getCreationTypeCount('SINGLE')}</p>
              </div>
            </div>
          </div>

          <div className="rounded-xl border bg-card p-6">
            <div className="flex items-center space-x-4">
              <div className="p-2 bg-orange-100 rounded-lg">
                <svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Em Lote</p>
                <p className="text-2xl font-semibold">{getCreationTypeCount('BATCH')}</p>
              </div>
            </div>
          </div>

          <div className="rounded-xl border bg-card p-6">
            <div className="flex items-center space-x-4">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <svg className="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Grupos</p>
                <p className="text-2xl font-semibold">{getGroupCount()}</p>
              </div>
            </div>
          </div>

          <div className="rounded-xl border bg-card p-6">
            <div className="flex items-center space-x-4">
              <div className="p-2 bg-gray-100 rounded-lg">
                <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Em Andamento</p>
                <p className="text-2xl font-semibold">{getStatusCount('DRAFT')}</p>
              </div>
            </div>
          </div>

          <div className="rounded-xl border bg-card p-6">
            <div className="flex items-center space-x-4">
              <div className="p-2 bg-blue-100 rounded-lg">
                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Finalizados</p>
                <p className="text-2xl font-semibold">{getStatusCount('IN_PROGRESS')}</p>
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
                <p className="text-sm font-medium text-muted-foreground">Concluídos</p>
                <p className="text-2xl font-semibold">{getStatusCount('COMPLETED')}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="rounded-xl border bg-card p-6 mb-8">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <Input
                placeholder="Buscar álbuns..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full"
              />
            </div>

            {/* Filters */}
            <div className="flex gap-2">
              {/* Creation Type Filter */}
              <select
                value={creationTypeFilter}
                onChange={(e) => setCreationTypeFilter(e.target.value)}
                className="px-3 py-2 border rounded-lg bg-background text-sm"
              >
                <option value="ALL">Todos os Tipos</option>
                <option value="SINGLE">Álbuns Individuais</option>
                <option value="BATCH">Álbuns em Lote</option>
              </select>

              {/* Status Filter */}
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 border rounded-lg bg-background text-sm"
              >
                <option value="ALL">Todos os Status</option>
                <option value="DRAFT">Em Andamento</option>
                <option value="IN_PROGRESS">Finalizados</option>
                <option value="COMPLETED">Concluídos</option>
              </select>

              {/* Sort */}
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-3 py-2 border rounded-lg bg-background text-sm"
              >
                <option value="updatedAt">Última Atualização</option>
                <option value="createdAt">Data de Criação</option>
                <option value="name">Nome</option>
              </select>
            </div>
          </div>
        </div>

        {/* Projects Grid */}
        {filteredProjects.length === 0 ? (
          <div className="rounded-xl border bg-card p-12 text-center">
            <div className="p-4 bg-muted/50 rounded-lg w-fit mx-auto mb-4">
              <svg className="w-8 h-8 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold mb-2">
              {searchTerm || statusFilter !== 'ALL' || creationTypeFilter !== 'ALL' ? 'Nenhum álbum encontrado' : 'Nenhum álbum ainda'}
            </h3>
            <p className="text-muted-foreground mb-6">
              {searchTerm || statusFilter !== 'ALL' || creationTypeFilter !== 'ALL'
                ? 'Tente ajustar os filtros de busca' 
                : 'Comece criando seu primeiro projeto de álbum'
              }
            </p>
            {!searchTerm && statusFilter === 'ALL' && creationTypeFilter === 'ALL' && (
              <Link href="/projects/new">
                <Button>
                  Criar Primeiro Álbum
                </Button>
              </Link>
            )}
          </div>
        ) : (
          <div className="space-y-8">
            {(() => {
              const { grouped, ungrouped } = getGroupedProjects()
              
              return (
                <>
                  {/* Grupos */}
                  {Object.entries(grouped).map(([groupName, groupProjects]) => (
                    <div key={groupName} className="space-y-4">
                      {/* Cabeçalho do Grupo */}
                      <div 
                        className="flex items-center justify-between p-4 rounded-xl border bg-card hover:bg-accent/50 transition-colors cursor-pointer"
                        onClick={() => toggleGroup(groupName)}
                      >
                        <div className="flex items-center space-x-3">
                          <div className="p-2 bg-yellow-100 rounded-lg">
                            <svg className="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                            </svg>
                          </div>
                          <div>
                            <h3 className="text-lg font-semibold">{groupName}</h3>
                            <p className="text-sm text-muted-foreground">
                              {groupProjects.length} álbum{groupProjects.length !== 1 ? 's' : ''}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="text-sm text-muted-foreground">
                            {expandedGroups.has(groupName) ? 'Recolher' : 'Expandir'}
                          </span>
                          <svg 
                            className={`w-5 h-5 text-muted-foreground transition-transform ${
                              expandedGroups.has(groupName) ? 'rotate-180' : ''
                            }`} 
                            fill="none" 
                            stroke="currentColor" 
                            viewBox="0 0 24 24"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </div>
                      </div>

                      {/* Álbuns do Grupo */}
                      {expandedGroups.has(groupName) && (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 ml-4">
                          {groupProjects.map((project) => (
                            <div key={project.id} className="rounded-xl border bg-card hover:bg-accent/50 transition-colors group">
                              <div className="p-6">
                                <div className="flex justify-between items-start mb-4">
                                  <h3 className="font-semibold text-lg truncate group-hover:text-primary transition-colors">
                                    {project.name}
                                  </h3>
                                  <div className="flex items-center gap-2">
                                    <span className={`px-2 py-1 text-xs font-medium rounded-md border ${getStatusColor(project.status)}`}>
                                      {getStatusText(project.status)}
                                    </span>
                                    <button
                                      onClick={() => handleDeleteClick(project)}
                                      className="p-1 text-muted-foreground hover:text-destructive transition-colors opacity-0 group-hover:opacity-100"
                                      title="Excluir álbum"
                                    >
                                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                      </svg>
                                    </button>
                                  </div>
                                </div>
                                
                                {project.description && (
                                  <p className="text-muted-foreground text-sm mb-4 line-clamp-2">
                                    {project.description}
                                  </p>
                                )}
                                
                                <div className="flex justify-between items-center text-sm text-muted-foreground mb-4">
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
                                
                                <div className="flex justify-between items-center">
                                  <div className="text-xs text-muted-foreground">
                                    <p>Criado: {new Date(project.createdAt).toLocaleDateString('pt-BR')}</p>
                                    <p>Atualizado: {new Date(project.updatedAt).toLocaleDateString('pt-BR')}</p>
                                  </div>
                                  <Link
                                    href={`/projects/${project.id}`}
                                    className="text-sm font-medium text-primary hover:text-primary/80 transition-colors flex items-center"
                                  >
                                    Abrir
                                    <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                    </svg>
                                  </Link>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}

                  {/* Álbuns Individuais */}
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
                          <div key={project.id} className="rounded-xl border bg-card hover:bg-accent/50 transition-colors group">
                            <div className="p-6">
                              <div className="flex justify-between items-start mb-4">
                                <h3 className="font-semibold text-lg truncate group-hover:text-primary transition-colors">
                                  {project.name}
                                </h3>
                                <div className="flex items-center gap-2">
                                  <span className={`px-2 py-1 text-xs font-medium rounded-md border ${getStatusColor(project.status)}`}>
                                    {getStatusText(project.status)}
                                  </span>
                                  <button
                                    onClick={() => handleDeleteClick(project)}
                                    className="p-1 text-muted-foreground hover:text-destructive transition-colors opacity-0 group-hover:opacity-100"
                                    title="Excluir álbum"
                                  >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                    </svg>
                                  </button>
                                </div>
                              </div>
                              
                              {project.description && (
                                <p className="text-muted-foreground text-sm mb-4 line-clamp-2">
                                  {project.description}
                                </p>
                              )}
                              
                              <div className="flex justify-between items-center text-sm text-muted-foreground mb-4">
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
                              
                              <div className="flex justify-between items-center">
                                <div className="text-xs text-muted-foreground">
                                  <p>Criado: {new Date(project.createdAt).toLocaleDateString('pt-BR')}</p>
                                  <p>Atualizado: {new Date(project.updatedAt).toLocaleDateString('pt-BR')}</p>
                                </div>
                                <Link
                                  href={`/projects/${project.id}`}
                                  className="text-sm font-medium text-primary hover:text-primary/80 transition-colors flex items-center"
                                >
                                  Abrir
                                  <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                  </svg>
                                </Link>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )
            })()}
          </div>
        )}

        {/* Results Summary */}
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
    </div>
  )
}