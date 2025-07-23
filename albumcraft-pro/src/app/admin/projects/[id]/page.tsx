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
import { ArrowLeft, Save, Trash2, FolderOpen, User, Image, FileText } from 'lucide-react';
import { AdminProtectedRoute } from '@/components/AdminProtectedRoute';
import { AdminNavbar } from '@/components/AdminNavbar';

interface ProjectDetails {
  id: string;
  name: string;
  description: string | null;
  albumSize: string;
  template: string;
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
    albumSize: '',
    template: ''
  });

  useEffect(() => {
    loadProject();
  }, [resolvedParams.id]);

  const loadProject = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/admin/projects/${resolvedParams.id}`);
      
      if (response.ok) {
        const data = await response.json();
        setProject(data.project);
        setFormData({
          name: data.project.name,
          description: data.project.description || '',
          status: data.project.status,
          albumSize: data.project.albumSize,
          template: data.project.template
        });
      } else {
        router.push('/admin');
      }
    } catch (error) {
      console.error('Erro ao carregar projeto:', error);
      router.push('/admin');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      const response = await fetch(`/api/admin/projects/${resolvedParams.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        const data = await response.json();
        setProject({ ...project!, ...data.project });
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
      const response = await fetch(`/api/admin/projects/${resolvedParams.id}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        router.push('/admin');
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
          <p className="mt-4 text-gray-600">Carregando projeto...</p>
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Projeto não encontrado</p>
          <Button onClick={() => router.push('/admin')} className="mt-4">
            Voltar ao Dashboard
          </Button>
        </div>
      </div>
    );
  }

  return (
    <AdminProtectedRoute>
      <div className="min-h-screen bg-gray-50">
        <AdminNavbar />
        
        {/* Main content with sidebar offset */}
        <div className="lg:pl-64">
          <main className="py-6">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header com ações */}
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center space-x-4">
              <Button
                variant="outline"
                onClick={() => router.push('/admin')}
                className="flex items-center space-x-2"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Voltar</span>
              </Button>
              <h1 className="text-2xl font-bold text-gray-900">
                Detalhes do Projeto
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              {editing ? (
                <>
                  <Button onClick={handleSave} className="flex items-center space-x-2">
                    <Save className="h-4 w-4" />
                    <span>Salvar</span>
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setEditing(false);
                      setFormData({
                        name: project.name,
                        description: project.description || '',
                        status: project.status,
                        albumSize: project.albumSize,
                        template: project.template
                      });
                    }}
                  >
                    Cancelar
                  </Button>
                </>
              ) : (
                <>
                  <Button onClick={() => setEditing(true)}>
                    Editar
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={handleDelete}
                    className="flex items-center space-x-2"
                  >
                    <Trash2 className="h-4 w-4" />
                    <span>Deletar</span>
                  </Button>
                </>
              )}
            </div>
          </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Project Info */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <FolderOpen className="h-5 w-5" />
                  <span>Informações do Projeto</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {editing ? (
                  <>
                    <div>
                      <Label htmlFor="name">Nome</Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="description">Descrição</Label>
                      <Textarea
                        id="description"
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        rows={3}
                      />
                    </div>
                    <div>
                      <Label htmlFor="status">Status</Label>
                      <Select
                        value={formData.status}
                        onValueChange={(value) => setFormData({ ...formData, status: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="DRAFT">DRAFT</SelectItem>
                          <SelectItem value="IN_PROGRESS">IN_PROGRESS</SelectItem>
                          <SelectItem value="COMPLETED">COMPLETED</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="albumSize">Tamanho do Álbum</Label>
                      <Select
                        value={formData.albumSize}
                        onValueChange={(value) => setFormData({ ...formData, albumSize: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="SIZE_15X15">15x15cm</SelectItem>
                          <SelectItem value="SIZE_20X20">20x20cm</SelectItem>
                          <SelectItem value="SIZE_25X25">25x25cm</SelectItem>
                          <SelectItem value="SIZE_30X30">30x30cm</SelectItem>
                          <SelectItem value="SIZE_20X15">20x15cm</SelectItem>
                          <SelectItem value="SIZE_30X20">30x20cm</SelectItem>
                          <SelectItem value="SIZE_40X30">40x30cm</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="template">Template</Label>
                      <Select
                        value={formData.template}
                        onValueChange={(value) => setFormData({ ...formData, template: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="classic">Classic</SelectItem>
                          <SelectItem value="modern">Modern</SelectItem>
                          <SelectItem value="artistic">Artistic</SelectItem>
                          <SelectItem value="minimal">Minimal</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </>
                ) : (
                  <>
                    <div>
                      <Label>Nome</Label>
                      <p className="text-lg font-medium">{project.name}</p>
                    </div>
                    {project.description && (
                      <div>
                        <Label>Descrição</Label>
                        <p className="text-gray-600">{project.description}</p>
                      </div>
                    )}
                    <div>
                      <Label>Status</Label>
                      <div className="mt-1">
                        <Badge className={getStatusBadgeColor(project.status)}>
                          {project.status}
                        </Badge>
                      </div>
                    </div>
                    <div>
                      <Label>Tamanho do Álbum</Label>
                      <p className="text-gray-600">{project.albumSize}</p>
                    </div>
                    <div>
                      <Label>Template</Label>
                      <p className="text-gray-600 capitalize">{project.template}</p>
                    </div>
                    <div>
                      <Label>Tipo de Criação</Label>
                      <p className="text-gray-600">{project.creationType}</p>
                    </div>
                    {project.group && (
                      <div>
                        <Label>Grupo</Label>
                        <p className="text-gray-600">{project.group}</p>
                      </div>
                    )}
                    {project.eventName && (
                      <div>
                        <Label>Nome do Evento</Label>
                        <p className="text-gray-600">{project.eventName}</p>
                      </div>
                    )}
                    <div>
                      <Label>Criado em</Label>
                      <p className="text-gray-600">{formatDate(project.createdAt)}</p>
                    </div>
                    <div>
                      <Label>Atualizado em</Label>
                      <p className="text-gray-600">{formatDate(project.updatedAt)}</p>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Owner Info */}
            <Card className="mt-6">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <User className="h-5 w-5" />
                  <span>Proprietário</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div>
                  <Label>Nome</Label>
                  <p className="font-medium">{project.user.name}</p>
                </div>
                <div>
                  <Label>Email</Label>
                  <p className="text-gray-600">{project.user.email}</p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => router.push(`/admin/users/${project.user.id}`)}
                  className="mt-2"
                >
                  Ver Perfil do Usuário
                </Button>
              </CardContent>
            </Card>

            {/* Stats */}
            <Card className="mt-6">
              <CardHeader>
                <CardTitle>Estatísticas</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <FileText className="h-4 w-4 text-gray-500" />
                    <span>Páginas</span>
                  </div>
                  <span className="font-medium">{project.pages.length}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Image className="h-4 w-4 text-gray-500" />
                    <span>Fotos</span>
                  </div>
                  <span className="font-medium">{project.photos.length}</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Pages and Photos */}
          <div className="lg:col-span-2 space-y-6">
            {/* Pages */}
            <Card>
              <CardHeader>
                <CardTitle>Páginas ({project.pages.length})</CardTitle>
                <CardDescription>
                  Todas as páginas do projeto
                </CardDescription>
              </CardHeader>
              <CardContent>
                {project.pages.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {project.pages.map((page) => (
                      <div key={page.id} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium">Página {page.pageNumber}</span>
                          <Badge variant="outline">
                            {page.photoPlacement.length} fotos
                          </Badge>
                        </div>
                        {page.backgroundColor && (
                          <div className="flex items-center space-x-2 text-sm text-gray-600">
                            <div
                              className="w-4 h-4 rounded border"
                              style={{ backgroundColor: page.backgroundColor }}
                            ></div>
                            <span>Cor de fundo</span>
                          </div>
                        )}
                        {page.photoPlacement.length > 0 && (
                          <div className="mt-2 grid grid-cols-3 gap-1">
                            {page.photoPlacement.slice(0, 3).map((placement) => (
                              <img
                                key={placement.id}
                                src={placement.photo.thumbnailUrl}
                                alt={placement.photo.filename}
                                className="w-full h-12 object-cover rounded"
                              />
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-8">
                    Nenhuma página encontrada
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Photos */}
            <Card>
              <CardHeader>
                <CardTitle>Fotos ({project.photos.length})</CardTitle>
                <CardDescription>
                  Todas as fotos do projeto
                </CardDescription>
              </CardHeader>
              <CardContent>
                {project.photos.length > 0 ? (
                  <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                    {project.photos.map((photo) => (
                      <div key={photo.id} className="space-y-2">
                        <img
                          src={photo.thumbnailUrl}
                          alt={photo.filename}
                          className="w-full h-24 object-cover rounded border"
                        />
                        <div className="text-xs">
                          <p className="font-medium truncate" title={photo.filename}>
                            {photo.filename}
                          </p>
                          <p className="text-gray-500">{formatFileSize(photo.fileSize)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-8">
                    Nenhuma foto encontrada
                  </p>
                )}
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