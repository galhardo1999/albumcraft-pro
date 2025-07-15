'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';

interface User {
  id: string;
  name: string;
  email: string;
  createdAt: string;
  updatedAt: string;
}

export default function ProfilePage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error'>('success');
  const router = useRouter();

  const fetchUserData = useCallback(async () => {
    try {
      const response = await fetch('/api/auth/me');
      if (response.ok) {
        const userData = await response.json();
        setFormData({
          name: userData.name || '',
          email: userData.email || '',
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        });
      }
    } catch (error) {
      console.error('Erro ao buscar dados do usuário:', error);
    }
  }, []);

  useEffect(() => {
    fetchUserData();
  }, [fetchUserData]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage('');

    // Validação de senha
    if (formData.newPassword && formData.newPassword !== formData.confirmPassword) {
      setMessage('As senhas não coincidem');
      setMessageType('error');
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/auth/update-profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          currentPassword: formData.currentPassword,
          newPassword: formData.newPassword
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage('Perfil atualizado com sucesso!');
        setMessageType('success');
        await fetchUserData();
        setFormData(prev => ({
          ...prev,
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        }));
      } else {
        setMessage(data.error || 'Erro ao atualizar perfil');
        setMessageType('error');
      }
    } catch (error: unknown) {
      console.error('Erro:', error);
      setMessage('Erro ao atualizar perfil');
      setMessageType('error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!confirm('Tem certeza que deseja excluir sua conta? Esta ação não pode ser desfeita.')) {
      return;
    }

    try {
      const response = await fetch('/api/auth/delete-account', {
        method: 'DELETE',
      });

      if (response.ok) {
        window.location.href = '/auth/login';
      } else {
        const data = await response.json();
        setMessage(data.error || 'Erro ao excluir conta');
        setMessageType('error');
      }
    } catch (error: unknown) {
      console.error('Erro:', error);
      setMessage('Erro ao excluir conta');
      setMessageType('error');
    }
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/auth/login');
    } catch (error: unknown) {
      console.error('Erro ao fazer logout:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando perfil...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Navbar */}
      <nav className="bg-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-bold text-gray-900">AlbumCraft Pro</h1>
            </div>
            <div className="flex items-center space-x-4">
              <a href="/dashboard" className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium">
                Dashboard
              </a>
              <a href="/projects" className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium">
                Meus Álbuns
              </a>
              <a href="/profile" className="bg-blue-100 text-blue-700 px-3 py-2 rounded-md text-sm font-medium">
                Perfil
              </a>
              <button
                onClick={handleLogout}
                className="text-gray-700 hover:text-red-600 px-3 py-2 rounded-md text-sm font-medium"
              >
                Sair
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-xl overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-8">
            <div className="flex items-center">
              <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center">
                <svg className="w-10 h-10 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <div className="ml-6">
                <h1 className="text-3xl font-bold text-white">Meu Perfil</h1>
                <p className="text-blue-100">Gerencie suas informações pessoais</p>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="p-6">
            {message && (
              <div className={`mb-6 p-4 rounded-md ${
                messageType === 'success' 
                  ? 'bg-green-50 border border-green-200 text-green-800' 
                  : 'bg-red-50 border border-red-200 text-red-800'
              }`}>
                {message}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Informações Pessoais */}
              <div className="bg-gray-50 p-6 rounded-lg">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Informações Pessoais</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                      Nome Completo
                    </label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                      Email
                    </label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Alterar Senha */}
              <div className="bg-gray-50 p-6 rounded-lg">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Alterar Senha</h2>
                <div className="space-y-4">
                  <div>
                    <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700 mb-2">
                      Senha Atual
                    </label>
                    <input
                      type="password"
                      id="currentPassword"
                      name="currentPassword"
                      value={formData.currentPassword}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-2">
                        Nova Senha
                      </label>
                      <input
                        type="password"
                        id="newPassword"
                        name="newPassword"
                        value={formData.newPassword}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                        Confirmar Nova Senha
                      </label>
                      <input
                        type="password"
                        id="confirmPassword"
                        name="confirmPassword"
                        value={formData.confirmPassword}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Botões de Ação */}
              <div className="flex justify-between">
                <button
                  type="button"
                  onClick={handleDeleteAccount}
                  className="px-6 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
                >
                  Excluir Conta
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                >
                  {isLoading ? 'Salvando...' : 'Salvar Alterações'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}