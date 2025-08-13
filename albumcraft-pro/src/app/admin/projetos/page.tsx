'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AdminProtectedRoute } from '@/components/AdminProtectedRoute';
import { AdminNavbar } from '@/components/AdminNavbar';
import CreateAlbumModal from '@/components/CreateAlbumModal';
import AlbumCreationTypeModal from '@/components/AlbumCreationTypeModal';
import CreateMultipleAlbumsModal from '@/components/CreateMultipleAlbumsModal';
import { 
  FolderOpen, 
  Trash2,
  Eye,
  Plus,
  Search,
  Filter,
  ChevronDown,
  ChevronRight,
  Users
} from 'lucide-react';

interface Project {
  id: string;
  name: string;
  description: string | null;
  status: string;
  albumSize: string;
  template: string;
  creationType: 'SINGLE' | 'BATCH';
  group: string | null;
  eventName: string | null;
  createdAt: string;
  user: {
    id: string;
    email: string;
    name: string;
  };
  _count: {
    pages: number;
    photos: number;
  };
}

export default function AdminProjectsPage() {
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [activeTab, setActiveTab] = useState<'SINGLE' | 'BATCH'>('SINGLE'); // Nova state para controlar a aba ativa
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set()); // Estado para controlar grupos expandidos
  const [isProjectTypeModalOpen, setIsProjectTypeModalOpen] = useState(false);
  const [isCreateProjectModalOpen, setIsCreateProjectModalOpen] = useState(false);
  const [isCreateMultipleProjectsModalOpen, setIsCreateMultipleProjectsModalOpen] = useState(false);

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/albums');
      if (response.ok) {
        const data = await response.json();
        setProjects(data.albums);
      }
    } catch (error) {
      console.error('Erro ao carregar projetos:', error);
    } finally {
      setLoading(false);
    }
  };

  // Função para filtrar projetos
  const filteredProjects = projects.filter(project => {
    // Filtro por termo de busca
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      const matchesBasic = project.name.toLowerCase().includes(searchLower) ||
                          project.user.name.toLowerCase().includes(searchLower) ||
                          project.user.email.toLowerCase().includes(searchLower);
      
      const matchesBatch = project.creationType === 'BATCH' && (
        (project.group && project.group.toLowerCase().includes(searchLower)) ||
        (project.eventName && project.eventName.toLowerCase().includes(searchLower))
      );
      
      if (!matchesBasic && !matchesBatch) {
        return false;
      }
    }

    // Filtro por status
    if (statusFilter !== 'ALL' && project.status !== statusFilter) {
      return false;
    }

    return true;
  });

  const deleteProject = async (projectId: string) => {
    if (!confirm('Tem certeza que deseja deletar este projeto?')) return;
    
    try {
      const response = await fetch(`/api/admin/albums/${projectId}`, {
        method: 'DELETE'
      });
      
      if (response.ok) {
        setProjects(projects.filter(project => project.id !== projectId));
      } else {
        alert('Erro ao deletar projeto');
      }
    } catch (error) {
      console.error('Erro ao deletar projeto:', error);
    }
  };

  const handleCreateProjectClick = () => {
    setIsProjectTypeModalOpen(true);
  };

  const handleProjectTypeSelect = (type: 'single' | 'multiple') => {
    setIsProjectTypeModalOpen(false);
    if (type === 'single') {
      setIsCreateProjectModalOpen(true);
    } else {
      setIsCreateMultipleProjectsModalOpen(true);
    }
  };

  const handleCloseAllModals = () => {
    setIsProjectTypeModalOpen(false);
    setIsCreateProjectModalOpen(false);
    setIsCreateMultipleProjectsModalOpen(false);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'DRAFT': return 'bg-yellow-100 text-yellow-800';
      case 'IN_PROGRESS': return 'bg-blue-100 text-blue-800';
      case 'COMPLETED': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'DRAFT': return 'Rascunho';
      case 'IN_PROGRESS': return 'Em Progresso';
      case 'COMPLETED': return 'Concluído';
      default: return status;
    }
  };

  const uniqueStatuses = Array.from(new Set(projects.map(p => p.status)));

  // Função para agrupar projetos múltiplos por grupo
  const groupMultipleProjects = (projects: Project[]) => {
    const groups: { [key: string]: Project[] } = {};
    
    projects.filter(p => p.creationType === 'BATCH').forEach(project => {
      const groupKey = project.group || 'Sem Grupo';
      if (!groups[groupKey]) {
        groups[groupKey] = [];
      }
      groups[groupKey].push(project);
    });
    
    return groups;
  };

  // Função para alternar expansão de grupo
  const toggleGroupExpansion = (groupName: string) => {
    const newExpandedGroups = new Set(expandedGroups);
    if (newExpandedGroups.has(groupName)) {
      newExpandedGroups.delete(groupName);
    } else {
      newExpandedGroups.add(groupName);
    }
    setExpandedGroups(newExpandedGroups);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando projetos...</p>
        </div>
      </div>
    );
  }

  return (
    <AdminProtectedRoute>
      <div className="min-h-screen bg-gray-50">
        <AdminNavbar activeTab="albums" onTabChange={() => {}} />
        
        <div className="lg:pl-64">
          <main className="py-6">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="mb-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center">
                      <FolderOpen className="h-6 w-6 mr-2" />
                      Gerenciar Projetos
                    </h1>
                    <p className="text-gray-600 mt-1">
                      Visualize e gerencie todos os projetos da plataforma
                    </p>
                  </div>
                  <Button
                    onClick={handleCreateProjectClick}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Criar Projeto
                  </Button>
                </div>
              </div>

              {/* Filtros */}
              <Card className="mb-6">
                <CardContent className="pt-6">
                  <div className="flex flex-col sm:flex-row gap-4">
                    <div className="flex-1">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                        <input
                          type="text"
                          placeholder="Buscar por nome, usuário, grupo ou evento..."
                          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                        />
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <div className="sm:w-48">
                        <select
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          value={statusFilter}
                          onChange={(e) => setStatusFilter(e.target.value)}
                        >
                          <option value="ALL">Todos os Status</option>
                          {uniqueStatuses.map(status => (
                            <option key={status} value={status}>
                              {getStatusLabel(status)}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Navegação por Abas */}
              <div className="mb-6">
                <div className="border-b border-gray-200">
                  <nav className="-mb-px flex space-x-8">
                    <button
                      onClick={() => setActiveTab('SINGLE')}
                      className={`py-2 px-1 border-b-2 font-medium text-sm ${
                        activeTab === 'SINGLE'
                          ? 'border-blue-500 text-blue-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                        Álbuns Solo
                        <span className="bg-gray-100 text-gray-600 py-1 px-2 rounded-full text-xs">
                          {projects.filter(p => p.creationType === 'SINGLE').length}
                        </span>
                      </div>
                    </button>
                    <button
                      onClick={() => setActiveTab('BATCH')}
                      className={`py-2 px-1 border-b-2 font-medium text-sm ${
                        activeTab === 'BATCH'
                          ? 'border-purple-500 text-purple-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                        Álbuns Múltiplos
                        <span className="bg-gray-100 text-gray-600 py-1 px-2 rounded-full text-xs">
                          {projects.filter(p => p.creationType === 'BATCH').length}
                        </span>
                      </div>
                    </button>
                  </nav>
                </div>
              </div>

              {/* Seção Ativa */}
              <div className="mb-8">
                {activeTab === 'SINGLE' ? (
                  // Tabela para álbuns solo
                  <Card>
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Projeto
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Usuário
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Status
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Páginas/Fotos
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Criado em
                            </th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Ações
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {filteredProjects.filter(p => p.creationType === 'SINGLE').length === 0 ? (
                            <tr>
                              <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                                Nenhum álbum solo encontrado
                              </td>
                            </tr>
                          ) : (
                            filteredProjects.filter(p => p.creationType === 'SINGLE').map((project) => (
                              <tr key={project.id} className="hover:bg-gray-50">
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <div>
                                    <div className="text-sm font-medium text-gray-900">
                                      {project.name}
                                    </div>
                                    <div className="text-sm text-gray-500">
                                      {project.albumSize} • {project.template}
                                    </div>
                                  </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <div>
                                    <div className="text-sm font-medium text-gray-900">
                                      {project.user.name}
                                    </div>
                                    <div className="text-sm text-gray-500">
                                      {project.user.email}
                                    </div>
                                  </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadgeColor(project.status)}`}>
                                    {getStatusLabel(project.status)}
                                  </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                  {project._count.pages} páginas • {project._count.photos} fotos
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                  {formatDate(project.createdAt)}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                  <div className="flex justify-end space-x-2">
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => router.push(`/admin/projetos/${project.id}`)}
                                    >
                                      <Eye className="h-4 w-4" />
                                    </Button>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => deleteProject(project.id)}
                                      className="text-red-600 hover:text-red-900"
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </div>
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </Card>
                ) : (
                  // Exibição agrupada para álbuns múltiplos
                  <div className="space-y-4">
                    {(() => {
                      const groupedProjects = groupMultipleProjects(filteredProjects);
                      const groupNames = Object.keys(groupedProjects);
                      
                      if (groupNames.length === 0) {
                        return (
                          <Card>
                            <CardContent className="py-8 text-center text-gray-500">
                              Nenhum álbum múltiplo encontrado
                            </CardContent>
                          </Card>
                        );
                      }
                      
                      return groupNames.map(groupName => {
                        const groupProjects = groupedProjects[groupName];
                        const isExpanded = expandedGroups.has(groupName);
                        const totalProjects = groupProjects.length;
                        const totalPhotos = groupProjects.reduce((sum, p) => sum + p._count.photos, 0);
                        
                        return (
                          <Card key={groupName} className="overflow-hidden">
                            {/* Cabeçalho do Grupo */}
                            <div 
                              className="px-6 py-4 bg-purple-50 border-b cursor-pointer hover:bg-purple-100 transition-colors"
                              onClick={() => toggleGroupExpansion(groupName)}
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-3">
                                  <div className="flex items-center space-x-2">
                                    {isExpanded ? (
                                      <ChevronDown className="h-5 w-5 text-purple-600" />
                                    ) : (
                                      <ChevronRight className="h-5 w-5 text-purple-600" />
                                    )}
                                    <Users className="h-5 w-5 text-purple-600" />
                                  </div>
                                  <div>
                                    <h3 className="text-lg font-semibold text-purple-900">
                                      {groupName}
                                    </h3>
                                    <p className="text-sm text-purple-700">
                                      {totalProjects} álbuns • {totalPhotos} fotos
                                    </p>
                                  </div>
                                </div>
                                <div className="text-sm text-purple-600">
                                  {isExpanded ? 'Clique para recolher' : 'Clique para expandir'}
                                </div>
                              </div>
                            </div>
                            
                            {/* Lista de Projetos do Grupo */}
                            {isExpanded && (
                              <div className="divide-y divide-gray-200">
                                {groupProjects.map((project) => (
                                  <div key={project.id} className="px-6 py-4 hover:bg-gray-50">
                                    <div className="flex items-center justify-between">
                                      <div className="flex-1">
                                        <div className="flex items-start justify-between">
                                          <div className="flex-1">
                                            <h4 className="text-sm font-medium text-gray-900">
                                              {project.name}
                                            </h4>
                                            <div className="mt-1 text-sm text-gray-500">
                                              {project.albumSize} • {project.template}
                                            </div>
                                            <div className="mt-1 text-sm text-gray-600">
                                              Usuário: {project.user.name} ({project.user.email})
                                            </div>
                                            {project.eventName && (
                                              <div className="mt-1 text-sm text-gray-500">
                                                Evento: {project.eventName}
                                              </div>
                                            )}
                                          </div>
                                          <div className="ml-4 flex items-center space-x-4">
                                            <div className="text-right">
                                              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadgeColor(project.status)}`}>
                                                {getStatusLabel(project.status)}
                                              </span>
                                              <div className="mt-1 text-xs text-gray-500">
                                                {project._count.pages} páginas • {project._count.photos} fotos
                                              </div>
                                              <div className="mt-1 text-xs text-gray-500">
                                                {formatDate(project.createdAt)}
                                              </div>
                                            </div>
                                            <div className="flex space-x-2">
                                              <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => router.push(`/admin/projetos/${project.id}`)}
                                              >
                                                <Eye className="h-4 w-4" />
                                              </Button>
                                              <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => deleteProject(project.id)}
                                                className="text-red-600 hover:text-red-900"
                                              >
                                                <Trash2 className="h-4 w-4" />
                                              </Button>
                                            </div>
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </Card>
                        );
                      });
                    })()}
                  </div>
                )}
              </div>
            </div>
          </main>
        </div>
      </div>

      {/* Modals */}
      <AlbumCreationTypeModal
        isOpen={isProjectTypeModalOpen}
        onClose={handleCloseAllModals}
        onSelectType={handleProjectTypeSelect}
      />
      
      <CreateAlbumModal
        isOpen={isCreateProjectModalOpen}
        onClose={handleCloseAllModals}
        onAlbumCreated={loadProjects}
      />
      
      <CreateMultipleAlbumsModal
        isOpen={isCreateMultipleProjectsModalOpen}
        onClose={handleCloseAllModals}
        onAlbumsCreated={loadProjects}
      />
    </AdminProtectedRoute>
  );
}