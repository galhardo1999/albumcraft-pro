import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

interface User {
  id: string
  email: string
  name?: string
  plan: string
}

interface AuthState {
  user: User | null
  isLoading: boolean
  isAuthenticated: boolean
}

export function useAuth(redirectTo?: string) {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    isLoading: true,
    isAuthenticated: false
  })
  const router = useRouter()

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/auth/me', {
          credentials: 'include'
        })
        
        if (response.ok) {
          const data = await response.json()
          if (data.success && data.data?.user) {
            setAuthState({
              user: data.data.user,
              isLoading: false,
              isAuthenticated: true
            })
            return
          }
        }
        
        // Se chegou aqui, não está autenticado
        setAuthState({
          user: null,
          isLoading: false,
          isAuthenticated: false
        })
        
        // Não redirecionar aqui - deixar o middleware fazer isso
        // O redirecionamento duplo pode causar loops
        
      } catch (error) {
        console.error('Auth check failed:', error)
        setAuthState({
          user: null,
          isLoading: false,
          isAuthenticated: false
        })
      }
    }

    checkAuth()
  }, [router, redirectTo])

  const logout = async () => {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include'
      })
    } catch (error) {
      console.error('Logout failed:', error)
    } finally {
      // Limpar estado local
      setAuthState({
        user: null,
        isLoading: false,
        isAuthenticated: false
      })
      
      // Redirecionar para login
      router.push('/auth/login')
    }
  }

  return {
    ...authState,
    logout
  }
}

// Hook específico para páginas protegidas - sem redirecionamento automático
export function useProtectedRoute() {
  const auth = useAuth()
  
  // Se não está autenticado e não está carregando, o middleware já deve ter redirecionado
  // Não fazemos redirecionamento aqui para evitar conflitos
  
  return auth
}