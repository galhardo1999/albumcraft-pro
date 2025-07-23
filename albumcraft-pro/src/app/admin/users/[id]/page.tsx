'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Save, Trash2, User, FolderOpen, Image } from 'lucide-react';
import { AdminProtectedRoute } from '@/components/AdminProtectedRoute';
import { AdminNavbar } from '@/components/AdminNavbar';

interface UserDetails {
  id: string;
  email: string;
  name: string;
  plan: string;
  isAdmin: boolean;
  createdAt: string;
  updatedAt: string;
  lastLogin: string | null;
  projects: Array<{
    id: string;
    name: string;
    status: string;
    createdAt: string;
    _count: {
      pages: number;
      photos: number;
    };
  }>;
  photos: Array<{
    id: string;
    filename: string;
    fileSize: number;
    uploadedAt: string;
  }>;
  _count: {
    projects: number;
    photos: number;
  };
}

export default function UserDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const resolvedParams = use(params);
  const [user, setUser] = useState<UserDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    plan: '',
    isAdmin: false
  });

  useEffect(() => {
    loadUser();
  }, [resolvedParams.id]);

  const loadUser = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/admin/users/${resolvedParams.id}`);
      
      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
        setFormData({
          name: data.user.name,
          email: data.user.email,
          plan: data.user.plan,
          isAdmin: data.user.isAdmin
        });
      } else {
        router.push('/admin');
      }
    } catch (error) {
      console.error('Erro ao carregar usuário:', error);
      router.push('/admin');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      const response = await fetch(`/api/admin/users/${resolvedParams.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        const data = await response.json();
        setUser({ ...user!, ...data.user });
        setEditing(false);
      } else {
        alert('Erro ao salvar alterações');
      }
    } catch (error) {
      console.error('Erro ao salvar usuário:', error);
      alert('Erro ao salvar alterações');
    }
  };

  const handleDelete = async () => {
    if (!confirm('Tem certeza que deseja deletar este usuário? Esta ação não pode ser desfeita.')) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/users/${resolvedParams.id}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        router.push('/admin');
      } else {
        alert('Erro ao deletar usuário');
      }
    } catch (error) {
      console.error('Erro ao deletar usuário:', error);
      alert('Erro ao deletar usuário');
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
          <p className="mt-4 text-gray-600">Carregando usuário...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Usuário não encontrado</p>
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
                Detalhes do Usuário
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
                        name: user.name,
                        email: user.email,
                        plan: user.plan,
                        isAdmin: user.isAdmin
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
                  {!user.isAdmin && (
                    <Button
                      variant="destructive"
                      onClick={handleDelete}
                      className="flex items-center space-x-2"
                    >
                      <Trash2 className="h-4 w-4" />
                      <span>Deletar</span>
                    </Button>
                  )}
                </>
              )}
            </div>
          </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* User Info */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <User className="h-5 w-5" />
                  <span>Informações do Usuário</span>
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
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="plan">Plano</Label>
                      <Select
                        value={formData.plan}
                        onValueChange={(value) => setFormData({ ...formData, plan: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="FREE">FREE</SelectItem>
                          <SelectItem value="PRO">PRO</SelectItem>
                          <SelectItem value="ENTERPRISE">ENTERPRISE</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="isAdmin"
                        checked={formData.isAdmin}
                        onChange={(e) => setFormData({ ...formData, isAdmin: e.target.checked })}
                        className="rounded"
                      />
                      <Label htmlFor="isAdmin">Administrador</Label>
                    </div>
                  </>
                ) : (
                  <>
                    <div>
                      <Label>Nome</Label>
                      <p className="text-lg font-medium">{user.name}</p>
                    </div>
                    <div>
                      <Label>Email</Label>
                      <p className="text-gray-600">{user.email}</p>
                    </div>
                    <div>
                      <Label>Plano</Label>
                      <div className="mt-1">
                        <Badge className={getPlanBadgeColor(user.plan)}>
                          {user.plan}
                        </Badge>
                      </div>
                    </div>
                    {user.isAdmin && (
                      <div>
                        <Badge className="bg-red-100 text-red-800">
                          Administrador
                        </Badge>
                      </div>
                    )}
                    <div>
                      <Label>Cadastrado em</Label>
                      <p className="text-gray-600">{formatDate(user.createdAt)}</p>
                    </div>
                    {user.lastLogin && (
                      <div>
                        <Label>Último login</Label>
                        <p className="text-gray-600">{formatDate(user.lastLogin)}</p>
                      </div>
                    )}
                  </>
                )}
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
                    <FolderOpen className="h-4 w-4 text-gray-500" />
                    <span>Projetos</span>
                  </div>
                  <span className="font-medium">{user._count.projects}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Image className="h-4 w-4 text-gray-500" />
                    <span>Fotos</span>
                  </div>
                  <span className="font-medium">{user._count.photos}</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Projects and Photos */}
          <div className="lg:col-span-2 space-y-6">
            {/* Projects */}
            <Card>
              <CardHeader>
                <CardTitle>Projetos ({user.projects.length})</CardTitle>
                <CardDescription>
                  Todos os projetos criados por este usuário
                </CardDescription>
              </CardHeader>
              <CardContent>
                {user.projects.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left p-2">Nome</th>
                          <th className="text-left p-2">Status</th>
                          <th className="text-left p-2">Páginas</th>
                          <th className="text-left p-2">Fotos</th>
                          <th className="text-left p-2">Criado</th>
                        </tr>
                      </thead>
                      <tbody>
                        {user.projects.map((project) => (
                          <tr key={project.id} className="border-b hover:bg-gray-50">
                            <td className="p-2 font-medium">{project.name}</td>
                            <td className="p-2">
                              <Badge className={getStatusBadgeColor(project.status)}>
                                {project.status}
                              </Badge>
                            </td>
                            <td className="p-2">{project._count.pages}</td>
                            <td className="p-2">{project._count.photos}</td>
                            <td className="p-2 text-gray-600">{formatDate(project.createdAt)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-8">
                    Nenhum projeto encontrado
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Photos */}
            <Card>
              <CardHeader>
                <CardTitle>Fotos ({user.photos.length})</CardTitle>
                <CardDescription>
                  Todas as fotos enviadas por este usuário
                </CardDescription>
              </CardHeader>
              <CardContent>
                {user.photos.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left p-2">Nome do Arquivo</th>
                          <th className="text-left p-2">Tamanho</th>
                          <th className="text-left p-2">Enviado</th>
                        </tr>
                      </thead>
                      <tbody>
                        {user.photos.map((photo) => (
                          <tr key={photo.id} className="border-b hover:bg-gray-50">
                            <td className="p-2 font-medium">{photo.filename}</td>
                            <td className="p-2">{formatFileSize(photo.fileSize)}</td>
                            <td className="p-2 text-gray-600">{formatDate(photo.uploadedAt)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
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