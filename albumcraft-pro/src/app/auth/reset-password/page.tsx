'use client'

import { useState, useEffect, Suspense } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Eye, EyeOff } from 'lucide-react'

function ResetPasswordForm() {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [tokenValid, setTokenValid] = useState<boolean | null>(null)
  
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get('token')

  useEffect(() => {
    if (!token) {
      setError('Token de recuperação não encontrado')
      setTokenValid(false)
      return
    }

    // Verificar se o token é válido
    const verifyToken = async () => {
      try {
        const response = await fetch('/api/auth/verify-reset-token', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ token }),
        })

        if (response.ok) {
          setTokenValid(true)
        } else {
          setTokenValid(false)
          setError('Link de recuperação inválido ou expirado')
        }
      } catch {
        setTokenValid(false)
        setError('Erro ao verificar link de recuperação')
      }
    }

    verifyToken()
  }, [token])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    // Validação básica
    if (password !== confirmPassword) {
      setError('As senhas não coincidem')
      setIsLoading(false)
      return
    }

    if (password.length < 8) {
      setError('A senha deve ter pelo menos 8 caracteres')
      setIsLoading(false)
      return
    }

    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token, password }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error?.message || 'Erro ao redefinir senha')
      }

      setSuccess(true)
      
      // Redirecionar para login após 3 segundos
      setTimeout(() => {
        router.push('/auth/login')
      }, 3000)
    } catch {
      setError('Erro ao redefinir senha. Tente novamente.')
    } finally {
      setIsLoading(false)
    }
  }

  if (tokenValid === null) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <div className="w-full max-w-sm space-y-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="text-sm text-muted-foreground mt-4">Verificando link...</p>
          </div>
        </div>
      </div>
    )
  }

  if (tokenValid === false) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <div className="w-full max-w-sm space-y-8">
          {/* Header */}
          <div className="text-center space-y-2">
            <Link href="/" className="inline-block">
              <h1 className="text-2xl font-semibold tracking-tight">AlbumCraft Pro</h1>
            </Link>
            <div className="space-y-1">
              <h2 className="text-xl font-medium">Link inválido</h2>
              <p className="text-sm text-muted-foreground">
                Este link de recuperação é inválido ou expirou
              </p>
            </div>
          </div>
          
          {/* Error content */}
          <div className="space-y-6">
            <div className="rounded-xl bg-destructive/10 border border-destructive/20 text-destructive px-4 py-6 text-center">
              <div className="flex justify-center mb-3">
                <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <p className="text-sm font-medium">
                {error || 'Link de recuperação inválido ou expirado'}
              </p>
            </div>

            <div className="text-center text-sm space-y-2">
              <Link href="/auth/forgot-password" className="text-primary hover:text-primary/80 font-medium">
                Solicitar novo link de recuperação
              </Link>
            </div>

            <div className="text-center text-sm">
              <Link href="/auth/login" className="text-primary hover:text-primary/80 font-medium">
                Voltar para o login
              </Link>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (success) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <div className="w-full max-w-sm space-y-8">
          {/* Header */}
          <div className="text-center space-y-2">
            <Link href="/" className="inline-block">
              <h1 className="text-2xl font-semibold tracking-tight">AlbumCraft Pro</h1>
            </Link>
            <div className="space-y-1">
              <h2 className="text-xl font-medium">Senha redefinida!</h2>
              <p className="text-sm text-muted-foreground">
                Sua senha foi alterada com sucesso
              </p>
            </div>
          </div>
          
          {/* Success content */}
          <div className="space-y-6">
            <div className="rounded-xl bg-primary/10 border border-primary/20 text-primary px-4 py-6 text-center">
              <div className="flex justify-center mb-3">
                <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <p className="text-sm font-medium">
                Você será redirecionado para o login em alguns segundos
              </p>
            </div>

            <div className="text-center text-sm">
              <Link href="/auth/login" className="text-primary hover:text-primary/80 font-medium">
                Ir para o login agora
              </Link>
            </div>
          </div>
        </div>
      </div>
    )
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
            <h2 className="text-xl font-medium">Redefinir senha</h2>
            <p className="text-sm text-muted-foreground">
              Digite sua nova senha
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
              <label htmlFor="password" className="text-sm font-medium">
                Nova senha
              </label>
              <div className="relative">
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Mínimo 8 caracteres"
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

            <div className="space-y-2">
              <label htmlFor="confirmPassword" className="text-sm font-medium">
                Confirmar nova senha
              </label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  autoComplete="new-password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirme sua nova senha"
                  disabled={isLoading}
                  className="pr-10"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-muted-foreground hover:text-foreground transition-colors"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  disabled={isLoading}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              disabled={isLoading || !password || !confirmPassword}
              className="w-full"
              size="lg"
            >
              {isLoading ? 'Redefinindo...' : 'Redefinir senha'}
            </Button>
          </form>

          {/* Back to login */}
          <div className="text-center text-sm">
            <Link href="/auth/login" className="text-primary hover:text-primary/80 font-medium">
              Voltar para o login
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <div className="w-full max-w-sm space-y-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="text-sm text-muted-foreground mt-4">Carregando...</p>
          </div>
        </div>
      </div>
    }>
      <ResetPasswordForm />
    </Suspense>
  )
}