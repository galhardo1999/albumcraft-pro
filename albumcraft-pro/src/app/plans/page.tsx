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

interface PlanFeature {
  name: string
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
  buttonVariant: 'outline' | 'default' | 'premium'
}

const plans: Plan[] = [
  {
    id: 'FREE',
    name: 'Gratuito',
    price: 0,
    period: 'Sempre gratuito',
    description: 'Perfeito para começar e explorar as funcionalidades básicas',
    features: [
      { name: 'Até 5 projetos', included: true },
      { name: '1GB de armazenamento', included: true },
      { name: 'Templates básicos', included: true },
      { name: 'Exportação em PDF', included: true },
      { name: 'Suporte por email', included: true },
      { name: 'Templates premium', included: false },
      { name: 'Colaboração em equipe', included: false },
      { name: 'API personalizada', included: false },
    ],
    buttonText: 'Plano Atual',
    buttonVariant: 'outline'
  },
  {
    id: 'PRO',
    name: 'Pro',
    price: 29,
    period: 'por mês',
    description: 'Ideal para fotógrafos profissionais e pequenos estúdios',
    features: [
      { name: 'Até 50 projetos', included: true },
      { name: '100GB de armazenamento', included: true },
      { name: 'Todos os templates', included: true },
      { name: 'Exportação em alta qualidade', included: true },
      { name: 'Suporte prioritário', included: true },
      { name: 'Templates premium', included: true },
      { name: 'Marca personalizada', included: true },
      { name: 'API personalizada', included: false },
    ],
    popular: true,
    buttonText: 'Fazer Upgrade',
    buttonVariant: 'default'
  },
  {
    id: 'ENTERPRISE',
    name: 'Enterprise',
    price: 99,
    period: 'por mês',
    description: 'Solução completa para grandes estúdios e empresas',
    features: [
      { name: 'Projetos ilimitados', included: true },
      { name: 'Armazenamento ilimitado', included: true },
      { name: 'Templates personalizados', included: true },
      { name: 'Exportação profissional', included: true },
      { name: 'Suporte dedicado 24/7', included: true },
      { name: 'Colaboração em equipe', included: true },
      { name: 'Marca personalizada', included: true },
      { name: 'API personalizada', included: true },
    ],
    buttonText: 'Contatar Vendas',
    buttonVariant: 'premium'
  }
]

