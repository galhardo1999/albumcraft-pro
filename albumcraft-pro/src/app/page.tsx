'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function HomePage() {
  const router = useRouter()

  useEffect(() => {
    // Verificar se o usuário está autenticado
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/auth/me', {
          credentials: 'include'
        })
        
        if (response.ok) {
          // Usuário autenticado, redirecionar para dashboard
          router.push('/dashboard')
        }
      } catch {
        // Usuário não autenticado, continuar na página inicial
        console.log('User not authenticated')
      }
    }

    checkAuth()
  }, [router])
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold tracking-tight">AlbumCraft Pro</h1>
            </div>
            <nav className="flex items-center space-x-2">
              <Link href="/auth/login">
                <Button variant="ghost" size="sm">Entrar</Button>
              </Link>
              <Link href="/auth/register">
                <Button size="sm">Começar</Button>
              </Link>
            </nav>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="container mx-auto px-6 lg:px-8">
        <section className="flex min-h-[80vh] flex-col items-center justify-center text-center">
          <div className="max-w-4xl space-y-8">
            <h1 className="text-4xl font-bold tracking-tight sm:text-6xl lg:text-7xl text-balance">
              Crie álbuns de fotos{' '}
              <span className="text-muted-foreground">profissionais</span>
            </h1>
            <p className="mx-auto max-w-2xl text-lg text-muted-foreground text-balance">
              A ferramenta definitiva para fotógrafos criarem layouts incríveis. 
              Interface intuitiva, templates profissionais e exportação em alta qualidade.
            </p>
            <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
              <Link href="/auth/register">
                <Button size="lg" className="w-full sm:w-auto">
                  Começar gratuitamente
                </Button>
              </Link>
              <Link href="/demo">
                <Button variant="outline" size="lg" className="w-full sm:w-auto">
                  Ver demonstração
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="py-24">
          <div className="mx-auto max-w-6xl">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl text-balance">
                Tudo que você precisa para criar
              </h2>
              <p className="mt-4 text-lg text-muted-foreground text-balance">
                Ferramentas profissionais em uma interface simples e intuitiva
              </p>
            </div>
            
            <div className="grid gap-8 md:grid-cols-3">
              <div className="group relative overflow-hidden rounded-2xl border bg-card p-8 transition-all hover:shadow-lg">
                <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                  <svg className="h-6 w-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <h3 className="mb-2 text-xl font-semibold">Drag & Drop Intuitivo</h3>
                <p className="text-muted-foreground">
                  Arraste e solte suas fotos facilmente. Interface moderna e responsiva para máxima produtividade.
                </p>
              </div>

              <div className="group relative overflow-hidden rounded-2xl border bg-card p-8 transition-all hover:shadow-lg">
                <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                  <svg className="h-6 w-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <h3 className="mb-2 text-xl font-semibold">Templates Profissionais</h3>
                <p className="text-muted-foreground">
                  Biblioteca com 100+ layouts criados por designers. Personalize cada detalhe do seu álbum.
                </p>
              </div>

              <div className="group relative overflow-hidden rounded-2xl border bg-card p-8 transition-all hover:shadow-lg">
                <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                  <svg className="h-6 w-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <h3 className="mb-2 text-xl font-semibold">Exportação Premium</h3>
                <p className="text-muted-foreground">
                  Exporte em alta resolução para impressão ou baixa resolução para aprovação de clientes.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Pricing */}
        <section className="py-24">
          <div className="mx-auto max-w-6xl">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl text-balance">
                Planos simples e transparentes
              </h2>
              <p className="mt-4 text-lg text-muted-foreground text-balance">
                Escolha o plano ideal para o seu negócio
              </p>
            </div>
            
            <div className="grid gap-8 lg:grid-cols-3">
              {/* Free Plan */}
              <div className="relative rounded-2xl border bg-card p-8">
                <div className="mb-8">
                  <h3 className="text-lg font-semibold">Gratuito</h3>
                  <div className="mt-4 flex items-baseline">
                    <span className="text-4xl font-bold tracking-tight">R$ 0</span>
                    <span className="ml-1 text-sm text-muted-foreground">/mês</span>
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">Para começar</p>
                </div>
                <ul className="space-y-3 text-sm">
                  <li className="flex items-center">
                    <svg className="mr-3 h-4 w-4 text-primary" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    Até 3 projetos
                  </li>
                  <li className="flex items-center">
                    <svg className="mr-3 h-4 w-4 text-primary" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    500MB de armazenamento
                  </li>
                  <li className="flex items-center">
                    <svg className="mr-3 h-4 w-4 text-primary" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    10 templates básicos
                  </li>
                </ul>
                <div className="mt-8">
                  <Button variant="outline" className="w-full">Começar grátis</Button>
                </div>
              </div>

              {/* Pro Plan */}
              <div className="relative rounded-2xl border-2 border-primary bg-card p-8">
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="rounded-full bg-primary px-3 py-1 text-xs font-medium text-primary-foreground">
                    Mais popular
                  </span>
                </div>
                <div className="mb-8">
                  <h3 className="text-lg font-semibold">Profissional</h3>
                  <div className="mt-4 flex items-baseline">
                    <span className="text-4xl font-bold tracking-tight">R$ 29</span>
                    <span className="ml-1 text-sm text-muted-foreground">/mês</span>
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">Para profissionais</p>
                </div>
                <ul className="space-y-3 text-sm">
                  <li className="flex items-center">
                    <svg className="mr-3 h-4 w-4 text-primary" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    Projetos ilimitados
                  </li>
                  <li className="flex items-center">
                    <svg className="mr-3 h-4 w-4 text-primary" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    10GB de armazenamento
                  </li>
                  <li className="flex items-center">
                    <svg className="mr-3 h-4 w-4 text-primary" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    100+ templates premium
                  </li>
                  <li className="flex items-center">
                    <svg className="mr-3 h-4 w-4 text-primary" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    Exportação HD sem marca d&apos;água
                  </li>
                </ul>
                <div className="mt-8">
                  <Button className="w-full">Começar teste grátis</Button>
                </div>
              </div>

              {/* Enterprise Plan */}
              <div className="relative rounded-2xl border bg-card p-8">
                <div className="mb-8">
                  <h3 className="text-lg font-semibold">Enterprise</h3>
                  <div className="mt-4 flex items-baseline">
                    <span className="text-4xl font-bold tracking-tight">R$ 99</span>
                    <span className="ml-1 text-sm text-muted-foreground">/mês</span>
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">Para equipes</p>
                </div>
                <ul className="space-y-3 text-sm">
                  <li className="flex items-center">
                    <svg className="mr-3 h-4 w-4 text-primary" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    Tudo do PRO +
                  </li>
                  <li className="flex items-center">
                    <svg className="mr-3 h-4 w-4 text-primary" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    100GB de armazenamento
                  </li>
                  <li className="flex items-center">
                    <svg className="mr-3 h-4 w-4 text-primary" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    White-label
                  </li>
                  <li className="flex items-center">
                    <svg className="mr-3 h-4 w-4 text-primary" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    API access
                  </li>
                </ul>
                <div className="mt-8">
                  <Button variant="outline" className="w-full">Falar com vendas</Button>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t bg-muted/30">
        <div className="container mx-auto px-6 py-12 lg:px-8">
          <div className="text-center">
            <h3 className="text-lg font-semibold">AlbumCraft Pro</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              A ferramenta definitiva para criação de álbuns profissionais
            </p>
            <div className="mt-6 text-xs text-muted-foreground">
              © 2024 AlbumCraft Pro. Todos os direitos reservados.
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
