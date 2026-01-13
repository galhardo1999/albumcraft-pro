import { ForgotPasswordForm } from '@/features/auth/components/forgot-password-form'
import Link from 'next/link'

export default function ForgotPasswordPage() {
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

        <ForgotPasswordForm />
      </div>
    </div>
  )
}