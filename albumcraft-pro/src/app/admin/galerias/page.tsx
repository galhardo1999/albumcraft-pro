'use client';

import { useState, useEffect } from 'react';
import { AdminNavbar } from '@/components/AdminNavbar';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Plus, 
  Search, 
  Calendar, 
  Users, 
  FolderOpen,
  Edit,
  Trash2,
  Eye
} from 'lucide-react';
import Link from 'next/link';

interface PhotoEvent {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
  _count: {
    albums: number;
    users: number;
  };
}

export default function GaleriasPage() {
  const [events, setEvents] = useState<PhotoEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/admin/photo-events', {
        credentials: 'include', // Incluir cookies de autenticação
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error('Erro ao carregar eventos');
      }
      
      const data = await response.json();
      setEvents(data.events || []);
    } catch (err) {
      setError('Erro ao carregar eventos de fotos');
      console.error('Error fetching events:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteEvent = async (eventId: string) => {
    if (!confirm('Tem certeza que deseja excluir este evento? Esta ação não pode ser desfeita.')) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/photo-events/${eventId}`, {
        method: 'DELETE',
        credentials: 'include', // Incluir cookies de autenticação
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Erro ao excluir evento');
      }

      setEvents(events.filter(event => event.id !== eventId));
    } catch (err) {
      setError('Erro ao excluir evento');
      console.error('Error deleting event:', err);
    }
  };

  const filteredEvents = events.filter(event =>
    event.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    event.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminNavbar activeTab="photos" />
      
      <div className="lg:pl-64">
        <main className="py-8">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            {/* Header */}
            <div className="mb-8">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Galerias de Fotos</h1>
                  <p className="mt-1 text-sm text-gray-500">
                    Gerencie eventos de fotos e organize álbuns para seus usuários
                  </p>
                </div>
                <Link href="/admin/galerias/novo">
                  <Button className="flex items-center space-x-2">
                    <Plus className="h-4 w-4" />
                    <span>Novo Evento</span>
                  </Button>
                </Link>
              </div>
            </div>

            {/* Search */}
            <div className="mb-6">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <Input
                  placeholder="Buscar eventos..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="mb-6 rounded-md bg-red-50 p-4">
                <div className="text-sm text-red-700">{error}</div>
              </div>
            )}

            {/* Loading */}
            {isLoading ? (
              <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-600 border-t-transparent"></div>
              </div>
            ) : (
              <>
                {/* Events Grid */}
                {filteredEvents.length === 0 ? (
                  <Card className="p-12 text-center">
                    <FolderOpen className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      {searchTerm ? 'Nenhum evento encontrado' : 'Nenhum evento criado'}
                    </h3>
                    <p className="text-gray-500 mb-6">
                      {searchTerm 
                        ? 'Tente ajustar os termos de busca'
                        : 'Comece criando seu primeiro evento de fotos'
                      }
                    </p>
                    {!searchTerm && (
                      <Link href="/admin/galerias/novo">
                        <Button>
                          <Plus className="h-4 w-4 mr-2" />
                          Criar Primeiro Evento
                        </Button>
                      </Link>
                    )}
                  </Card>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredEvents.map((event) => (
                      <Card key={event.id} className="p-6 hover:shadow-lg transition-shadow">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex-1">
                            <h3 className="text-lg font-semibold text-gray-900 mb-1">
                              {event.name}
                            </h3>
                            {event.description && (
                              <p className="text-sm text-gray-600 line-clamp-2">
                                {event.description}
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center space-x-4 mb-4 text-sm text-gray-500">
                          <div className="flex items-center">
                            <FolderOpen className="h-4 w-4 mr-1" />
                            <span>{event._count.albums} álbuns</span>
                          </div>
                          <div className="flex items-center">
                            <Users className="h-4 w-4 mr-1" />
                            <span>{event._count.users} usuários</span>
                          </div>
                        </div>

                        <div className="flex items-center justify-between text-xs text-gray-400 mb-4">
                          <div className="flex items-center">
                            <Calendar className="h-3 w-3 mr-1" />
                            <span>
                              Criado em {new Date(event.createdAt).toLocaleDateString('pt-BR')}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="flex space-x-2">
                            <Link href={`/admin/galerias/${event.id}`}>
                              <Button variant="outline" size="sm">
                                <Eye className="h-4 w-4 mr-1" />
                                Ver
                              </Button>
                            </Link>
                            <Link href={`/admin/galerias/${event.id}/editar`}>
                              <Button variant="outline" size="sm">
                                <Edit className="h-4 w-4 mr-1" />
                                Editar
                              </Button>
                            </Link>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteEvent(event.id)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </Card>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}