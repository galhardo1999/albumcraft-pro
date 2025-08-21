'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AdminProtectedRoute } from '@/components/AdminProtectedRoute';
import { AdminNavbar } from '@/components/AdminNavbar';
import CreateUserModal from '@/components/CreateUserModal';
import { 
  Users, 
  Trash2,
  Eye,
  Search,
  Filter,
  UserCheck,
  Calendar,
  Mail
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

export default function AdminUsersPage() {
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [planFilter, setPlanFilter] = useState('ALL');
  const [adminFilter, setAdminFilter] = useState('ALL');

  useEffect(() => {
    loadUsers();
  }, []);

  useEffect(() => {
    filterUsers();
  }, [users, searchTerm, planFilter, adminFilter]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/users');
      if (response.ok) {
        const data = await response.json();
        setUsers(data.users);
      }
    } catch (error) {
      console.error('Erro ao carregar usuários:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterUsers = () => {
    let filtered = users;

    // Filtrar por termo de busca
    if (searchTerm) {
      filtered = filtered.filter(user =>
        user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filtrar por plano
    if (planFilter !== 'ALL') {
      filtered = filtered.filter(user => user.plan === planFilter);
    }

    // Filtrar por tipo de usuário
    if (adminFilter === 'ADMIN') {
      filtered = filtered.filter(user => user.isAdmin);
    } else if (adminFilter === 'USER') {
      filtered = filtered.filter(user => !user.isAdmin);
    }

    setFilteredUsers(filtered);
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const formatLastLogin = (lastLogin: string | null) => {
    if (!lastLogin) return 'Nunca';
    return new Date(lastLogin).toLocaleDateString('pt-BR');
  };

  const getPlanBadgeColor = (plan: string) => {
    switch (plan) {
      case 'FREE': return 'bg-gray-100 text-gray-800';
      case 'PRO': return 'bg-blue-100 text-blue-800';
      case 'ENTERPRISE': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
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

  const uniquePlans = Array.from(new Set(users.map(u => u.plan)));

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando usuários...</p>
        </div>
      </div>
    );
  }

  return (
    <AdminProtectedRoute>
      <div className="min-h-screen bg-gray-50">
        <AdminNavbar activeTab="users" onTabChange={() => {}} />
        
        <div className="lg:pl-64">
          <main className="py-6">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="mb-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center">
                      <Users className="h-6 w-6 mr-2" />
                      Gerenciar Usuários
                    </h1>
                    <p className="text-gray-600 mt-1">
                      Visualize e gerencie todos os usuários da plataforma
                    </p>
                  </div>
                  <CreateUserModal onUserCreated={loadUsers} />
                </div>
              </div>

              {/* Estatísticas rápidas */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center">
                      <Users className="h-8 w-8 text-blue-600" />
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-600">Total de Usuários</p>
                        <p className="text-2xl font-bold text-gray-900">{users.length}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center">
                      <UserCheck className="h-8 w-8 text-green-600" />
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-600">Administradores</p>
                        <p className="text-2xl font-bold text-gray-900">
                          {users.filter(u => u.isAdmin).length}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Filtros */}
              <Card className="mb-6">
                <CardContent className="pt-6">
                  <div className="flex flex-col lg:flex-row gap-4">
                    <div className="flex-1">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                        <input
                          type="text"
                          placeholder="Buscar por nome ou email..."
                          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                        />
                      </div>
                    </div>
                    <div className="lg:w-48">
                      <select
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        value={planFilter}
                        onChange={(e) => setPlanFilter(e.target.value)}
                      >
                        <option value="ALL">Todos os Planos</option>
                        {uniquePlans.map(plan => (
                          <option key={plan} value={plan}>
                            {getPlanLabel(plan)}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="lg:w-48">
                      <select
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        value={adminFilter}
                        onChange={(e) => setAdminFilter(e.target.value)}
                      >
                        <option value="ALL">Todos os Tipos</option>
                        <option value="ADMIN">Administradores</option>
                        <option value="USER">Usuários</option>
                      </select>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Lista de Usuários */}
              <Card>
                <CardHeader>
                  <CardTitle>
                    Usuários ({filteredUsers.length})
                  </CardTitle>
                  <CardDescription>
                    {searchTerm || planFilter !== 'ALL' || adminFilter !== 'ALL'
                      ? `Mostrando ${filteredUsers.length} de ${users.length} usuários`
                      : `Total de ${users.length} usuários cadastrados`
                    }
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left p-3">Usuário</th>
                          <th className="text-left p-3">Email</th>
                          <th className="text-left p-3">Plano</th>
                          <th className="text-left p-3">Álbuns</th>
                          <th className="text-left p-3">Fotos</th>
                          <th className="text-left p-3">Cadastro</th>
                          <th className="text-left p-3">Último Login</th>
                          <th className="text-left p-3">Ações</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredUsers.map((user) => (
                          <tr key={user.id} className="border-b hover:bg-gray-50">
                            <td className="p-3">
                              <div className="flex items-center space-x-3">
                                <div className="flex-shrink-0">
                                  <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                                    <span className="text-sm font-medium text-gray-700">
                                      {user.name.charAt(0).toUpperCase()}
                                    </span>
                                  </div>
                                </div>
                                <div>
                                  <div className="flex items-center space-x-2">
                                    <span className="font-medium text-gray-900">{user.name}</span>
                                    {user.isAdmin && (
                                      <Badge className="bg-red-100 text-red-800">Admin</Badge>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="p-3 text-gray-600">{user.email}</td>
                            <td className="p-3">
                              <Badge className={getPlanBadgeColor(user.plan)}>
                                {getPlanLabel(user.plan)}
                              </Badge>
                            </td>
                            <td className="p-3 text-gray-600">{user._count.projects}</td>
                            <td className="p-3 text-gray-600">{user._count.photos}</td>
                            <td className="p-3 text-gray-600">{formatDate(user.createdAt)}</td>
                            <td className="p-3 text-gray-600">{formatLastLogin(user.lastLogin)}</td>
                            <td className="p-3">
                              <div className="flex items-center space-x-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => router.push(`/admin/users/${user.id}`)}
                                  title="Visualizar usuário"
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                                {!user.isAdmin && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => deleteUser(user.id)}
                                    className="text-red-600 hover:text-red-700"
                                    title="Deletar usuário"
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
                    
                    {filteredUsers.length === 0 && (
                      <div className="text-center py-8">
                        <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-500">
                          {searchTerm || planFilter !== 'ALL' || adminFilter !== 'ALL'
                            ? 'Nenhum usuário encontrado com os filtros aplicados'
                            : 'Nenhum usuário cadastrado ainda'
                          }
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </main>
        </div>
      </div>
    </AdminProtectedRoute>
  );
}