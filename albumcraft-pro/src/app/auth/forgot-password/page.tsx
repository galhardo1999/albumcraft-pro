'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error?.message || 'Erro ao enviar email de recuperação')
      }

      setSuccess(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro inesperado')
    } finally {
      setIsLoading(false)
    }
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
              <h2 className="text-xl font-medium">Email enviado!</h2>
              <p className="text-sm text-muted-foreground">
                Verifique sua caixa de entrada e siga as instruções para redefinir sua senha
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
                Enviamos um link de recuperação para <strong>{email}</strong>
              </p>
              <p className="text-xs mt-2 opacity-80">
                O link expira em 1 hora
              </p>
            </div>

            <div className="text-center text-sm space-y-2">
              <p className="text-muted-foreground">Não recebeu o email?</p>
              <Button
                variant="outline"
                onClick={() => {
                  setSuccess(false)
                  setEmail('')
                }}
                className="w-full"
              >
                Tentar novamente
              </Button>
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

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="w-full max-w-sm space-y-8">
        {/* Header */}
        <div className="text-center space-y-2">
          <Link href="/" className="inline-block">
            <h1 className="text-2xl font-semibold tracking-tight">AlbumCraft Pro</h1>
          </Link>
          <div className="space-y-1">
            <h2 className="text-xl font-medium">Esqueceu sua senha?</h2>
            <p className="text-sm text-muted-foreground">
              Digite seu email para receber um link de recuperação
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

            <Button
              type="submit"
              disabled={isLoading || !email}
              className="w-full"
              size="lg"
            >
              {isLoading ? 'Enviando...' : 'Enviar link de recuperação'}
            </Button>
          </form>

          {/* Back to login */}
          <div className="text-center text-sm">
            <span className="text-muted-foreground">Lembrou da senha? </span>
            <Link href="/auth/login" className="text-primary hover:text-primary/80 font-medium">
              Voltar para o login
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}