'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface UserProfile {
  id: string
  name: string
  email: string
  plan: 'FREE' | 'PRO' | 'ENTERPRISE'
}

interface FormData {
  name: string
  email: string
  currentPassword: string
  newPassword: string
  confirmPassword: string
}

export default function ProfilePage() {
  const [user, setUser] = useState<UserProfile | null>(null)
  const [formData, setFormData] = useState<FormData>({
    name: '',
    email: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })
  const [isLoading, setIsLoading] = useState(true)
  const [message, setMessage] = useState('')
  const [messageType, setMessageType] = useState<'success' | 'error'>('success')
  const router = useRouter()

  useEffect(() => {
    fetchUserProfile()
  }, [])

  const fetchUserProfile = async () => {
    try {
      const response = await fetch('/api/auth/me', {
        credentials: 'include'
      })

      if (response.ok) {
        const userData = await response.json()
        if (userData.success && userData.data?.user) {
          setUser(userData.data.user)
          setFormData(prev => ({
            ...prev,
            name: userData.data.user.name,
            email: userData.data.user.email
          }))
        } else {
          router.push('/auth/login')
        }
      } else {
        router.push('/auth/login')
      }
    } catch (error: unknown) {
      console.error('Erro ao carregar perfil:', error)
      router.push('/auth/login')
    } finally {
      setIsLoading(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setMessage('')

    // Validações
    if (formData.newPassword && formData.newPassword !== formData.confirmPassword) {
      setMessage('As senhas não coincidem')
      setMessageType('error')
      setIsLoading(false)
      return
    }

    if (formData.newPassword && !formData.currentPassword) {
      setMessage('Digite sua senha atual para alterar a senha')
      setMessageType('error')
      setIsLoading(false)
      return
    }

    try {
      const response = await fetch('/api/auth/update-profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          currentPassword: formData.currentPassword || undefined,
          newPassword: formData.newPassword || undefined
        })
      })

      const data = await response.json()

      if (response.ok) {
        setMessage('Perfil atualizado com sucesso!')
        setMessageType('success')
        setFormData(prev => ({
          ...prev,
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        }))
        // Atualizar dados do usuário
        await fetchUserProfile()
      } else {
        setMessage(data.error || 'Erro ao atualizar perfil')
        setMessageType('error')
      }
    } catch (error: unknown) {
      console.error('Erro:', error)
      setMessage('Erro ao atualizar perfil')
      setMessageType('error')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteAccount = async () => {
    if (!confirm('Tem certeza que deseja excluir sua conta? Esta ação não pode ser desfeita.')) {
      return
    }

    try {
      const response = await fetch('/api/auth/delete-account', {
        method: 'DELETE',
        credentials: 'include'
      })

      if (response.ok) {
        alert('Conta excluída com sucesso')
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
      await fetch('/api/auth/logout', { 
        method: 'POST',
        credentials: 'include'
      });
      
      document.cookie = 'auth-token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;'
      router.push('/auth/login');
    } catch (error: unknown) {
      console.error('Erro ao fazer logout:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Navbar */}
      <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <Link href="/dashboard" className="flex items-center">
              <h1 className="text-xl font-semibold tracking-tight">AlbumCraft Pro</h1>
            </Link>
            
            {/* Navigation Links */}
            <div className="hidden md:flex items-center space-x-8">
              <Link 
                href="/dashboard" 
                className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                Dashboard
              </Link>
              <Link 
                href="/projects" 
                className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                Meus Álbuns
              </Link>
              <Link 
                href="/profile" 
                className="text-sm font-medium text-primary"
              >
                Perfil
              </Link>
              <button
                onClick={handleLogout}
                className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                Sair
              </button>
            </div>

            {/* Mobile menu button */}
            <div className="md:hidden">
              <button
                onClick={handleLogout}
                className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                Sair
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-semibold tracking-tight mb-2">Perfil</h1>
          <p className="text-muted-foreground">Gerencie suas informações pessoais e configurações da conta</p>
        </div>

        {/* Error/Success Message */}
        {message && (
          <div className={`mb-6 rounded-xl border px-4 py-3 text-sm ${
            messageType === 'success' 
              ? 'bg-green-50 border-green-200 text-green-800' 
              : 'bg-destructive/10 border-destructive/20 text-destructive'
          }`}>
            {message}
          </div>
        )}

        <div className="space-y-6">
          {/* Plan Information Card */}
          <div className="rounded-xl border bg-card p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-blue-600 rounded-full flex items-center justify-center">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-lg font-semibold">Plano Atual</h2>
                  <p className="text-sm text-muted-foreground">Gerencie sua assinatura</p>
                </div>
              </div>
              {user?.plan !== 'ENTERPRISE' && (
                <Link
                  href="/plans"
                  className="px-4 py-2 text-sm font-medium text-primary-foreground bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl"
                >
                  Fazer Upgrade
                </Link>
              )}
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
                <div className="flex items-center space-x-3">
                  <div className={`w-3 h-3 rounded-full ${
                    user?.plan === 'FREE' ? 'bg-gray-400' :
                    user?.plan === 'PRO' ? 'bg-blue-500' :
                    'bg-purple-600'
                  }`}></div>
                  <div>
                    <p className="font-semibold">
                      {user?.plan === 'FREE' ? 'Plano Gratuito' :
                       user?.plan === 'PRO' ? 'Plano Pro' :
                       'Plano Enterprise'}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {user?.plan === 'FREE' ? 'Recursos básicos para começar' :
                       user?.plan === 'PRO' ? 'Recursos avançados para profissionais' :
                       'Recursos completos para empresas'}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold">
                    {user?.plan === 'FREE' ? 'R$ 0' :
                     user?.plan === 'PRO' ? 'R$ 29' :
                     'R$ 99'}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {user?.plan === 'FREE' ? 'Gratuito' : 'por mês'}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div className="flex items-center space-x-2">
                  <svg className={`w-4 h-4 ${user?.plan === 'FREE' ? 'text-gray-400' : 'text-green-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className={user?.plan === 'FREE' ? 'text-muted-foreground' : ''}>
                    {user?.plan === 'FREE' ? '5 projetos' :
                     user?.plan === 'PRO' ? '50 projetos' :
                     'Projetos ilimitados'}
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <svg className={`w-4 h-4 ${user?.plan === 'FREE' ? 'text-gray-400' : 'text-green-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className={user?.plan === 'FREE' ? 'text-muted-foreground' : ''}>
                    {user?.plan === 'FREE' ? '1GB storage' :
                     user?.plan === 'PRO' ? '100GB storage' :
                     'Storage ilimitado'}
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <svg className={`w-4 h-4 ${user?.plan === 'FREE' ? 'text-gray-400' : 'text-green-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className={user?.plan === 'FREE' ? 'text-muted-foreground' : ''}>
                    {user?.plan === 'FREE' ? 'Templates básicos' :
                     user?.plan === 'PRO' ? 'Templates premium' :
                     'Templates personalizados'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Profile Information Card */}
          <div className="rounded-xl border bg-card p-6">
            <div className="flex items-center space-x-4 mb-6">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <div>
                <h2 className="text-lg font-semibold">Informações Pessoais</h2>
                <p className="text-sm text-muted-foreground">Atualize seus dados pessoais</p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label htmlFor="name" className="text-sm font-medium">
                    Nome Completo
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="email" className="text-sm font-medium">
                    Email
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
                    required
                  />
                </div>
              </div>

              {/* Password Section */}
              <div className="border-t pt-6">
                <h3 className="text-base font-semibold mb-4">Alterar Senha</h3>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label htmlFor="currentPassword" className="text-sm font-medium">
                      Senha Atual
                    </label>
                    <input
                      type="password"
                      id="currentPassword"
                      name="currentPassword"
                      value={formData.currentPassword}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
                      placeholder="Digite sua senha atual para alterar"
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label htmlFor="newPassword" className="text-sm font-medium">
                        Nova Senha
                      </label>
                      <input
                        type="password"
                        id="newPassword"
                        name="newPassword"
                        value={formData.newPassword}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
                        placeholder="Mínimo 6 caracteres"
                      />
                    </div>
                    <div className="space-y-2">
                      <label htmlFor="confirmPassword" className="text-sm font-medium">
                        Confirmar Nova Senha
                      </label>
                      <input
                        type="password"
                        id="confirmPassword"
                        name="confirmPassword"
                        value={formData.confirmPassword}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
                        placeholder="Repita a nova senha"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row justify-between gap-4 pt-6 border-t">
                <button
                  type="button"
                  onClick={handleDeleteAccount}
                  className="px-4 py-2 text-sm font-medium text-destructive hover:text-destructive-foreground hover:bg-destructive rounded-lg border border-destructive/20 hover:border-destructive transition-colors"
                >
                  Excluir Conta
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="px-6 py-2 text-sm font-medium text-primary-foreground bg-primary hover:bg-primary/90 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? 'Salvando...' : 'Salvar Alterações'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}