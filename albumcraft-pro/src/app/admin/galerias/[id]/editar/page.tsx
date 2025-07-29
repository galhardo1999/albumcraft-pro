'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { AdminNavbar } from '@/components/AdminNavbar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Save, Trash2, User, Search, UserPlus, X } from 'lucide-react';
import Link from 'next/link';

interface PhotoEvent {
  id: string;
  name: string;
  description: string;
  createdAt: string;
  updatedAt: string;
  users?: User[];
}

interface User {
  id: string;
  name: string;
  email: string;
}

export default function EditarEventoPage() {
  const params = useParams();
  const router = useRouter();
  const eventId = params.id as string;
  
  const [event, setEvent] = useState<PhotoEvent | null>(null);
  const [formData, setFormData] = useState({
    name: ''
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState('');

  // Estados para usuários
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<User[]>([]);
  const [userSearch, setUserSearch] = useState('');
  const [loadingUsers, setLoadingUsers] = useState(false);

  useEffect(() => {
    if (eventId) {
      fetchEvent();
    }
  }, [eventId]);

  const fetchEvent = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/admin/photo-galleries/${eventId}`);
      
      if (!response.ok) {
        throw new Error('Erro ao carregar evento');
      }
      
      const data = await response.json();
      setEvent(data);
      setFormData({
        name: data.name
      });
      
      // Carregar usuários associados ao evento
      if (data.users) {
        setSelectedUsers(data.users);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      setIsLoading(false);
    }
  };

  // Buscar usuários
  const fetchUsers = async (search = '') => {
    try {
      setLoadingUsers(true);
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      
      const response = await fetch(`/api/admin/users?${params}`);
      if (!response.ok) throw new Error('Erro ao buscar usuários');
      
      const data = await response.json();
      setUsers(data.users || []);
    } catch (err) {
      console.error('Erro ao buscar usuários:', err);
    } finally {
      setLoadingUsers(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // Debounce para busca de usuários
  useEffect(() => {
    const timer = setTimeout(() => {
      if (userSearch !== '') {
        fetchUsers(userSearch);
      } else {
        fetchUsers();
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [userSearch]);

  // Adicionar usuário
  const addUser = (user: User) => {
    if (!selectedUsers.find(u => u.id === user.id)) {
      setSelectedUsers(prev => [...prev, user]);
    }
  };

  // Remover usuário
  const removeUser = (userId: string) => {
    setSelectedUsers(prev => prev.filter(u => u.id !== userId));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      setError('Nome é obrigatório');
      return;
    }

    try {
      setIsLoading(true);
      setError('');

      const response = await fetch(`/api/admin/photo-events/${eventId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name.trim(),
          userIds: selectedUsers.map(user => user.id)
        }),
      });

      if (!response.ok) {
        throw new Error('Erro ao atualizar evento');
      }

      router.push('/admin/galerias');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Tem certeza que deseja excluir este evento? Esta ação não pode ser desfeita e todos os álbuns e fotos serão removidos.')) {
      return;
    }

    try {
      setIsLoading(true);
      setError('');

      const response = await fetch(`/api/admin/photo-events/${eventId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Erro ao excluir evento');
      }

      router.push('/admin/galerias');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao excluir evento');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <AdminNavbar activeTab="photos" />
        <div className="lg:pl-64">
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-600 border-t-transparent"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen bg-gray-50">
        <AdminNavbar activeTab="photos" />
        <div className="lg:pl-64">
          <div className="text-center py-12">
            <h2 className="text-xl font-semibold text-gray-900">Evento não encontrado</h2>
            <Link href="/admin/galerias">
              <Button className="mt-4">Voltar para Galerias</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminNavbar activeTab="photos" />
      
      <div className="lg:pl-64">
        <main className="py-8">
          <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
            {/* Header */}
            <div className="mb-8">
              <div className="flex items-center space-x-4 mb-4">
                <Link href={`/admin/galerias/${eventId}`}>
                  <Button variant="outline" size="sm">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Voltar
                  </Button>
                </Link>
              </div>
              
              <h1 className="text-2xl font-bold text-gray-900">Editar Evento</h1>
              <p className="mt-1 text-sm text-gray-500">
                Atualize as informações do evento de fotos
              </p>
            </div>

            {/* Error Message */}
            {error && (
              <div className="mb-6 rounded-md bg-red-50 p-4">
                <div className="text-sm text-red-700">{error}</div>
              </div>
            )}

            {/* Form */}
            <div className="space-y-6">
              {/* Informações do Evento */}
              <Card>
                <CardHeader>
                  <CardTitle>Informações do Evento</CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                      <Label htmlFor="name" className="text-sm font-medium text-gray-700">
                        Nome do Evento *
                      </Label>
                      <Input
                         id="name"
                         type="text"
                         value={formData.name}
                         onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                         placeholder="Ex: Casamento João e Maria"
                         className="mt-1"
                         required
                       />
                      <p className="mt-1 text-xs text-gray-500">
                        Nome que será exibido para os usuários
                      </p>
                    </div>
                  </form>
                </CardContent>
              </Card>

              {/* Gestão de Usuários */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <UserPlus className="h-5 w-5 mr-2" />
                    Gerenciar Usuários
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-700">
                      Buscar Usuários
                    </Label>
                    <div className="relative mt-1">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        type="text"
                        value={userSearch}
                        onChange={(e) => setUserSearch(e.target.value)}
                        placeholder="Digite o nome ou email do usuário..."
                        className="pl-10"
                      />
                    </div>
                  </div>

                  {/* Lista de usuários disponíveis */}
                  {userSearch && (
                    <div className="max-h-40 overflow-y-auto border rounded-md">
                      {loadingUsers ? (
                        <div className="p-4 text-center text-gray-500">Carregando...</div>
                      ) : users.length === 0 ? (
                        <div className="p-4 text-center text-gray-500">Nenhum usuário encontrado</div>
                      ) : (
                        users.map(user => (
                          <div
                            key={user.id}
                            className="p-3 hover:bg-gray-50 cursor-pointer border-b last:border-b-0"
                            onClick={() => addUser(user)}
                          >
                            <div className="flex items-center">
                              <User className="h-4 w-4 mr-2 text-gray-400" />
                              <div>
                                <p className="text-sm font-medium">{user.name}</p>
                                <p className="text-xs text-gray-500">{user.email}</p>
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  )}

                  {/* Usuários selecionados */}
                  {selectedUsers.length > 0 && (
                    <div>
                      <Label className="text-sm font-medium text-gray-700">
                        Usuários com Acesso ({selectedUsers.length})
                      </Label>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {selectedUsers.map(user => (
                          <Badge key={user.id} variant="secondary" className="flex items-center gap-1">
                            <User className="h-3 w-3" />
                            {user.name}
                            <button
                              type="button"
                              onClick={() => removeUser(user.id)}
                              className="ml-1 hover:text-red-600"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Ações */}
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <Button
                      type="button"
                      variant="destructive"
                      onClick={handleDelete}
                      disabled={isLoading}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Excluir Evento
                    </Button>

                    <div className="flex space-x-3">
                      <Link href={`/admin/galerias/${eventId}`}>
                        <Button type="button" variant="outline" disabled={isLoading}>
                          Cancelar
                        </Button>
                      </Link>
                      <Button onClick={handleSubmit} disabled={isLoading}>
                        {isLoading ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                            Salvando...
                          </>
                        ) : (
                          <>
                            <Save className="h-4 w-4 mr-2" />
                            Salvar Alterações
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}