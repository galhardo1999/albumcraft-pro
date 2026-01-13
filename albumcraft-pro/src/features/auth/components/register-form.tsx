'use client'

import { useActionState, useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Eye, EyeOff } from 'lucide-react'
import { registerAction } from '../actions/register.action'

export function RegisterForm() {
    const [state, action, isPending] = useActionState(registerAction, null)
    const [showPassword, setShowPassword] = useState(false)
    const [confirmPassword, setConfirmPassword] = useState('')
    const [password, setPassword] = useState('')
    const [validationError, setValidationError] = useState('')
    const router = useRouter()

    useEffect(() => {
        if (state?.success) {
            router.push('/dashboard')
        }
    }, [state?.success, router])

    const handleSubmit = (formData: FormData) => {
        // Client-side validation for confirm password
        setValidationError('')
        if (password !== confirmPassword) {
            setValidationError('As senhas não coincidem')
            return
        }

        // Call server action
        action(formData)
    }

    return (
        <div className="space-y-6">
            <form action={handleSubmit} className="space-y-4">
                {(state?.error || validationError) && (
                    <div className="rounded-xl bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 text-sm">
                        {state?.error || validationError}
                    </div>
                )}

                <div className="space-y-2">
                    <label htmlFor="name" className="text-sm font-medium">
                        Nome completo
                    </label>
                    <Input
                        id="name"
                        name="name"
                        type="text"
                        autoComplete="name"
                        required
                        placeholder="Seu nome completo"
                        disabled={isPending}
                    />
                    {state?.fieldErrors?.name && (
                        <p className="text-sm text-destructive">{state.fieldErrors.name[0]}</p>
                    )}
                </div>

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
                            autoComplete="new-password"
                            required
                            placeholder="Mínimo 8 caracteres"
                            disabled={isPending}
                            className="pr-10"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
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

                <div className="space-y-2">
                    <label htmlFor="confirmPassword" className="text-sm font-medium">
                        Confirmar senha
                    </label>
                    <div className="relative">
                        <Input
                            id="confirmPassword"
                            name="confirmPassword"
                            type={showPassword ? "text" : "password"}
                            autoComplete="new-password"
                            required
                            placeholder="Confirme sua senha"
                            disabled={isPending}
                            className="pr-10"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                        />
                    </div>
                </div>

                <div className="flex items-center space-x-2">
                    <input
                        id="terms"
                        name="terms"
                        type="checkbox"
                        required
                        className="h-4 w-4 rounded text-primary focus:ring-primary focus:ring-offset-0"
                    />
                    <label htmlFor="terms" className="text-sm text-muted-foreground">
                        Concordo com os{' '}
                        <Link href="#" className="text-primary hover:text-primary/80 font-medium">
                            Termos de Uso
                        </Link>{' '}
                        e{' '}
                        <Link href="#" className="text-primary hover:text-primary/80 font-medium">
                            Política de Privacidade
                        </Link>
                    </label>
                </div>

                <Button
                    type="submit"
                    disabled={isPending}
                    className="w-full"
                    size="lg"
                >
                    {isPending ? 'Criando conta...' : 'Criar conta gratuita'}
                </Button>
            </form>

            {/* Sign in link */}
            <div className="text-center text-sm">
                <span className="text-muted-foreground">Já tem uma conta? </span>
                <Link href="/auth/login" className="text-primary hover:text-primary/80 font-medium">
                    Entrar
                </Link>
            </div>
        </div>
    )
}
