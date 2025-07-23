'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge'
import { AdminReports } from '@/components/AdminReports';
import { AdminProtectedRoute } from '@/components/AdminProtectedRoute';
import { AdminNavbar } from '@/components/AdminNavbar';
import CreateUserModal from '@/components/CreateUserModal';
import CreateProjectModal from '@/components/CreateProjectModal';
import ProjectCreationTypeModal from '@/components/ProjectCreationTypeModal';
import CreateMultipleProjectsModal from '@/components/CreateMultipleProjectsModal';
import { 
  Users, 
  FolderOpen, 
  Image, 
  TrendingUp, 
  Calendar,
  Settings,
  Trash2,
  Edit,
  Eye,
  Plus
} from 'lucide-react';

interface User {
  id: string;
  email: string;
  name: string;
  plan: string;
  isAdmin: boolean;
  createdAt: string;
  lastLogin: string | null;
  _count: {
    projects: number;
    photos: number;
  };
}

interface Project {
  id: string;
  name: string;
  description: string | null;
  status: string;
  albumSize: string;
  template: string;
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

interface Stats {
  overview: {
    totalUsers: number;
    totalProjects: number;
    totalPhotos: number;
    recentProjects: number;
    recentUsers: number;
  };
  projectsByStatus: Array<{
    status: string;
    _count: { status: number };
  }>;
  usersByPlan: Array<{
    plan: string;
    _count: { plan: number };
  }>;
}

export default function AdminDashboard() {
  const router = useRouter();
  const [stats, setStats] = useState<Stats | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [isCreateUserModalOpen, setIsCreateUserModalOpen] = useState(false);
  const [isCreateProjectModalOpen, setIsCreateProjectModalOpen] = useState(false);
  const [isProjectTypeModalOpen, setIsProjectTypeModalOpen] = useState(false);
  const [isCreateMultipleProjectsModalOpen, setIsCreateMultipleProjectsModalOpen] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Carregar estatísticas
      const statsResponse = await fetch('/api/admin/stats');
      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        setStats(statsData);
      }

      // Carregar usuários
      const usersResponse = await fetch('/api/admin/users');
      if (usersResponse.ok) {
        const usersData = await usersResponse.json();
        setUsers(usersData.users);
      }

