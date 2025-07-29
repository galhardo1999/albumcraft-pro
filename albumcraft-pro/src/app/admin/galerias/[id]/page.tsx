'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { AdminNavbar } from '@/components/AdminNavbar';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { 
  ArrowLeft, 
  Upload, 
  Users, 
  FolderOpen,
  Calendar,
  Edit,
  Trash2,
  Plus,
  Search,
  Eye,
  UserCog
} from 'lucide-react';
import Link from 'next/link';

interface PhotoEvent {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
  albums: PhotoAlbum[];
  users: User[];
  _count: {
    albums: number;
    users: number;
  };
}

interface PhotoAlbum {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
  _count: {
    photos: number;
  };
}

interface User {
  id: string;
  name: string;
  email: string;
}

export default function EventoDetalhePage() {
  const params = useParams();
  const router = useRouter();
  const eventId = params.id as string;
  
  const [event, setEvent] = useState<PhotoEvent | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (eventId) {
      fetchEvent();
    }
  }, [eventId]);

  const fetchEvent = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/admin/photo-events/${eventId}`);
      
      if (!response.ok) {
        throw new Error('Erro ao carregar evento');
      }
      
      const data = await response.json();
      setEvent(data.event);
    } catch (err) {
      setError('Erro ao carregar evento');
      console.error('Error fetching event:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteAlbum = async (albumId: string) => {
    if (!confirm('Tem certeza que deseja excluir este álbum? Esta ação não pode ser desfeita.')) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/photo-albums/${albumId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        // Tentar obter a mensagem de erro específica da resposta
        let errorMessage = 'Erro ao excluir álbum';
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
        } catch {
          // Se não conseguir parsear o JSON, usar mensagem baseada no status
          switch (response.status) {
            case 404:
              errorMessage = 'Álbum não encontrado';
              break;
            case 403:
              errorMessage = 'Sem permissão para excluir este álbum';
              break;
            case 500:
              errorMessage = 'Erro interno do servidor ao excluir álbum';
              break;
            default:
              errorMessage = `Erro ao excluir álbum (${response.status})`;
          }
        }
        throw new Error(errorMessage);
      }

      // Atualizar a lista de álbuns
      if (event) {
        setEvent({
          ...event,
          albums: event.albums.filter(album => album.id !== albumId),
          _count: {
            ...event._count,
            albums: event._count.albums - 1,
          },
        });
      }
      
      // Mostrar mensagem de sucesso
      setError(''); // Limpar erros anteriores
      // Você pode adicionar uma notificação de sucesso aqui se desejar
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido ao excluir álbum';
      setError(errorMessage);
      console.error('Error deleting album:', err);
    }
  };

  const filteredAlbums = event?.albums.filter(album =>
    album.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    album.description?.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <AdminNavbar activeTab="photos" />
        <div className="lg:pl-64">
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-600 border-t-transparent"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen bg-gray-50">
        <AdminNavbar activeTab="photos" />
        <div className="lg:pl-64">
          <div className="text-center py-12">
            <h2 className="text-xl font-semibold text-gray-900">Evento não encontrado</h2>
            <Link href="/admin/galerias">
              <Button className="mt-4">Voltar para Galerias</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminNavbar activeTab="photos" />
      
      <div className="lg:pl-64">
        <main className="py-8">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            {/* Header */}
            <div className="mb-8">
              <div className="flex items-center space-x-4 mb-4">
                <Link href="/admin/galerias">
                  <Button variant="outline" size="sm">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Voltar
                  </Button>
                </Link>
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">{event.name}</h1>
                  {event.description && (
                    <p className="mt-1 text-sm text-gray-500">{event.description}</p>
                  )}
                  <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                    <div className="flex items-center">
                      <Calendar className="h-4 w-4 mr-1" />
                      <span>Criado em {new Date(event.createdAt).toLocaleDateString('pt-BR')}</span>
                    </div>
                    <div className="flex items-center">
                      <FolderOpen className="h-4 w-4 mr-1" />
                      <span>{event._count.albums} álbuns</span>
                    </div>
                    <div className="flex items-center">
                      <Users className="h-4 w-4 mr-1" />
                      <span>{event._count.users} usuários</span>
                    </div>
                  </div>
                </div>
                
                <div className="flex space-x-2">
                  <Link href={`/admin/galerias/${event.id}/upload`}>
                    <Button>
                      <Upload className="h-4 w-4 mr-2" />
                      Upload de Fotos
                    </Button>
                  </Link>
                  <Link href={`/admin/galerias/${event.id}/usuarios`}>
                    <Button variant="outline">
                      <UserCog className="h-4 w-4 mr-2" />
                      Gerenciar Usuários
                    </Button>
                  </Link>
                  <Link href={`/admin/galerias/${event.id}/editar`}>
                    <Button variant="outline">
                      <Edit className="h-4 w-4 mr-2" />
                      Editar
                    </Button>
                  </Link>
                </div>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="mb-6 rounded-md bg-red-50 p-4">
                <div className="text-sm text-red-700">{error}</div>
              </div>
            )}


            {/* Albums Section */}
            <div className="mb-8">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-gray-900">Álbuns</h2>
                <div className="flex items-center space-x-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                    <Input
                      placeholder="Buscar álbuns..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 w-64"
                    />
                  </div>
                </div>
              </div>

              {filteredAlbums.length === 0 ? (
                <Card className="p-12 text-center">
                  <FolderOpen className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    {searchTerm ? 'Nenhum álbum encontrado' : 'Nenhum álbum criado'}
                  </h3>
                  <p className="text-gray-500 mb-6">
                    {searchTerm 
                      ? 'Tente ajustar os termos de busca'
                      : 'Faça upload de fotos para criar álbuns automaticamente'
                    }
                  </p>
                  {!searchTerm && (
                    <Link href={`/admin/galerias/${event.id}/upload`}>
                      <Button>
                        <Upload className="h-4 w-4 mr-2" />
                        Fazer Upload
                      </Button>
                    </Link>
                  )}
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredAlbums.map((album) => (
                    <Card key={album.id} className="p-6 hover:shadow-lg transition-shadow">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-gray-900 mb-1">
                            {album.name}
                          </h3>
                          {album.description && (
                            <p className="text-sm text-gray-600 line-clamp-2">
                              {album.description}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                        <div className="flex items-center">
                          <Eye className="h-4 w-4 mr-1" />
                          <span>{album._count.photos} fotos</span>
                        </div>
                        <span>
                          {new Date(album.createdAt).toLocaleDateString('pt-BR')}
                        </span>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex space-x-2">
                          <Link href={`/admin/galerias/${event.id}/albuns/${album.id}`}>
                            <Button variant="outline" size="sm">
                              <Eye className="h-4 w-4 mr-1" />
                              Ver Fotos
                            </Button>
                          </Link>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteAlbum(album.id)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </div>

            {/* Users Section */}
            
          </div>
        </main>
      </div>
    </div>
  );
}