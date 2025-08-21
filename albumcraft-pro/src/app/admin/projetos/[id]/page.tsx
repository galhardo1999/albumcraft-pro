'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, Save, Trash2, FolderOpen, User, Image, FileText, Calendar, HardDrive, Eye, Download } from 'lucide-react';
import { AdminProtectedRoute } from '@/components/AdminProtectedRoute';
import { AdminNavbar } from '@/components/AdminNavbar';

interface ProjectDetails {
  id: string;
  name: string;
  description: string | null;
  albumSize: string;
  status: string;
  creationType: string;
  group: string | null;
  eventName: string | null;
  pageCount: number | null;
  format: string | null;
  createdAt: string;
  updatedAt: string;
  user: {
    id: string;
    email: string;
    name: string;
  };
  pages: Array<{
    id: string;
    pageNumber: number;
    backgroundColor: string | null;
    backgroundImageUrl: string | null;
    photoPlacement: Array<{
      id: string;
      photo: {
        id: string;
        filename: string;
        thumbnailUrl: string;
      };
    }>;
  }>;
  photos: Array<{
    id: string;
    filename: string;
    thumbnailUrl: string;
    fileSize: number;
    uploadedAt: string;
  }>;
}

export default function ProjectDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const resolvedParams = use(params);
  const [project, setProject] = useState<ProjectDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    status: '',
    albumSize: ''
  });

  useEffect(() => {
    loadProject();
  }, [resolvedParams.id]);

  const loadProject = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/admin/albums/${resolvedParams.id}`);
      
      if (response.ok) {
        const data = await response.json();
        setProject(data.album);
        setFormData({
          name: data.album.name,
        description: data.album.description || '',
        status: data.album.status,
        albumSize: data.album.albumSize
        });
      } else {
        router.push('/admin/projetos');
      }
    } catch (error) {
      console.error('Erro ao carregar projeto:', error);
      router.push('/admin/projetos');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      const response = await fetch(`/api/admin/albums/${resolvedParams.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        const data = await response.json();
        setProject({ ...project!, ...data.album });
        setEditing(false);
      } else {
        alert('Erro ao salvar alterações');
      }
    } catch (error) {
      console.error('Erro ao salvar projeto:', error);
      alert('Erro ao salvar alterações');
    }
  };

  const handleDelete = async () => {
    if (!confirm('Tem certeza que deseja deletar este projeto? Esta ação não pode ser desfeita.')) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/albums/${resolvedParams.id}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        router.push('/admin/projetos');
      } else {
        alert('Erro ao deletar projeto');
      }
    } catch (error) {
      console.error('Erro ao deletar projeto:', error);
      alert('Erro ao deletar projeto');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatFileSize = (bytes: number) => {
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 Bytes';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'DRAFT': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'IN_PROGRESS': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'COMPLETED': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
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

  const getCreationTypeLabel = (type: string) => {
    switch (type) {
      case 'SINGLE': return 'Projeto Individual';
      case 'BATCH': return 'Projeto em Lote';
      default: return type;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando álbum...</p>
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 text-lg mb-4">Álbum não encontrado</p>
          <Button onClick={() => router.push('/admin/projetos')} className="bg-blue-600 hover:bg-blue-700">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar aos Álbuns
          </Button>
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
              {/* Header */}
              <div className="mb-8">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <Button
                      variant="outline"
                      onClick={() => router.push('/admin/projetos')}
                      className="flex items-center"
                    >
                      <ArrowLeft className="h-4 w-4 mr-2" />
                      Voltar
                    </Button>
                    <div>
                      <h1 className="text-3xl font-bold text-gray-900">
                        Detalhes do Projeto
                      </h1>
                      <p className="text-gray-600 mt-1">
                        Visualize e gerencie os detalhes do projeto
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    {editing ? (
                      <>
                        <Button
                          variant="outline"
                          onClick={() => setEditing(false)}
                        >
                          Cancelar
                        </Button>
                        <Button
                          onClick={handleSave}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          <Save className="h-4 w-4 mr-2" />
                          Salvar
                        </Button>
                      </>
                    ) : (
                      <>
                        <Button
                          variant="outline"
                          onClick={() => setEditing(true)}
                        >
                          Editar
                        </Button>
                        <Button
                          variant="outline"
                          onClick={handleDelete}
                          className="text-red-600 hover:text-red-700 border-red-200 hover:border-red-300"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Deletar
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Informações Principais */}
                <div className="lg:col-span-2 space-y-6">
                  {/* Informações Básicas */}
                  <Card className="border-0 shadow-lg">
                    <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-gray-200">
                      <CardTitle className="flex items-center text-blue-900">
                        <FolderOpen className="h-5 w-5 mr-2" />
                        Informações do Projeto
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <Label htmlFor="name" className="text-sm font-medium text-gray-700">
                            Nome do Projeto
                          </Label>
                          {editing ? (
                            <Input
                              id="name"
                              value={formData.name}
                              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                              className="mt-1"
                            />
                          ) : (
                            <p className="mt-1 text-lg font-semibold text-gray-900">{project.name}</p>
                          )}
                        </div>

                        <div>
                          <Label className="text-sm font-medium text-gray-700">
                            Status
                          </Label>
                          {editing ? (
                            <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
                              <SelectTrigger className="mt-1">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="DRAFT">Rascunho</SelectItem>
                                <SelectItem value="IN_PROGRESS">Em Progresso</SelectItem>
                                <SelectItem value="COMPLETED">Concluído</SelectItem>
                              </SelectContent>
                            </Select>
                          ) : (
                            <div className="mt-1">
                              <Badge className={`${getStatusBadgeColor(project.status)} border`}>
                                {getStatusLabel(project.status)}
                              </Badge>
                            </div>
                          )}
                        </div>

                        <div>
                          <Label className="text-sm font-medium text-gray-700">
                            Tamanho do Álbum
                          </Label>
                          {editing ? (
                            <Input
                              value={formData.albumSize}
                              onChange={(e) => setFormData({ ...formData, albumSize: e.target.value })}
                              className="mt-1"
                            />
                          ) : (
                            <p className="mt-1 text-gray-900">{project.albumSize}</p>
                          )}
                        </div>

                        <div>
                          <Label className="text-sm font-medium text-gray-700">
                            Tipo de Criação
                          </Label>
                          <p className="mt-1 text-gray-900">{getCreationTypeLabel(project.creationType)}</p>
                        </div>

                        {project.group && (
                          <div>
                            <Label className="text-sm font-medium text-gray-700">
                              Grupo
                            </Label>
                            <p className="mt-1 text-gray-900">{project.group}</p>
                          </div>
                        )}

                        {project.eventName && (
                          <div>
                            <Label className="text-sm font-medium text-gray-700">
                              Nome do Evento
                            </Label>
                            <p className="mt-1 text-gray-900">{project.eventName}</p>
                          </div>
                        )}

                        <div className="md:col-span-2">
                          <Label className="text-sm font-medium text-gray-700">
                            Descrição
                          </Label>
                          {editing ? (
                            <Textarea
                              value={formData.description}
                              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                              className="mt-1"
                              rows={3}
                              placeholder="Descrição do projeto..."
                            />
                          ) : (
                            <p className="mt-1 text-gray-900">
                              {project.description || 'Nenhuma descrição fornecida'}
                            </p>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Fotos do Projeto */}
                  <Card className="border-0 shadow-lg">
                    <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50 border-b border-gray-200">
                      <CardTitle className="flex items-center justify-between text-purple-900">
                        <div className="flex items-center">
                          <Image className="h-5 w-5 mr-2" />
                          Fotos do Projeto
                        </div>
                        <Badge variant="outline" className="bg-white">
                          {project.photos.length} fotos
                        </Badge>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-6">
                      {project.photos.length > 0 ? (
                        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                          {project.photos.map((photo) => (
                            <div key={photo.id} className="group relative">
                              <div className="aspect-square rounded-lg overflow-hidden bg-gray-100 border border-gray-200 hover:shadow-md transition-shadow">
                                <img
                                  src={photo.thumbnailUrl}
                                  alt={photo.filename}
                                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                                />
                              </div>
                              <div className="mt-2">
                                <p className="text-xs text-gray-600 truncate" title={photo.filename}>
                                  {photo.filename}
                                </p>
                                <p className="text-xs text-gray-500">
                                  {formatFileSize(photo.fileSize)}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-8">
                          <Image className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                          <p className="text-gray-500">Nenhuma foto encontrada neste projeto</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>

                {/* Sidebar */}
                <div className="space-y-6">
                  {/* Informações do Usuário */}
                  <Card className="border-0 shadow-lg">
                    <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50 border-b border-gray-200">
                      <CardTitle className="flex items-center text-green-900">
                        <User className="h-5 w-5 mr-2" />
                        Proprietário
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-6">
                      <div className="space-y-3">
                        <div>
                          <Label className="text-sm font-medium text-gray-700">Nome</Label>
                          <p className="text-gray-900 font-medium">{project.user.name}</p>
                        </div>
                        <div>
                          <Label className="text-sm font-medium text-gray-700">Email</Label>
                          <p className="text-gray-900">{project.user.email}</p>
                        </div>
                        <div className="pt-3">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => router.push(`/admin/usuarios/${project.user.id}`)}
                            className="w-full"
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            Ver Perfil
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Estatísticas */}
                  <Card className="border-0 shadow-lg">
                    <CardHeader className="bg-gradient-to-r from-orange-50 to-amber-50 border-b border-gray-200">
                      <CardTitle className="flex items-center text-orange-900">
                        <FileText className="h-5 w-5 mr-2" />
                        Estatísticas
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-6">
                      <div className="space-y-4">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">Total de Páginas</span>
                          <span className="font-semibold text-gray-900">
                            {project.pageCount || project.pages.length}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">Total de Fotos</span>
                          <span className="font-semibold text-gray-900">{project.photos.length}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">Tamanho Total</span>
                          <span className="font-semibold text-gray-900">
                            {formatFileSize(project.photos.reduce((acc, photo) => acc + photo.fileSize, 0))}
                          </span>
                        </div>
                        {project.format && (
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-600">Formato</span>
                            <span className="font-semibold text-gray-900">{project.format}</span>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Datas */}
                  <Card className="border-0 shadow-lg">
                    <CardHeader className="bg-gradient-to-r from-gray-50 to-slate-50 border-b border-gray-200">
                      <CardTitle className="flex items-center text-gray-900">
                        <Calendar className="h-5 w-5 mr-2" />
                        Informações de Data
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-6">
                      <div className="space-y-3">
                        <div>
                          <Label className="text-sm font-medium text-gray-700">Criado em</Label>
                          <p className="text-sm text-gray-900">{formatDate(project.createdAt)}</p>
                        </div>
                        <div>
                          <Label className="text-sm font-medium text-gray-700">Última atualização</Label>
                          <p className="text-sm text-gray-900">{formatDate(project.updatedAt)}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Ações */}
                  <Card className="border-0 shadow-lg">
                    <CardHeader className="bg-gradient-to-r from-indigo-50 to-blue-50 border-b border-gray-200">
                      <CardTitle className="flex items-center text-indigo-900">
                        <HardDrive className="h-5 w-5 mr-2" />
                        Ações
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-6">
                      <div className="space-y-3">
                        <Button
                          variant="outline"
                          className="w-full justify-start"
                          onClick={() => window.open(`/albums/${project.id}`, '_blank')}
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          Visualizar Projeto
                        </Button>
                        <Button
                          variant="outline"
                          className="w-full justify-start"
                          onClick={() => {
                            // Implementar download do projeto
                            alert('Funcionalidade de download em desenvolvimento');
                          }}
                        >
                          <Download className="h-4 w-4 mr-2" />
                          Baixar Projeto
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>
    </AdminProtectedRoute>
  );
}