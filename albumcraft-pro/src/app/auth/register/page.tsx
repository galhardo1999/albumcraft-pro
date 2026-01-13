import { RegisterForm } from '@/features/auth/components/register-form'
import Link from 'next/link'

export default function RegisterPage() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="w-full max-w-sm space-y-8">
        {/* Header */}
        <div className="text-center space-y-2">
          <Link href="/" className="inline-block">
            <h1 className="text-2xl font-semibold tracking-tight">AlbumCraft Pro</h1>
          </Link>
          <div className="space-y-1">
            <h2 className="text-xl font-medium">Crie sua conta gratuita</h2>
            <p className="text-sm text-muted-foreground">
              Comece a criar seus álbuns profissionais
            </p>
          </div>
        </div>

        <RegisterForm />
      </div>
    </div>
  )
}