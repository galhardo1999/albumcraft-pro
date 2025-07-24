'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AdminProtectedRoute } from '@/components/AdminProtectedRoute';
import { AdminNavbar } from '@/components/AdminNavbar';
import { 
  BarChart3, 
  TrendingUp,
  Users,
  FolderOpen,
  Image,
  Calendar,
  Download,
  RefreshCw,
  Activity,
  PieChart,
  Filter,
  FileText
} from 'lucide-react';

interface ReportStats {
  overview: {
    totalUsers: number;
    totalProjects: number;
    totalPhotos: number;
    newUsers: number;
    newProjects: number;
    newPhotos: number;
    userGrowthRate: number;
    projectGrowthRate: number;
    photoGrowthRate: number;
    storageUsed: string;
  };
  projectsByStatus: Array<{
    status: string;
    count: number;
  }>;
  usersByPlan: Array<{
    plan: string;
    count: number;
  }>;
  topActiveUsers: Array<{
    id: string;
    name: string;
    email: string;
    plan: string;
    projectCount: number;
    photoCount: number;
  }>;
  recentActivity: Array<{
    id: string;
    type: 'user_created' | 'project_created' | 'photo_uploaded';
    description: string;
    timestamp: string;
    user?: string;
  }>;
}

export default function AdminReportsPage() {
  const [stats, setStats] = useState<ReportStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState('30');
  const [selectedView, setSelectedView] = useState('overview');

  useEffect(() => {
    loadReports();
  }, [selectedPeriod]);

  const loadReports = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/admin/reports?period=${selectedPeriod}`);
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Erro ao carregar relatórios:', error);
    } finally {
      setLoading(false);
    }
  };

  const refreshReports = async () => {
    try {
      setRefreshing(true);
      await loadReports();
    } finally {
      setRefreshing(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getPlanBadgeColor = (plan: string) => {
    switch (plan) {
      case 'FREE': return 'bg-gray-100 text-gray-800 border-gray-300';
      case 'PRO': return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'ENTERPRISE': return 'bg-purple-100 text-purple-800 border-purple-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'DRAFT': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'IN_PROGRESS': return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'COMPLETED': return 'bg-green-100 text-green-800 border-green-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
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

  const getPlanLabel = (plan: string) => {
    switch (plan) {
      case 'FREE': return 'Gratuito';
      case 'PRO': return 'Pro';
      case 'ENTERPRISE': return 'Enterprise';
      default: return plan;
    }
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'user_created': return <Users className="h-4 w-4 text-blue-600" />;
      case 'project_created': return <FolderOpen className="h-4 w-4 text-green-600" />;
      case 'photo_uploaded': return <Image className="h-4 w-4 text-purple-600" />;
      default: return <Activity className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'DRAFT': return <FileText className="h-4 w-4 text-yellow-600" />;
      case 'IN_PROGRESS': return <Activity className="h-4 w-4 text-blue-600" />;
      case 'COMPLETED': return <PieChart className="h-4 w-4 text-green-600" />;
      default: return <Activity className="h-4 w-4 text-gray-600" />;
    }
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('pt-BR').format(num);
  };

  const formatPercentage = (num: number) => {
    return `${num >= 0 ? '+' : ''}${num.toFixed(1)}%`;
  };

  const exportReport = async (type: 'users' | 'projects' | 'complete' | 'activity', format: 'csv' | 'excel' = 'csv') => {
    try {
      const response = await fetch(`/api/admin/reports/export?type=${type}&period=${selectedPeriod}&format=${format}`);
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        const extension = format === 'excel' ? 'xlsx' : 'csv';
        a.download = `relatorio_${type}_${selectedPeriod}dias_${new Date().toISOString().split('T')[0]}.${extension}`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error('Erro ao exportar relatório:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando relatórios...</p>
        </div>
      </div>
    );
  }

  return (
    <AdminProtectedRoute>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <AdminNavbar activeTab="reports" onTabChange={() => {}} />
        
        <div className="lg:pl-64">
          <main className="py-8">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              {/* Header */}
              <div className="mb-8">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                  <div>
                    <h1 className="text-3xl font-bold text-gray-900 flex items-center">
                      <BarChart3 className="h-8 w-8 mr-3 text-blue-600" />
                      Analytics & Relatórios
                    </h1>
                    <p className="text-gray-600 mt-2 text-lg">
                      Dashboard completo com insights e métricas detalhadas
                    </p>
                  </div>
                  
                  <div className="flex flex-col sm:flex-row gap-3">
                    <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                      <SelectTrigger className="w-48">
                        <Calendar className="h-4 w-4 mr-2" />
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="7">Últimos 7 dias</SelectItem>
                        <SelectItem value="30">Últimos 30 dias</SelectItem>
                        <SelectItem value="90">Últimos 90 dias</SelectItem>
                        <SelectItem value="365">Último ano</SelectItem>
                      </SelectContent>
                    </Select>
                    
                    <Button
                      onClick={refreshReports}
                      disabled={refreshing}
                      variant="outline"
                      className="flex items-center"
                    >
                      <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                      Atualizar
                    </Button>
                    
                    <Button 
                      onClick={() => exportReport('complete')}
                      className="bg-blue-600 hover:bg-blue-700 flex items-center"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Exportar Completo
                    </Button>
                  </div>
                </div>
              </div>

              {stats && (
                <>
                  {/* Cards de Estatísticas Principais */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50 to-blue-100">
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-blue-900">Total de Usuários</CardTitle>
                        <Users className="h-5 w-5 text-blue-600" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">{stats.overview.totalUsers}</div>
                        <p className="text-xs text-muted-foreground">
                          +{stats.overview.newUsers} nos últimos {selectedPeriod} dias
                        </p>
                      </CardContent>
                    </Card>

                    <Card className="border-0 shadow-lg bg-gradient-to-br from-green-50 to-green-100">
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-green-900">Total de Projetos</CardTitle>
                        <FolderOpen className="h-5 w-5 text-green-600" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">{stats.overview.totalProjects}</div>
                        <p className="text-xs text-muted-foreground">
                          +{stats.overview.newProjects} nos últimos {selectedPeriod} dias
                        </p>
                      </CardContent>
                    </Card>

                    <Card className="border-0 shadow-lg bg-gradient-to-br from-purple-50 to-purple-100">
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-purple-900">Total de Fotos</CardTitle>
                        <Image className="h-5 w-5 text-purple-600" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">{stats.overview.totalPhotos}</div>
                        <p className="text-xs text-muted-foreground">
                          +{stats.overview.newPhotos} nos últimos {selectedPeriod} dias
                        </p>
                      </CardContent>
                    </Card>

                    <Card className="border-0 shadow-lg bg-gradient-to-br from-orange-50 to-orange-100">
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-orange-900">Armazenamento</CardTitle>
                        <PieChart className="h-5 w-5 text-orange-600" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">
                          {stats.overview.storageUsed}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Armazenamento utilizado
                        </p>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Métricas de Crescimento */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <Card className="border-0 shadow-lg">
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Crescimento de Usuários</CardTitle>
                        <TrendingUp className="h-4 w-4 text-blue-600" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold text-blue-600">
                          {formatPercentage(stats.overview.userGrowthRate)}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Últimos {selectedPeriod} dias
                        </p>
                      </CardContent>
                    </Card>

                    <Card className="border-0 shadow-lg">
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Crescimento de Projetos</CardTitle>
                        <TrendingUp className="h-4 w-4 text-green-600" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold text-green-600">
                          {formatPercentage(stats.overview.projectGrowthRate)}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Últimos {selectedPeriod} dias
                        </p>
                      </CardContent>
                    </Card>

                    <Card className="border-0 shadow-lg">
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Crescimento de Fotos</CardTitle>
                        <TrendingUp className="h-4 w-4 text-purple-600" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold text-purple-600">
                          {formatPercentage(stats.overview.photoGrowthRate)}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Últimos {selectedPeriod} dias
                        </p>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Gráficos e Análises */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                    <Card className="border-0 shadow-lg">
                      <CardHeader>
                        <CardTitle className="flex items-center">
                          <BarChart3 className="h-5 w-5 mr-2 text-blue-600" />
                          Projetos por Status
                        </CardTitle>
                        <CardDescription>Distribuição dos projetos por status atual</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          {stats.projectsByStatus.map((item) => (
                            <div key={item.status} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                              <div className="flex items-center space-x-3">
                                {getStatusIcon(item.status)}
                                <Badge variant="outline" className={getStatusBadgeColor(item.status)}>
                                  {getStatusLabel(item.status)}
                                </Badge>
                              </div>
                              <div className="flex items-center space-x-3">
                                <span className="text-sm font-medium text-gray-900">
                                  {formatNumber(item.count)} projetos
                                </span>
                                <div className="w-24 bg-gray-200 rounded-full h-2">
                                  <div 
                                    className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                                    style={{
                                      width: `${(item.count / stats.overview.totalProjects) * 100}%`
                                    }}
                                  ></div>
                                </div>
                                <span className="text-xs text-gray-500 w-12 text-right">
                                  {((item.count / stats.overview.totalProjects) * 100).toFixed(1)}%
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="border-0 shadow-lg">
                      <CardHeader>
                        <CardTitle className="flex items-center">
                          <PieChart className="h-5 w-5 mr-2 text-green-600" />
                          Usuários por Plano
                        </CardTitle>
                        <CardDescription>Distribuição dos usuários por tipo de plano</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          {stats.usersByPlan.map((item) => (
                            <div key={item.plan} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                              <div className="flex items-center space-x-3">
                                <Users className="h-4 w-4 text-gray-600" />
                                <Badge variant="outline" className={getPlanBadgeColor(item.plan)}>
                                  {getPlanLabel(item.plan)}
                                </Badge>
                              </div>
                              <div className="flex items-center space-x-3">
                                <span className="text-sm font-medium text-gray-900">
                                  {formatNumber(item.count)} usuários
                                </span>
                                <div className="w-24 bg-gray-200 rounded-full h-2">
                                  <div 
                                    className="bg-green-600 h-2 rounded-full transition-all duration-300" 
                                    style={{
                                      width: `${(item.count / stats.overview.totalUsers) * 100}%`
                                    }}
                                  ></div>
                                </div>
                                <span className="text-xs text-gray-500 w-12 text-right">
                                  {((item.count / stats.overview.totalUsers) * 100).toFixed(1)}%
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Usuários Mais Ativos */}
                  {stats.topActiveUsers && stats.topActiveUsers.length > 0 && (
                    <Card className="mb-8 border-0 shadow-lg">
                      <CardHeader>
                        <CardTitle className="flex items-center">
                          <Users className="h-5 w-5 mr-2 text-purple-600" />
                          Usuários Mais Ativos
                        </CardTitle>
                        <CardDescription>
                          Ranking dos usuários com maior atividade na plataforma
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="overflow-x-auto">
                          <table className="w-full">
                            <thead>
                              <tr className="border-b border-gray-200">
                                <th className="text-left p-4 font-semibold text-gray-900">Ranking</th>
                                <th className="text-left p-4 font-semibold text-gray-900">Usuário</th>
                                <th className="text-left p-4 font-semibold text-gray-900">Plano</th>
                                <th className="text-center p-4 font-semibold text-gray-900">Projetos</th>
                                <th className="text-center p-4 font-semibold text-gray-900">Fotos</th>
                                <th className="text-center p-4 font-semibold text-gray-900">Score Total</th>
                              </tr>
                            </thead>
                            <tbody>
                              {stats.topActiveUsers.map((user, index) => (
                                <tr key={user.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                                  <td className="p-4">
                                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-r from-purple-500 to-blue-500 text-white font-bold text-sm">
                                      {index + 1}
                                    </div>
                                  </td>
                                  <td className="p-4">
                                    <div className="flex items-center space-x-3">
                                      <div className="flex-shrink-0">
                                        <div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center">
                                          <span className="text-purple-600 font-semibold">
                                            {user.name.charAt(0).toUpperCase()}
                                          </span>
                                        </div>
                                      </div>
                                      <div>
                                        <div className="font-medium text-gray-900">{user.name}</div>
                                        <div className="text-sm text-gray-500">{user.email}</div>
                                      </div>
                                    </div>
                                  </td>
                                  <td className="p-4">
                                    <Badge variant="outline" className={getPlanBadgeColor(user.plan)}>
                                      {getPlanLabel(user.plan)}
                                    </Badge>
                                  </td>
                                  <td className="p-4 text-center">
                                    <span className="font-semibold text-gray-900">{formatNumber(user.projectCount)}</span>
                                  </td>
                                  <td className="p-4 text-center">
                                    <span className="font-semibold text-gray-900">{formatNumber(user.photoCount)}</span>
                                  </td>
                                  <td className="p-4 text-center">
                                    <div className="flex items-center justify-center space-x-2">
                                      <span className="font-bold text-purple-600">
                                        {formatNumber(user.projectCount + user.photoCount)}
                                      </span>
                                      <div className="w-16 bg-gray-200 rounded-full h-2">
                                        <div 
                                          className="bg-gradient-to-r from-purple-500 to-blue-500 h-2 rounded-full transition-all duration-300" 
                                          style={{
                                            width: `${Math.min(((user.projectCount + user.photoCount) / 100) * 100, 100)}%`
                                          }}
                                        ></div>
                                      </div>
                                    </div>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Atividade Recente */}
                  {stats.recentActivity && stats.recentActivity.length > 0 && (
                    <Card className="mb-8 border-0 shadow-lg">
                      <CardHeader>
                        <CardTitle className="flex items-center">
                          <Activity className="h-5 w-5 mr-2 text-green-600" />
                          Atividade Recente
                        </CardTitle>
                        <CardDescription>
                          Últimas atividades registradas na plataforma
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          {stats.recentActivity.slice(0, 10).map((activity) => (
                            <div key={activity.id} className="flex items-center space-x-4 p-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg border border-gray-200 hover:shadow-md transition-all duration-200">
                              <div className="flex-shrink-0">
                                <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-sm">
                                  {getActivityIcon(activity.type)}
                                </div>
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-900">
                                  {activity.description}
                                </p>
                                {activity.user && (
                                  <p className="text-xs text-gray-600 mt-1">
                                    por <span className="font-medium">{activity.user}</span>
                                  </p>
                                )}
                              </div>
                              <div className="flex-shrink-0">
                                <div className="text-right">
                                  <p className="text-xs text-gray-500">
                                    {formatDate(activity.timestamp)}
                                  </p>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Ações de Exportação */}
                  <Card className="border-0 shadow-lg">
                    <CardHeader>
                      <CardTitle className="flex items-center">
                        <Download className="h-5 w-5 mr-2 text-blue-600" />
                        Exportar Relatórios
                      </CardTitle>
                      <CardDescription>
                        Baixe relatórios detalhados em diferentes formatos para o período selecionado
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <Button
                          onClick={() => exportReport('users')}
                          variant="outline"
                          className="flex items-center justify-center h-12 hover:bg-blue-50 hover:border-blue-300 transition-colors"
                        >
                          <Users className="h-4 w-4 mr-2" />
                          Relatório de Usuários
                        </Button>
                        <Button
                          onClick={() => exportReport('projects')}
                          variant="outline"
                          className="flex items-center justify-center h-12 hover:bg-green-50 hover:border-green-300 transition-colors"
                        >
                          <FolderOpen className="h-4 w-4 mr-2" />
                          Relatório de Projetos
                        </Button>
                        <Button
                          onClick={() => exportReport('activity')}
                          variant="outline"
                          className="flex items-center justify-center h-12 hover:bg-purple-50 hover:border-purple-300 transition-colors"
                        >
                          <Activity className="h-4 w-4 mr-2" />
                          Relatório de Atividades
                        </Button>
                        <Button
                          onClick={() => exportReport('complete')}
                          variant="outline"
                          className="flex items-center justify-center h-12 hover:bg-orange-50 hover:border-orange-300 transition-colors"
                        >
                          <FileText className="h-4 w-4 mr-2" />
                          Relatório Completo
                        </Button>
                      </div>
                      
                      <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                        <div className="flex items-start space-x-3">
                          <div className="flex-shrink-0">
                            <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center">
                              <span className="text-blue-600 text-xs font-bold">i</span>
                            </div>
                          </div>
                          <div>
                            <h4 className="text-sm font-medium text-blue-900 mb-1">Formatos Disponíveis</h4>
                            <p className="text-xs text-blue-700">
                              Os relatórios são exportados em formato CSV por padrão. Para formatos Excel ou PDF, 
                              entre em contato com o suporte técnico.
                            </p>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </>
              )}
            </div>
          </main>
        </div>
      </div>
    </AdminProtectedRoute>
  );
}