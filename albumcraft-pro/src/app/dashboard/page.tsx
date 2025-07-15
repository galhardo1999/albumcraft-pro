'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface Project {
  id: string
  name: string
  description?: string
  albumSize: string
  status: string
  createdAt: string
  updatedAt: string
  _count: {
    pages: number
  }
}

interface DashboardStats {
  totalProjects: number
  activeProjects: number
  totalPhotos: number
  storageUsed: string
}

export default function DashboardPage() {
  const [projects, setProjects] = useState<Project[]>([])
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const router = useRouter()

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      setIsLoading(true)
      
      // Buscar projetos
      const projectsResponse = await fetch('/api/projects', {
        credentials: 'include'
      })
      
      if (!projectsResponse.ok) {
        throw new Error('Erro ao carregar projetos')
      }
      
      const projectsData = await projectsResponse.json()
      setProjects(projectsData.data || [])
      
      // Buscar estatísticas
      const statsResponse = await fetch('/api/dashboard/stats', {
        credentials: 'include'
      })
      
      if (statsResponse.ok) {
        const statsData = await statsResponse.json()
        setStats(statsData.data)
      }
      
    } catch (err) {
      setError('Erro ao carregar dados do dashboard')
      console.error('Dashboard error:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include'
      })
      
      // Remover token do cookie
      document.cookie = 'auth-token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;'
      
      router.push('/auth/login')
    } catch (err) {
      console.error('Logout error:', err)
    }
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
        return 'Em Progresso'
      default:
        return 'Rascunho'
    }
  }

  const getAlbumSizeText = (size: string) => {
    switch (size) {
      case 'SIZE_30X30':
        return '30x30cm'
      case 'SIZE_20X30':
        return '20x30cm'
      default:
        return 'Personalizado'
    }
  }

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
                className="text-sm font-medium text-primary"
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

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {error && (
          <div className="mb-6 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 text-sm">
            {error}
          </div>
        )}

        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-2xl font-semibold tracking-tight mb-2">Dashboard</h1>
          <p className="text-muted-foreground">Gerencie seus álbuns e projetos</p>
        </div>

        {/* Stats Cards */}
        {stats && (
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
                  <p className="text-2xl font-semibold">{stats.storageUsed}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold mb-4">Ações Rápidas</h2>
          <div className="grid grid-cols-1 md:grid-cols-1 gap-4 max-w-md">
            <Link
              href="/projects/new"
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
          </div>
        </div>

        {/* Recent Projects */}
        <div>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-semibold">Álbuns Recentes</h2>
            <Link
              href="/projects"
              className="text-sm font-medium text-primary hover:text-primary/80 transition-colors"
            >
              Ver todos
            </Link>
          </div>

          {projects.length === 0 ? (
            <div className="rounded-xl border bg-card p-8 text-center">
              <div className="p-4 bg-muted/50 rounded-lg w-fit mx-auto mb-4">
                <svg className="w-8 h-8 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold mb-2">Nenhum álbum ainda</h3>
              <p className="text-muted-foreground mb-6">Comece criando seu primeiro projeto de álbum</p>
              <Link
                href="/projects/new"
                className="inline-flex items-center px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-medium"
              >
                Criar Primeiro Álbum
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {projects.slice(0, 6).map((project) => (
                <div key={project.id} className="rounded-xl border bg-card hover:bg-accent/50 transition-colors group">
                  <div className="p-6">
                    <div className="flex justify-between items-start mb-3">
                      <h3 className="font-semibold truncate group-hover:text-primary transition-colors">
                        {project.name}
                      </h3>
                      <span className={`px-2 py-1 text-xs font-medium rounded-md border ${getStatusColor(project.status)}`}>
                        {getStatusText(project.status)}
                      </span>
                    </div>
                    
                    {project.description && (
                      <p className="text-muted-foreground text-sm mb-3 line-clamp-2">
                        {project.description}
                      </p>
                    )}
                    
                    <div className="flex justify-between items-center text-sm text-muted-foreground mb-4">
                      <span>{getAlbumSizeText(project.albumSize)}</span>
                      <span>{project._count?.pages || 0} páginas</span>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-muted-foreground">
                        {new Date(project.updatedAt).toLocaleDateString('pt-BR')}
                      </span>
                      <Link
                        href={`/projects/${project.id}`}
                        className="text-sm font-medium text-primary hover:text-primary/80 transition-colors"
                      >
                        Abrir →
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}