      // Carregar projetos
      const projectsResponse = await fetch('/api/admin/projects');
      if (projectsResponse.ok) {
        const projectsData = await projectsResponse.json();
        setProjects(projectsData.projects);
      }
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
  };

  const deleteUser = async (userId: string) => {
    if (!confirm('Tem certeza que deseja deletar este usuário?')) return;
    
    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'DELETE'
      });
      
      if (response.ok) {
        setUsers(users.filter(user => user.id !== userId));
      } else {
        alert('Erro ao deletar usuário');
      }
    } catch (error) {
      console.error('Erro ao deletar usuário:', error);
    }
  };

  const deleteProject = async (projectId: string) => {
    if (!confirm('Tem certeza que deseja deletar este projeto?')) return;
    
    try {
      const response = await fetch(`/api/admin/projects/${projectId}`, {
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

  // Funções para controlar os modais de projeto
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

  const getPlanBadgeColor = (plan: string) => {
    switch (plan) {
      case 'FREE': return 'bg-gray-100 text-gray-800';
      case 'PRO': return 'bg-blue-100 text-blue-800';
      case 'ENTERPRISE': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'DRAFT': return 'bg-yellow-100 text-yellow-800';
      case 'IN_PROGRESS': return 'bg-blue-100 text-blue-800';
      case 'COMPLETED': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <AdminProtectedRoute>
      <div className="min-h-screen bg-gray-50">
        <AdminNavbar activeTab={activeTab} onTabChange={setActiveTab} />
        
        {/* Main content with sidebar offset */}
        <div className="lg:pl-64">
          <main className="py-6">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Visão Geral</TabsTrigger>
            <TabsTrigger value="users">Usuários</TabsTrigger>
            <TabsTrigger value="projects">Projetos</TabsTrigger>
            <TabsTrigger value="reports">Relatórios</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            {stats && (
              <>
                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Total de Usuários</CardTitle>
                      <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{stats.overview.totalUsers}</div>
                      <p className="text-xs text-muted-foreground">
                        +{stats.overview.recentUsers} nos últimos 30 dias
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Total de Projetos</CardTitle>
                      <FolderOpen className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{stats.overview.totalProjects}</div>
                      <p className="text-xs text-muted-foreground">
                        +{stats.overview.recentProjects} nos últimos 30 dias
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Total de Fotos</CardTitle>
                      <Image className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{stats.overview.totalPhotos}</div>
                      <p className="text-xs text-muted-foreground">
                        Armazenadas na plataforma
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Crescimento</CardTitle>
                      <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">
                        {Math.round((stats.overview.recentUsers / stats.overview.totalUsers) * 100)}%
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Novos usuários este mês
                      </p>
                    </CardContent>
                  </Card>
                </div>

                {/* Charts */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Projetos por Status</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {stats.projectsByStatus.map((item) => (
                          <div key={item.status} className="flex items-center justify-between">
                            <span className="text-sm font-medium">{item.status}</span>
                            <Badge className={getStatusBadgeColor(item.status)}>
                              {item._count.status}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Usuários por Plano</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {stats.usersByPlan.map((item) => (
                          <div key={item.plan} className="flex items-center justify-between">
                            <span className="text-sm font-medium">{item.plan}</span>
                            <Badge className={getPlanBadgeColor(item.plan)}>
                              {item._count.plan}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </>
            )}
          </TabsContent>

          {/* Users Tab */}
          <TabsContent value="users" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Usuários Cadastrados</CardTitle>
                    <CardDescription>
                      Gerencie todos os usuários da plataforma
                    </CardDescription>
                  </div>
                  <CreateUserModal onUserCreated={loadData} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-2">Nome</th>
                        <th className="text-left p-2">Email</th>
                        <th className="text-left p-2">Plano</th>
                        <th className="text-left p-2">Projetos</th>
                        <th className="text-left p-2">Fotos</th>
                        <th className="text-left p-2">Cadastro</th>
                        <th className="text-left p-2">Ações</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.map((user) => (
                        <tr key={user.id} className="border-b hover:bg-gray-50">
                          <td className="p-2">
                            <div className="flex items-center space-x-2">
                              <span className="font-medium">{user.name}</span>
                              {user.isAdmin && (
                                <Badge className="bg-red-100 text-red-800">Admin</Badge>
                              )}
                            </div>
                          </td>
                          <td className="p-2 text-gray-600">{user.email}</td>
                          <td className="p-2">
                            <Badge className={getPlanBadgeColor(user.plan)}>
                              {user.plan}
                            </Badge>
                          </td>
                          <td className="p-2">{user._count.projects}</td>
                          <td className="p-2">{user._count.photos}</td>
                          <td className="p-2 text-gray-600">{formatDate(user.createdAt)}</td>
                          <td className="p-2">
                            <div className="flex items-center space-x-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => router.push(`/admin/users/${user.id}`)}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              {!user.isAdmin && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => deleteUser(user.id)}
                                  className="text-red-600 hover:text-red-700"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Projects Tab */}
          <TabsContent value="projects" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Projetos</CardTitle>
                    <CardDescription>
                      Gerencie todos os projetos da plataforma
                    </CardDescription>
                  </div>
                  <Button
                    onClick={handleCreateProjectClick}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Criar Projeto
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-2">Nome</th>
                        <th className="text-left p-2">Usuário</th>
                        <th className="text-left p-2">Status</th>
                        <th className="text-left p-2">Tamanho</th>
                        <th className="text-left p-2">Páginas</th>
                        <th className="text-left p-2">Fotos</th>
                        <th className="text-left p-2">Criado</th>
                        <th className="text-left p-2">Ações</th>
                      </tr>
                    </thead>
                    <tbody>
                      {projects.map((project) => (
                        <tr key={project.id} className="border-b hover:bg-gray-50">
                          <td className="p-2 font-medium">{project.name}</td>
                          <td className="p-2 text-gray-600">{project.user.name}</td>
                          <td className="p-2">
                            <Badge className={getStatusBadgeColor(project.status)}>
                              {project.status}
                            </Badge>
                          </td>
                          <td className="p-2">{project.albumSize}</td>
                          <td className="p-2">{project._count.pages}</td>
                          <td className="p-2">{project._count.photos}</td>
                          <td className="p-2 text-gray-600">{formatDate(project.createdAt)}</td>
                          <td className="p-2">
                            <div className="flex items-center space-x-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => router.push(`/admin/projects/${project.id}`)}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => deleteProject(project.id)}
                                className="text-red-600 hover:text-red-700"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Reports Tab */}
          <TabsContent value="reports" className="space-y-6">
            <AdminReports />
          </TabsContent>
        </Tabs>
            </div>
          </main>
        </div>
      </div>

      {/* Modals */}
      <ProjectCreationTypeModal
        isOpen={isProjectTypeModalOpen}
        onClose={handleCloseAllModals}
        onSelectType={handleProjectTypeSelect}
      />
      
      <CreateProjectModal
        isOpen={isCreateProjectModalOpen}
        onClose={handleCloseAllModals}
        onProjectCreated={loadData}
      />
      
      <CreateMultipleProjectsModal
        isOpen={isCreateMultipleProjectsModalOpen}
        onClose={handleCloseAllModals}
        onProjectsCreated={loadData}
      />
    </AdminProtectedRoute>
  );
}