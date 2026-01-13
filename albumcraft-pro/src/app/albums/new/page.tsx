import Link from 'next/link'
import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { Button } from '@/components/ui/button'
import { DashboardNavbar } from '@/shared/components/navbar'
import { AUTH_COOKIE_NAME } from '@/core/auth/cookies'
import { JWTConfig } from '@/core/auth/jwt'

export default async function NewProjectPage() {
  const cookieStore = await cookies()
  const token = cookieStore.get(AUTH_COOKIE_NAME)?.value

  if (!token) {
    redirect('/auth/login')
  }

  const verification = await JWTConfig.verifyToken(token)
  if (!verification.valid || !verification.payload) {
    redirect('/auth/login')
  }

  return (
    <div className="min-h-screen bg-background">
      <DashboardNavbar />

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold tracking-tight mb-4">Criar Novo Projeto</h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Escolha como você deseja criar seus álbuns. Você pode criar um álbum individual ou múltiplos álbuns de uma só vez.
          </p>
        </div>

        {/* Creation Options */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {/* Single Album Option */}
          <div className="rounded-xl border bg-card p-8 text-center hover:bg-accent/50 transition-colors group">
            <div className="p-4 bg-primary/10 rounded-lg w-fit mx-auto mb-6 group-hover:bg-primary/20 transition-colors">
              <svg className="w-12 h-12 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>

            <h3 className="text-2xl font-bold mb-4">Criar Álbum</h3>
            <p className="text-muted-foreground mb-6 leading-relaxed">
              Ideal para projetos individuais. Configure um único álbum com suas especificações personalizadas.
            </p>

            <div className="space-y-3 mb-8 text-sm text-muted-foreground">
              <div className="flex items-center justify-center space-x-2">
                <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>Configuração detalhada</span>
              </div>
              <div className="flex items-center justify-center space-x-2">
                <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>Upload de fotos individual</span>
              </div>
              <div className="flex items-center justify-center space-x-2">
                <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>Personalização completa</span>
              </div>
            </div>

            <Link href="/albums/new/single" className="w-full">
              <Button className="w-full" size="lg">
                Criar Álbum Individual
              </Button>
            </Link>
          </div>

          {/* Multiple Albums Option */}
          <div className="rounded-xl border bg-card p-8 text-center hover:bg-accent/50 transition-colors group">
            <div className="p-4 bg-blue-100 rounded-lg w-fit mx-auto mb-6 group-hover:bg-blue-200 transition-colors">
              <svg className="w-12 h-12 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
              </svg>
            </div>

            <h3 className="text-2xl font-bold mb-4">Criar Diversos Álbuns</h3>
            <p className="text-muted-foreground mb-6 leading-relaxed">
              Perfeito para profissionais. Crie múltiplos álbuns simultaneamente com configurações otimizadas.
            </p>

            <div className="space-y-3 mb-8 text-sm text-muted-foreground">
              <div className="flex items-center justify-center space-x-2">
                <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>Criação em lote</span>
              </div>
              <div className="flex items-center justify-center space-x-2">
                <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>Configurações rápidas</span>
              </div>
              <div className="flex items-center justify-center space-x-2">
                <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>Fluxo otimizado</span>
              </div>
            </div>

            <Link href="/albums/new/batch" className="w-full">
              <Button
                variant="outline"
                className="w-full border-blue-200 text-blue-600 hover:bg-blue-50"
                size="lg"
              >
                Criar Múltiplos Álbuns
              </Button>
            </Link>
          </div>
        </div>

        {/* Back Button */}
        <div className="text-center mt-12">
          <Link href="/dashboard">
            <Button variant="ghost" className="text-muted-foreground hover:text-foreground">
              ← Voltar ao Dashboard
            </Button>
          </Link>
        </div>
      </main>
    </div>
  )
}