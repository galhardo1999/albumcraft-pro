'use client'

import Link from 'next/link'
import { useAuth } from '@/hooks/useAuth'

export function DashboardNavbar() {
    const { logout } = useAuth()

    return (
        <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="max-w-7xl mx-auto px-6">
                <div className="flex justify-between items-center h-16">
                    {/* Logo */}
                    <Link href="/dashboard" className="flex items-center">
                        <h1 className="text-xl font-semibold tracking-tight">AlbumCraft Pro</h1>
                    </Link>

                    {/* Navigation Links */}
                    <div className="hidden md:flex items-center space-x-8">
                        <Link
                            href="/dashboard"
                            className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                        >
                            Dashboard
                        </Link>
                        <Link
                            href="/albums"
                            className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                        >
                            Meus Álbuns
                        </Link>
                        <Link
                            href="/profile"
                            className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                        >
                            Perfil
                        </Link>
                        <button
                            onClick={() => logout()}
                            className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                        >
                            Sair
                        </button>
                    </div>

                    {/* Mobile menu button */}
                    <div className="md:hidden">
                        <button
                            onClick={() => logout()}
                            className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                        >
                            Sair
                        </button>
                    </div>
                </div>
            </div>
        </nav>
    )
}
