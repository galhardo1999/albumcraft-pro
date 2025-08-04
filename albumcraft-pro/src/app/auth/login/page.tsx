'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Eye, EyeOff } from 'lucide-react'
import GoogleLoginButton from '@/components/GoogleLoginButton'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  useEffect(() => {
    // Verificar se há erro nos parâmetros da URL (ex: Google OAuth)
    const urlParams = new URLSearchParams(window.location.search)
    const urlError = urlParams.get('error')
    const errorDetails = urlParams.get('details')
    
    if (urlError) {
      let errorMessage = 'Erro de autenticação'
      
      switch (urlError) {
        case 'google_oauth_error':
          errorMessage = errorDetails ? `Erro do Google: ${decodeURIComponent(errorDetails)}` : 'Erro ao autenticar com Google'
          break
        case 'missing_code':
          errorMessage = 'Código de autorização não recebido'
          break
        case 'invalid_token':
          errorMessage = 'Token de autenticação inválido'
          break
        case 'missing_email':
          errorMessage = 'Email não fornecido pelo Google'
          break
        case 'server_error':
          errorMessage = 'Erro interno do servidor'
          break
      }
      
      setError(errorMessage)
      
      // Limpar parâmetros da URL
      window.history.replaceState({}, document.title, window.location.pathname)
    }
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      })

      const data = await response.json()

      if (!response.ok) {
        // Extrair a mensagem de erro corretamente
        let errorMessage = 'Erro ao fazer login'
        
        if (data.error?.message) {
          errorMessage = data.error.message
        } else if (data.message) {
          errorMessage = data.message
        } else if (data.error?.code) {
          // Mapear códigos de erro para mensagens amigáveis
          switch (data.error.code) {
            case 'INVALID_CREDENTIALS':
              errorMessage = 'Email ou senha incorretos. Verifique suas credenciais e tente novamente.'
              break
            case 'VALIDATION_ERROR':
              errorMessage = 'Dados inválidos. Verifique se o email está correto e a senha foi preenchida.'
              break
            case 'INTERNAL_ERROR':
              errorMessage = 'Erro interno do servidor. Tente novamente em alguns instantes.'
              break
            default:
              errorMessage = 'Erro de autenticação. Tente novamente.'
          }
        }
        
        setError(errorMessage)
        return
      }

      // Verificar se o usuário é admin e redirecionar adequadamente
      if (data.data?.user?.isAdmin) {
        router.push('/admin')
      } else {
        router.push('/dashboard')
      }
    } catch (err) {
      console.error('Login error:', err)
      // Erro de rede ou outro tipo de erro inesperado
      setError('Erro de conexão. Verifique sua internet e tente novamente.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="w-full max-w-sm space-y-8">
        {/* Header */}
        <div className="text-center space-y-2">
          <Link href="/" className="inline-block">
            <h1 className="text-2xl font-semibold tracking-tight">AlbumCraft Pro</h1>
          </Link>
          <div className="space-y-1">
            <h2 className="text-xl font-medium">Bem-vindo de volta</h2>
            <p className="text-sm text-muted-foreground">
              Entre na sua conta para continuar
            </p>
          </div>
        </div>
        
        {/* Form */}
        <div className="space-y-6">
          <form className="space-y-4" onSubmit={handleSubmit}>
            {error && (
              <div className="rounded-xl bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 text-sm">
                {error}
              </div>
            )}
            
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium">
                Email
              </label>
              <Input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu@email.com"
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium">
                Senha
              </label>
              <div className="relative">
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Sua senha"
                  disabled={isLoading}
                  className="pr-10"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-muted-foreground hover:text-foreground transition-colors"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={isLoading}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded text-primary focus:ring-primary focus:ring-offset-0"
                />
                <span className="text-muted-foreground">Lembrar de mim</span>
              </label>

              <Link href="/auth/forgot-password" className="text-primary hover:text-primary/80 font-medium">
                Esqueceu a senha?
              </Link>
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full"
              size="lg"
            >
              {isLoading ? 'Entrando...' : 'Entrar'}
            </Button>
          </form>

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">ou</span>
            </div>
          </div>

          {/* Google Login */}
          <GoogleLoginButton onError={setError} />

          {/* Sign up link */}
          <div className="text-center text-sm">
            <span className="text-muted-foreground">Não tem uma conta? </span>
            <Link href="/auth/register" className="text-primary hover:text-primary/80 font-medium">
              Criar conta gratuita
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}