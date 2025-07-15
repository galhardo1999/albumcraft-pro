'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

interface UserProfile {
  id: string
  email: string
  name: string
  avatarUrl?: string
  plan: 'FREE' | 'PRO' | 'ENTERPRISE'
  createdAt: string
  lastLogin?: string
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
          const userInfo = userData.data.user
          setUser(userInfo)
          setFormData(prev => ({
            ...prev,
            name: userInfo.name || '',
            email: userInfo.email || ''
          }))
        } else {
          router.push('/auth/login')
        }
      } else {
        router.push('/auth/login')
      }
    } catch (error) {
      console.error('Error fetching user profile:', error)
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
    setMessage('')

    // Validações
    if (formData.newPassword && formData.newPassword !== formData.confirmPassword) {
      setMessage('As senhas não coincidem')
      setMessageType('error')
      return
    }

    if (formData.newPassword && formData.newPassword.length < 6) {
      setMessage('A nova senha deve ter pelo menos 6 caracteres')
      setMessageType('error')
      return
    }

    try {
      const updateData: any = {
        name: formData.name,
        email: formData.email
      }

      if (formData.newPassword) {
        updateData.currentPassword = formData.currentPassword
        updateData.newPassword = formData.newPassword
      }

      const response = await fetch('/api/auth/update-profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify(updateData)
      })

      const result = await response.json()

      if (response.ok && result.success) {
        setMessage('Perfil atualizado com sucesso!')
        setMessageType('success')
        setFormData(prev => ({
          ...prev,
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        }))
        
        // Atualizar dados do usuário
        if (result.data?.user) {
          setUser(result.data.user)
        }
      } else {
        setMessage(result.error?.message || 'Erro ao atualizar perfil')
        setMessageType('error')
      }
    } catch (error) {
      console.error('Error updating profile:', error)
      setMessage('Erro interno do servidor')
      setMessageType('error')
    }
  }

  const getPlanDetails = (plan: string) => {
    switch (plan) {
      case 'FREE':
        return {
          name: 'Plano Gratuito',
          description: 'Ideal para começar',
          features: ['Até 3 álbuns', 'Até 50 fotos por álbum', 'Templates básicos'],
          price: 'Gratuito'
        }
      case 'PRO':
        return {
          name: 'Plano Pro',
          description: 'Para usuários avançados',
          features: ['Álbuns ilimitados', 'Até 500 fotos por álbum', 'Todos os templates', 'Suporte prioritário'],
          price: 'R$ 29,90/mês'
        }
      case 'ENTERPRISE':
        return {
          name: 'Plano Enterprise',
          description: 'Para empresas',
          features: ['Tudo do Pro', 'Fotos ilimitadas', 'API personalizada', 'Suporte dedicado'],
          price: 'R$ 99,90/mês'
        }
      default:
        return {
          name: 'Plano Desconhecido',
          description: '',
          features: [],
          price: ''
        }
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
      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-semibold tracking-tight mb-2">Meu Perfil</h1>
          <p className="text-muted-foreground">Gerencie suas informações pessoais e configurações</p>
        </div>

        {message && (
          <div className={`mb-6 rounded-xl border px-4 py-3 text-sm ${
            messageType === 'success' 
              ? 'bg-green-50 border-green-200 text-green-700' 
              : 'bg-destructive/10 border-destructive/20 text-destructive'
          }`}>
            {message}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Profile Information */}
          <div className="lg:col-span-2">
            <div className="rounded-xl border bg-card p-6">
              <h2 className="text-lg font-semibold mb-6">Informações Pessoais</h2>
              
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium mb-2">
                      Nome Completo
                    </label>
                    <Input
                      id="name"
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      required
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium mb-2">
                      Email
                    </label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                      required
                    />
                  </div>
                </div>

                <div className="border-t pt-6">
                  <h3 className="text-md font-semibold mb-4">Alterar Senha</h3>
                  <div className="space-y-4">
                    <div>
                      <label htmlFor="currentPassword" className="block text-sm font-medium mb-2">
                        Senha Atual
                      </label>
                      <Input
                        id="currentPassword"
                        type="password"
                        value={formData.currentPassword}
                        onChange={(e) => setFormData(prev => ({ ...prev, currentPassword: e.target.value }))}
                        placeholder="Deixe em branco para não alterar"
                      />
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="newPassword" className="block text-sm font-medium mb-2">
                          Nova Senha
                        </label>
                        <Input
                          id="newPassword"
                          type="password"
                          value={formData.newPassword}
                          onChange={(e) => setFormData(prev => ({ ...prev, newPassword: e.target.value }))}
                          placeholder="Mínimo 6 caracteres"
                        />
                      </div>
                      
                      <div>
                        <label htmlFor="confirmPassword" className="block text-sm font-medium mb-2">
                          Confirmar Nova Senha
                        </label>
                        <Input
                          id="confirmPassword"
                          type="password"
                          value={formData.confirmPassword}
                          onChange={(e) => setFormData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                          placeholder="Confirme a nova senha"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button type="submit">
                    Salvar Alterações
                  </Button>
                </div>
              </form>
            </div>
          </div>

          {/* Plan Information */}
          <div className="space-y-6">
            {/* Current Plan */}
            {user && getPlanDetails && (
              <div className="rounded-xl border bg-card p-6">
                <h2 className="text-lg font-semibold mb-4">Plano Atual</h2>
                
                <div className="space-y-4">
                  <div>
                    <h3 className="font-semibold text-primary">{getPlanDetails(user.plan).name}</h3>
                    <p className="text-sm text-muted-foreground">{getPlanDetails(user.plan).description}</p>
                  </div>
                  
                  <div className="text-lg font-semibold">
                    {getPlanDetails(user.plan).price}
                  </div>
                  
                  <div>
                    <h4 className="text-sm font-medium mb-2">Recursos inclusos:</h4>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      {getPlanDetails(user.plan).features.map((feature, index) => (
                        <li key={index} className="flex items-center">
                          <svg className="w-4 h-4 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </div>
                  
                  {user.plan !== 'ENTERPRISE' && (
                    <Link href="/plans">
                      <Button className="w-full">
                        Fazer Upgrade
                      </Button>
                    </Link>
                  )}
                </div>
              </div>
            )}

            {/* Account Info */}
            {user && (
              <div className="rounded-xl border bg-card p-6">
                <h2 className="text-lg font-semibold mb-4">Informações da Conta</h2>
                
                <div className="space-y-3 text-sm">
                  <div>
                    <span className="text-muted-foreground">Membro desde:</span>
                    <div className="font-medium">
                      {new Date(user.createdAt).toLocaleDateString('pt-BR', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </div>
                  </div>
                  
                  {user.lastLogin && (
                    <div>
                      <span className="text-muted-foreground">Último acesso:</span>
                      <div className="font-medium">
                        {new Date(user.lastLogin).toLocaleDateString('pt-BR', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}