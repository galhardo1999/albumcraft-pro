'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { 
  LayoutDashboard,
  Users, 
  FolderOpen,
  BarChart3,
  LogOut,
  Menu,
  X,
  Image,
  Images
} from 'lucide-react';

interface AdminSidebarProps {
  activeTab?: string;
  onTabChange?: (tab: string) => void;
}

export function AdminNavbar({ activeTab = 'overview', onTabChange }: AdminSidebarProps) {
  const router = useRouter();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/auth/login');
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
    }
  };

  const navigationItems = [
    {
      id: 'overview',
      label: 'Visão Geral',
      icon: LayoutDashboard,
      href: '/admin'
    },
    {
      id: 'users',
      label: 'Usuários',
      icon: Users,
      href: '/admin/usuarios'
    },
    {
      id: 'projects',
      label: 'Projetos',
      icon: FolderOpen,
      href: '/admin/projetos'
    },
    {
      id: 'photos',
      label: 'Galerias de Fotos',
      icon: Image,
      href: '/admin/galerias'
    },
    {
      id: 'reports',
      label: 'Relatórios',
      icon: BarChart3,
      href: '/admin/relatorios'
    }
  ];

  const handleNavClick = (item: typeof navigationItems[0]) => {
    router.push(item.href);
    setIsMobileMenuOpen(false);
  };

  return (
    <>
      {/* Mobile Header */}
      <div className="lg:hidden bg-white shadow-sm border-b sticky top-0 z-50">
        <div className="flex items-center justify-between h-16 px-4">
          <div className="flex items-center">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </Button>
            <div className="ml-3 flex items-center">
              <div className="h-8 w-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">AC</span>
              </div>
              <h1 className="ml-2 text-lg font-bold text-gray-900">
                AlbumCraft Pro
              </h1>
              <span className="ml-2 px-2 py-1 bg-red-100 text-red-800 text-xs font-medium rounded-full">
                Admin
              </span>
            </div>
          </div>
          
          <div className="flex items-center">
            <Button
              variant="outline"
              size="sm"
              onClick={handleLogout}
              className="flex items-center space-x-1"
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">Sair</span>
            </Button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="border-t border-gray-200 bg-white">
            <div className="px-2 pt-2 pb-3 space-y-1">
              {navigationItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                
                return (
                  <button
                    key={item.id}
                    onClick={() => handleNavClick(item)}
                    className={`
                      w-full flex items-center px-3 py-2 rounded-md text-base font-medium transition-colors
                      ${isActive 
                        ? 'bg-blue-100 text-blue-700 border border-blue-200' 
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                      }
                    `}
                  >
                    <Icon className="h-5 w-5 mr-3" />
                    {item.label}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Desktop Sidebar - Fixed */}
      <div className="hidden lg:flex lg:flex-col lg:fixed lg:inset-y-0 lg:z-50 lg:w-64">
        <div className="flex grow flex-col gap-y-5 overflow-y-auto bg-white border-r border-gray-200 px-6 pb-4">
          {/* Logo */}
          <div className="flex h-16 shrink-0 items-center">
            <div className="flex items-center">
              <div className="h-8 w-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">AC</span>
              </div>
              <h1 className="ml-3 text-lg font-bold text-gray-900">
                AlbumCraft Pro
              </h1>
              <span className="ml-2 px-2 py-1 bg-red-100 text-red-800 text-xs font-medium rounded-full">
                Admin
              </span>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex flex-1 flex-col">
            <ul role="list" className="flex flex-1 flex-col gap-y-7">
              <li>
                <ul role="list" className="-mx-2 space-y-1">
                  {navigationItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = activeTab === item.id;
                    
                    return (
                      <li key={item.id}>
                        <button
                          onClick={() => handleNavClick(item)}
                          className={`
                            group flex gap-x-3 rounded-md p-3 text-sm leading-6 font-semibold w-full transition-colors
                            ${isActive 
                              ? 'bg-blue-50 text-blue-700' 
                              : 'text-gray-700 hover:text-blue-700 hover:bg-gray-50'
                            }
                          `}
                        >
                          <Icon className={`h-6 w-6 shrink-0 ${isActive ? 'text-blue-700' : 'text-gray-400 group-hover:text-blue-700'}`} />
                          {item.label}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </li>

              {/* Bottom Actions */}
              <li className="mt-auto">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleLogout}
                  className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50 p-3"
                >
                  <LogOut className="h-6 w-6 mr-3" />
                  Sair
                </Button>
              </li>
            </ul>
          </nav>
        </div>
      </div>
    </>
  );
}