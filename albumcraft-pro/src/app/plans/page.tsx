'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

interface UserProfile {
  id: string
  email: string
  name: string
  avatarUrl?: string
  plan: 'FREE' | 'PRO' | 'ENTERPRISE'
  createdAt: string
  lastLogin?: string
}

interface PlanFeature {
  text: string
  included: boolean
}

interface Plan {
  id: 'FREE' | 'PRO' | 'ENTERPRISE'
  name: string
  price: number
  period: string
  description: string
  features: PlanFeature[]
  popular?: boolean
  buttonText: string
  buttonVariant: 'outline' | 'default' | 'secondary'
}

const plans: Plan[] = [
  {
    id: 'FREE',
    name: 'Gratuito',
    price: 0,
    period: 'Sempre gratuito',
    description: 'Perfeito para começar',
    features: [
      { text: 'Até 3 álbuns', included: true },
      { text: 'Até 50 fotos por álbum', included: true },
      { text: 'Templates básicos', included: true },
      { text: 'Exportação em PDF', included: true },
      { text: 'Suporte por email', included: false },
      { text: 'Templates premium', included: false },
      { text: 'Álbuns ilimitados', included: false },
      { text: 'API personalizada', included: false }
    ],
    buttonText: 'Plano Atual',
    buttonVariant: 'outline'
  },
  {
    id: 'PRO',
    name: 'Pro',
    price: 29.90,
    period: 'por mês',
    description: 'Para usuários avançados',
    popular: true,
    features: [
      { text: 'Álbuns ilimitados', included: true },
      { text: 'Até 500 fotos por álbum', included: true },
      { text: 'Todos os templates', included: true },
      { text: 'Exportação em alta qualidade', included: true },
      { text: 'Suporte prioritário', included: true },
      { text: 'Backup automático', included: true },
      { text: 'Colaboração em equipe', included: false },
      { text: 'API personalizada', included: false }
    ],
    buttonText: 'Fazer Upgrade',
    buttonVariant: 'default'
  },
  {
    id: 'ENTERPRISE',
    name: 'Enterprise',
    price: 99.90,
    period: 'por mês',
    description: 'Para empresas e equipes',
    features: [
      { text: 'Tudo do plano Pro', included: true },
      { text: 'Fotos ilimitadas por álbum', included: true },
      { text: 'Templates personalizados', included: true },
      { text: 'API personalizada', included: true },
      { text: 'Suporte dedicado', included: true },
      { text: 'Colaboração em equipe', included: true },
      { text: 'Analytics avançados', included: true },
      { text: 'SLA garantido', included: true }
    ],
    buttonText: 'Contatar Vendas',
    buttonVariant: 'secondary'
  }
]

