import { LoginForm } from '@/features/auth/components/login-form'
import Link from 'next/link'

export default function LoginPage() {
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

        <LoginForm />
      </div>
    </div>
  )
}