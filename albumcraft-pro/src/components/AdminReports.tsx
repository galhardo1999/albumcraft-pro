'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  FolderOpen, 
  Image,
  Calendar,
  Download,
  Filter
} from 'lucide-react';

interface ReportData {
  period: number
  overview: {
    totalUsers: number
    totalProjects: number
    totalPhotos: number
    newUsers: number
    newProjects: number
    newPhotos: number
    userGrowthRate: number
    projectGrowthRate: number
  }
  projectsByStatus: Array<{
    status: string
    count: number
  }>
  usersByPlan: Array<{
    plan: string
    count: number
  }>
  topActiveUsers: Array<{
    id: string
    name: string
    email: string
    plan: string
    projectCount: number
    photoCount: number
  }>
}

export function AdminReports() {
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState('30');
  const [selectedReport, setSelectedReport] = useState('overview');

  useEffect(() => {
    loadReportData();
  }, [selectedPeriod]);

  const loadReportData = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/admin/reports?period=${selectedPeriod}`);
      if (response.ok) {
        const data = await response.json();
        setReportData(data);
      }
    } catch (error) {
      console.error('Erro ao carregar dados dos relatórios:', error);
    } finally {
      setLoading(false);
    }
  };

  const exportReport = async (format: 'csv' | 'pdf') => {
    try {
      const response = await fetch(`/api/admin/reports/export?format=${format}&period=${selectedPeriod}&type=${selectedReport}`);
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `relatorio-${selectedReport}-${new Date().toISOString().split('T')[0]}.${format}`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (error) {
      console.error('Erro ao exportar relatório:', error);
    }
  };

  const calculateGrowth = (current: number, previous: number) => {
    if (previous === 0) return current > 0 ? 100 : 0;
    return ((current - previous) / previous) * 100;
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">Relatórios</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="space-y-0 pb-2">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-gray-200 rounded w-1/2 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-full"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (!reportData) {
    return (
      <div className="text-center py-12">
        <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Erro ao carregar relatórios</h3>
        <p className="text-gray-500">Não foi possível carregar os dados dos relatórios.</p>
        <Button onClick={loadReportData} className="mt-4">
          Tentar novamente
        </Button>
      </div>
    );
  }



  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Relatórios</h2>
        <div className="flex items-center space-x-4">
          <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Últimos 7 dias</SelectItem>
              <SelectItem value="30">Últimos 30 dias</SelectItem>
              <SelectItem value="90">Últimos 90 dias</SelectItem>
              <SelectItem value="365">Último ano</SelectItem>
            </SelectContent>
          </Select>
          
          <Select value={selectedReport} onValueChange={setSelectedReport}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="overview">Visão Geral</SelectItem>
              <SelectItem value="users">Relatório de Usuários</SelectItem>
              <SelectItem value="projects">Relatório de Álbuns</SelectItem>
              <SelectItem value="photos">Relatório de Fotos</SelectItem>
            </SelectContent>
          </Select>

          <Button
            variant="outline"
            onClick={() => exportReport('csv')}
            className="flex items-center space-x-2"
          >
            <Download className="h-4 w-4" />
            <span>Exportar CSV</span>
          </Button>

          <Button
            variant="outline"
            onClick={() => exportReport('pdf')}
            className="flex items-center space-x-2"
          >
            <Download className="h-4 w-4" />
            <span>Exportar PDF</span>
          </Button>
        </div>
      </div>

      {/* Métricas Principais */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Novos Usuários</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{reportData.overview.newUsers}</div>
            <p className="text-xs text-muted-foreground">
              <span className={reportData.overview.userGrowthRate >= 0 ? 'text-green-600' : 'text-red-600'}>
                {reportData.overview.userGrowthRate >= 0 ? '+' : ''}{reportData.overview.userGrowthRate.toFixed(1)}%
              </span>
              {' '}em relação ao período anterior
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Novos Projetos</CardTitle>
            <FolderOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{reportData.overview.newProjects}</div>
            <p className="text-xs text-muted-foreground">
              <span className={reportData.overview.projectGrowthRate >= 0 ? 'text-green-600' : 'text-red-600'}>
                {reportData.overview.projectGrowthRate >= 0 ? '+' : ''}{reportData.overview.projectGrowthRate.toFixed(1)}%
              </span>
               {' '}em relação ao período anterior
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Fotos Enviadas</CardTitle>
            <Image className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{reportData.overview.newPhotos}</div>
            <p className="text-xs text-muted-foreground">
              No período de {reportData.period} dias
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taxa de Crescimento</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {((reportData.overview.userGrowthRate + reportData.overview.projectGrowthRate) / 2).toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground">
              Média de crescimento geral
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Gráficos e Tabelas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Projetos por Status */}
        <Card>
          <CardHeader>
            <CardTitle>Projetos por Status</CardTitle>
            <CardDescription>Distribuição dos projetos por status atual</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {reportData.projectsByStatus.map((item) => (
                <div key={item.status} className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className={`w-3 h-3 rounded-full ${
                      item.status === 'COMPLETED' ? 'bg-green-500' :
                      item.status === 'IN_PROGRESS' ? 'bg-blue-500' :
                      'bg-yellow-500'
                    }`}></div>
                    <span className="text-sm font-medium">
                      {item.status === 'COMPLETED' ? 'Concluído' :
                       item.status === 'IN_PROGRESS' ? 'Em Progresso' :
                       'Rascunho'}
                    </span>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-bold">{item.count}</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Usuários por Plano */}
        <Card>
          <CardHeader>
            <CardTitle>Usuários por Plano</CardTitle>
            <CardDescription>Distribuição dos usuários por tipo de plano</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {reportData.usersByPlan.map((item) => (
                <div key={item.plan} className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className={`w-3 h-3 rounded-full ${
                      item.plan === 'ENTERPRISE' ? 'bg-purple-500' :
                      item.plan === 'PRO' ? 'bg-blue-500' :
                      'bg-gray-500'
                    }`}></div>
                    <span className="text-sm font-medium">
                      {item.plan === 'ENTERPRISE' ? 'Enterprise' :
                       item.plan === 'PRO' ? 'Pro' :
                       'Gratuito'}
                    </span>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-bold">{item.count}</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top Usuários */}
      <Card>
        <CardHeader>
          <CardTitle>Usuários Mais Ativos</CardTitle>
          <CardDescription>Usuários com maior número de projetos e fotos</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2">Usuário</th>
                  <th className="text-left py-2">Email</th>
                  <th className="text-center py-2">Projetos</th>
                  <th className="text-center py-2">Fotos</th>
                </tr>
              </thead>
              <tbody>
                {reportData.topActiveUsers.map((user) => (
                  <tr key={user.id} className="border-b">
                    <td className="py-2 font-medium">{user.name}</td>
                    <td className="py-2 text-muted-foreground">{user.email}</td>
                    <td className="py-2 text-center">{user.projectCount}</td>
                    <td className="py-2 text-center">{user.photoCount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}