export default function PlansPage() {
  const [user, setUser] = useState<UserProfile | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [upgradeLoading, setUpgradeLoading] = useState<string | null>(null)
  const router = useRouter()

  const checkAuth = useCallback(async () => {
    try {
      const response = await fetch('/api/auth/me', {
        credentials: 'include'
      })

      if (response.ok) {
        const userData = await response.json()
        if (userData.success && userData.data?.user) {
          setUser(userData.data.user)
        } else {
          router.push('/auth/login')
        }
      } else {
        router.push('/auth/login')
      }
    } catch (error) {
      console.error('Error checking auth:', error)
      router.push('/auth/login')
    } finally {
      setIsLoading(false)
    }
  }, [router])

  useEffect(() => {
    checkAuth()
  }, [checkAuth])

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { 
        method: 'POST',
        credentials: 'include'
      })
      
      document.cookie = 'auth-token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;'
      router.push('/auth/login')
    } catch (err) {
      console.error('Logout error:', err)
    }
  }

  const handleUpgrade = async (planId: string) => {
    setUpgradeLoading(planId)
    
    try {
      // Simular upgrade (implementar integração com sistema de pagamento)
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      // Por enquanto, apenas simular o upgrade
      alert(`Upgrade para o plano ${planId} será implementado em breve!`)
      
    } catch (error) {
      console.error('Error upgrading plan:', error)
      alert('Erro ao fazer upgrade. Tente novamente.')
    } finally {
      setUpgradeLoading(null)
    }
  }

  const getButtonText = (plan: Plan) => {
    if (!user) return plan.buttonText
    
    if (user.plan === plan.id) {
      return 'Plano Atual'
    } else if (user.plan === 'FREE' && plan.id !== 'FREE') {
      return 'Fazer Upgrade'
    } else if (user.plan === 'PRO' && plan.id === 'ENTERPRISE') {
      return 'Fazer Upgrade'
    } else if (user.plan === 'PRO' && plan.id === 'FREE') {
      return 'Fazer Downgrade'
    } else if (user.plan === 'ENTERPRISE' && plan.id !== 'ENTERPRISE') {
      return 'Fazer Downgrade'
    }
    
    return plan.buttonText
  }

  const getButtonVariant = (plan: Plan) => {
    if (!user) return plan.buttonVariant
    
    if (user.plan === plan.id) {
      return 'outline'
    }
    
    return plan.buttonVariant
  }

  const isButtonDisabled = (plan: Plan) => {
    return user?.plan === plan.id || upgradeLoading === plan.id
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent"></div>
      </div>
    )
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
                className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
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
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold tracking-tight mb-4">Escolha seu Plano</h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Selecione o plano ideal para suas necessidades de criação de álbuns
          </p>
          {user && (
            <div className="mt-4 inline-flex items-center px-3 py-1 rounded-full text-sm bg-primary/10 text-primary">
              Plano atual: <span className="font-semibold ml-1">{user.plan}</span>
            </div>
          )}
        </div>

        {/* Plans Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className={`rounded-xl border bg-card p-8 relative ${
                plan.popular ? 'border-primary shadow-lg scale-105' : ''
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <span className="bg-primary text-primary-foreground px-4 py-1 rounded-full text-sm font-medium">
                    Mais Popular
                  </span>
                </div>
              )}

              <div className="text-center mb-8">
                <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
                <p className="text-muted-foreground mb-4">{plan.description}</p>
                <div className="mb-4">
                  <span className="text-4xl font-bold">
                    {plan.price === 0 ? 'Grátis' : `R$ ${plan.price.toFixed(2).replace('.', ',')}`}
                  </span>
                  {plan.price > 0 && (
                    <span className="text-muted-foreground ml-2">{plan.period}</span>
                  )}
                </div>
              </div>

              <div className="space-y-4 mb-8">
                {plan.features.map((feature, index) => (
                  <div key={index} className="flex items-center">
                    <svg 
                      className={`w-5 h-5 mr-3 ${
                        feature.included ? 'text-green-500' : 'text-muted-foreground'
                      }`} 
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24"
                    >
                      <path 
                        strokeLinecap="round" 
                        strokeLinejoin="round" 
                        strokeWidth={2} 
                        d={feature.included ? "M5 13l4 4L19 7" : "M6 18L18 6M6 6l12 12"} 
                      />
                    </svg>
                    <span className={feature.included ? '' : 'text-muted-foreground line-through'}>
                      {feature.text}
                    </span>
                  </div>
                ))}
              </div>

              <Button
                className={`w-full ${
                  plan.popular ? 'bg-primary hover:bg-primary/90' : ''
                }`}
                variant={getButtonVariant(plan)}
                disabled={isButtonDisabled(plan)}
                onClick={() => !isButtonDisabled(plan) && handleUpgrade(plan.id)}
              >
                {upgradeLoading === plan.id ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-current border-t-transparent mr-2"></div>
                    Processando...
                  </div>
                ) : (
                  getButtonText(plan)
                )}
              </Button>
            </div>
          ))}
        </div>

        {/* FAQ Section */}
        <div className="mt-16 text-center">
          <h2 className="text-2xl font-bold mb-8">Perguntas Frequentes</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <div className="rounded-xl border bg-card p-6 text-left">
              <h3 className="font-semibold mb-2">Posso cancelar a qualquer momento?</h3>
              <p className="text-muted-foreground text-sm">
                Sim, você pode cancelar sua assinatura a qualquer momento. Não há taxas de cancelamento.
              </p>
            </div>
            <div className="rounded-xl border bg-card p-6 text-left">
              <h3 className="font-semibold mb-2">Como funciona o upgrade?</h3>
              <p className="text-muted-foreground text-sm">
                O upgrade é instantâneo e você terá acesso imediato a todos os recursos do novo plano.
              </p>
            </div>
            <div className="rounded-xl border bg-card p-6 text-left">
              <h3 className="font-semibold mb-2">Há desconto para pagamento anual?</h3>
              <p className="text-muted-foreground text-sm">
                Sim, oferecemos 20% de desconto para assinaturas anuais em todos os planos pagos.
              </p>
            </div>
            <div className="rounded-xl border bg-card p-6 text-left">
              <h3 className="font-semibold mb-2">Preciso de ajuda para escolher?</h3>
              <p className="text-muted-foreground text-sm">
                Nossa equipe está pronta para ajudar. Entre em contato conosco para uma consultoria gratuita.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}