'use client'

import { useActionState, useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { forgotPasswordAction } from '../actions/forgot-password.action'

export function ForgotPasswordForm() {
    const [state, action, isPending] = useActionState(forgotPasswordAction, null)
    const [email, setEmail] = useState('')

    if (state?.success) {
        return (
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
                        onClick={() => window.location.reload()} // Simple reload to reset state or could expose reset method
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
        )
    }

    return (
        <div className="space-y-6">
            <form action={action} className="space-y-4">
                {state?.error && (
                    <div className="rounded-xl bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 text-sm">
                        {state.error}
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
                        placeholder="seu@email.com"
                        disabled={isPending}
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                    />
                    {state?.fieldErrors?.email && (
                        <p className="text-sm text-destructive">{state.fieldErrors.email[0]}</p>
                    )}
                </div>

                <Button
                    type="submit"
                    disabled={isPending || !email}
                    className="w-full"
                    size="lg"
                >
                    {isPending ? 'Enviando...' : 'Enviar link de recuperação'}
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
    )
}
