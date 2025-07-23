'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface User {
  id: string;
  email: string;
  name: string;
  plan: string;
  isAdmin: boolean;
}

interface AuthState {
  user: User | null;
  loading: boolean;
  isAuthenticated: boolean;
}

export function useAuth() {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    loading: true,
    isAuthenticated: false
  });

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const response = await fetch('/api/auth/me');
      
      if (response.ok) {
        const data = await response.json();
        setAuthState({
          user: data.data.user,
          loading: false,
          isAuthenticated: true
        });
      } else {
        setAuthState({
          user: null,
          loading: false,
          isAuthenticated: false
        });
      }
    } catch (error) {
      console.error('Erro ao verificar autenticação:', error);
      setAuthState({
        user: null,
        loading: false,
        isAuthenticated: false
      });
    }
  };

  return authState;
}

interface AdminProtectedRouteProps {
  children: React.ReactNode;
}

export function AdminProtectedRoute({ children }: AdminProtectedRouteProps) {
  const { user, loading, isAuthenticated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (!isAuthenticated) {
        // Não autenticado - redirecionar para login
        router.push('/auth/login');
        return;
      }

      if (!user?.isAdmin) {
        // Autenticado mas não é admin - redirecionar para dashboard
        router.push('/dashboard');
        return;
      }
    }
  }, [loading, isAuthenticated, user, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Verificando permissões...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !user?.isAdmin) {
    return null; // Não renderizar nada enquanto redireciona
  }

  return <>{children}</>;
}