export default function PlansPage() {
  const [user, setUser] = useState<UserProfile | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [upgradeLoading, setUpgradeLoading] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
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
      console.error('Erro ao verificar autenticação:', error)
      router.push('/auth/login')
    } finally {
      setIsLoading(false)
    }
  }

  const handleUpgrade = async (planId: string) => {
    if (planId === 'FREE' || planId === user?.plan) return

    setUpgradeLoading(planId)
    
    try {
      // Aqui você implementaria a integração com o sistema de pagamento
      // Por enquanto, vamos simular um upgrade
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      alert(`Upgrade para o plano ${planId} será implementado em breve!`)
    } catch (error) {
      console.error('Erro no upgrade:', error)
      alert('Erro ao processar upgrade. Tente novamente.')
    } finally {
      setUpgradeLoading(null)
    }
  }

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { 
        method: 'POST',
        credentials: 'include'
      })
      
      document.cookie = 'auth-token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;'
      router.push('/auth/login')
    } catch (error) {
      console.error('Erro ao fazer logout:', error)
    }
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
              <Link 
                href="/plans" 
                className="text-sm font-medium text-primary"
              >
                Planos
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
      <main className="max-w-7xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold tracking-tight mb-4">
            Escolha o plano ideal para você
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Desbloqueie todo o potencial do AlbumCraft Pro com recursos avançados 
            e suporte dedicado para levar seus projetos ao próximo nível.
          </p>
          {user && (
            <div className="mt-6 inline-flex items-center px-4 py-2 rounded-full bg-muted text-sm">
              <div className={`w-2 h-2 rounded-full mr-2 ${
                user.plan === 'FREE' ? 'bg-gray-400' :
                user.plan === 'PRO' ? 'bg-blue-500' :
                'bg-purple-600'
              }`}></div>
              Plano atual: {user.plan === 'FREE' ? 'Gratuito' : user.plan === 'PRO' ? 'Pro' : 'Enterprise'}
            </div>
          )}
        </div>

        {/* Plans Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className={`relative rounded-2xl border p-8 ${
                plan.popular 
                  ? 'border-primary shadow-lg scale-105' 
                  : 'border-border'
              } ${
                user?.plan === plan.id 
                  ? 'bg-muted/50' 
                  : 'bg-card'
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <span className="bg-primary text-primary-foreground px-4 py-1 rounded-full text-sm font-medium">
                    Mais Popular
                  </span>
                </div>
              )}

              {user?.plan === plan.id && (
                <div className="absolute -top-4 right-4">
                  <span className="bg-green-500 text-white px-3 py-1 rounded-full text-sm font-medium">
                    Atual
                  </span>
                </div>
              )}

              <div className="text-center mb-8">
                <h3 className="text-xl font-semibold mb-2">{plan.name}</h3>
                <div className="mb-4">
                  <span className="text-4xl font-bold">R$ {plan.price}</span>
                  {plan.price > 0 && (
                    <span className="text-muted-foreground ml-1">/{plan.period.split(' ')[1]}</span>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">{plan.description}</p>
              </div>

              <ul className="space-y-3 mb-8">
                {plan.features.map((feature, index) => (
                  <li key={index} className="flex items-center space-x-3">
                    <svg 
                      className={`w-5 h-5 ${
                        feature.included ? 'text-green-500' : 'text-gray-300'
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
                    <span className={`text-sm ${
                      feature.included ? '' : 'text-muted-foreground line-through'
                    }`}>
                      {feature.name}
                    </span>
                  </li>
                ))}
              </ul>

              <button
                onClick={() => handleUpgrade(plan.id)}
                disabled={
                  upgradeLoading === plan.id || 
                  user?.plan === plan.id ||
                  (plan.id === 'FREE')
                }
                className={`w-full py-3 px-4 rounded-lg font-medium transition-all duration-200 ${
                  plan.buttonVariant === 'default'
                    ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                    : plan.buttonVariant === 'premium'
                    ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white hover:from-purple-700 hover:to-blue-700 shadow-lg hover:shadow-xl'
                    : 'border border-border text-muted-foreground hover:bg-muted'
                } ${
                  (user?.plan === plan.id || plan.id === 'FREE') 
                    ? 'opacity-50 cursor-not-allowed' 
                    : ''
                }`}
              >
                {upgradeLoading === plan.id ? (
                  <div className="flex items-center justify-center space-x-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-current border-t-transparent"></div>
                    <span>Processando...</span>
                  </div>
                ) : (
                  user?.plan === plan.id ? 'Plano Atual' : plan.buttonText
                )}
              </button>
            </div>
          ))}
        </div>

        {/* FAQ Section */}
        <div className="mt-16 max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-center mb-8">Perguntas Frequentes</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <h3 className="font-semibold mb-2">Posso cancelar a qualquer momento?</h3>
              <p className="text-sm text-muted-foreground">
                Sim, você pode cancelar sua assinatura a qualquer momento. 
                Não há taxas de cancelamento ou contratos de longo prazo.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">O que acontece com meus projetos se eu cancelar?</h3>
              <p className="text-sm text-muted-foreground">
                Seus projetos permanecerão salvos, mas você terá acesso limitado 
                aos recursos do plano gratuito até renovar sua assinatura.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Posso fazer upgrade ou downgrade do meu plano?</h3>
              <p className="text-sm text-muted-foreground">
                Sim, você pode alterar seu plano a qualquer momento. 
                As mudanças entram em vigor imediatamente.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Há desconto para pagamento anual?</h3>
              <p className="text-sm text-muted-foreground">
                Sim, oferecemos 20% de desconto para assinaturas anuais. 
                Entre em contato conosco para mais detalhes.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}