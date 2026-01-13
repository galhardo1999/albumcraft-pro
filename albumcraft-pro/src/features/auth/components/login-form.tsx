'use client'

import { useActionState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Eye, EyeOff } from 'lucide-react'
import { useState, useEffect } from 'react'
import { loginAction } from '../actions/login.action'
import GoogleLoginButton from '@/components/GoogleLoginButton'

export function LoginForm() {
    const [state, action, isPending] = useActionState(loginAction, null)
    const [showPassword, setShowPassword] = useState(false)
    const router = useRouter()

    useEffect(() => {
        if (state?.success) {
            router.push('/dashboard')
        }
    }, [state?.success, router])

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
                        defaultValue={state?.fieldErrors?.email?.[0] ? '' : undefined} // Or keep previous value if possible, but form resets on action usually unless controlled
                    />
                    {state?.fieldErrors?.email && (
                        <p className="text-sm text-destructive">{state.fieldErrors.email[0]}</p>
                    )}
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
                            placeholder="Sua senha"
                            disabled={isPending}
                            className="pr-10"
                        />
                        <button
                            type="button"
                            className="absolute inset-y-0 right-0 flex items-center pr-3 text-muted-foreground hover:text-foreground transition-colors"
                            onClick={() => setShowPassword(!showPassword)}
                            disabled={isPending}
                        >
                            {showPassword ? (
                                <EyeOff className="h-4 w-4" />
                            ) : (
                                <Eye className="h-4 w-4" />
                            )}
                        </button>
                    </div>
                    {state?.fieldErrors?.password && (
                        <p className="text-sm text-destructive">{state.fieldErrors.password[0]}</p>
                    )}
                </div>

                <div className="flex items-center justify-between text-sm">
                    <label className="flex items-center space-x-2 cursor-pointer">
                        <input
                            type="checkbox"
                            className="h-4 w-4 rounded text-primary focus:ring-primary focus:ring-offset-0"
                            name="remember"
                        />
                        <span className="text-muted-foreground">Lembrar de mim</span>
                    </label>

                    <Link href="/auth/forgot-password" className="text-primary hover:text-primary/80 font-medium">
                        Esqueceu a senha?
                    </Link>
                </div>

                <Button
                    type="submit"
                    disabled={isPending}
                    className="w-full"
                    size="lg"
                >
                    {isPending ? 'Entrando...' : 'Entrar'}
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
            <GoogleLoginButton />

            {/* Sign up link */}
            <div className="text-center text-sm">
                <span className="text-muted-foreground">Não tem uma conta? </span>
                <Link href="/auth/register" className="text-primary hover:text-primary/80 font-medium">
                    Criar conta gratuita
                </Link>
            </div>
        </div>
    )
}
