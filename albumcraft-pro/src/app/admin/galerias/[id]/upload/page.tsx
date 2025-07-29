'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { AdminNavbar } from '@/components/AdminNavbar';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { 
  ArrowLeft, 
  Upload, 
  X, 
  FolderOpen,
  Image as ImageIcon,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import Link from 'next/link';
import { useDropzone } from 'react-dropzone';

interface PhotoEvent {
  id: string;
  name: string;
  description?: string;
}

interface UploadFile {
  file: File;
  id: string;
  albumName: string;
  preview: string;
  status: 'pending' | 'uploading' | 'success' | 'error';
  progress: number;
  error?: string;
}

export default function UploadFotosPage() {
  const params = useParams();
  const router = useRouter();
  const eventId = params.id as string;
  
  const [event, setEvent] = useState<PhotoEvent | null>(null);
  const [files, setFiles] = useState<UploadFile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState('');

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

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const newFiles: UploadFile[] = acceptedFiles.map((file) => {
      // Extrair nome do álbum do nome do arquivo ou pasta
      const pathParts = file.webkitRelativePath ? file.webkitRelativePath.split('/') : [file.name];
      const albumName = pathParts.length > 1 ? pathParts[0] : 'Álbum Principal';
      
      return {
        file,
        id: Math.random().toString(36).substr(2, 9),
        albumName,
        preview: URL.createObjectURL(file),
        status: 'pending',
        progress: 0,
      };
    });

    setFiles(prev => [...prev, ...newFiles]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.gif', '.webp']
    },
    multiple: true,
  });

  const removeFile = (fileId: string) => {
    setFiles(prev => {
      const file = prev.find(f => f.id === fileId);
      if (file) {
        URL.revokeObjectURL(file.preview);
      }
      return prev.filter(f => f.id !== fileId);
    });
  };

  const updateAlbumName = (fileId: string, albumName: string) => {
    setFiles(prev => prev.map(file => 
      file.id === fileId ? { ...file, albumName } : file
    ));
  };

  const uploadFiles = async () => {
    if (files.length === 0) return;

    setIsUploading(true);
    setError('');

    try {
      // Agrupar arquivos por álbum
      const albumGroups = files.reduce((groups, file) => {
        const albumName = file.albumName || 'Álbum Principal';
        if (!groups[albumName]) {
          groups[albumName] = [];
        }
        groups[albumName].push(file);
        return groups;
      }, {} as Record<string, UploadFile[]>);

      // Upload por álbum
      for (const [albumName, albumFiles] of Object.entries(albumGroups)) {
        // Criar álbum primeiro
        const albumResponse = await fetch('/api/admin/photo-albums', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: albumName,
            eventId: eventId,
          }),
        });

        if (!albumResponse.ok) {
          throw new Error(`Erro ao criar álbum ${albumName}`);
        }

        const { album } = await albumResponse.json();

        // Upload das fotos do álbum
        for (const uploadFile of albumFiles) {
          try {
            setFiles(prev => prev.map(f => 
              f.id === uploadFile.id 
                ? { ...f, status: 'uploading', progress: 0 }
                : f
            ));

            const formData = new FormData();
            formData.append('file', uploadFile.file);
            formData.append('albumId', album.id);

            const uploadResponse = await fetch('/api/admin/photo-upload', {
              method: 'POST',
              body: formData,
            });

            if (!uploadResponse.ok) {
              throw new Error('Erro no upload');
            }

            setFiles(prev => prev.map(f => 
              f.id === uploadFile.id 
                ? { ...f, status: 'success', progress: 100 }
                : f
            ));

          } catch (err) {
            setFiles(prev => prev.map(f => 
              f.id === uploadFile.id 
                ? { 
                    ...f, 
                    status: 'error', 
                    error: err instanceof Error ? err.message : 'Erro no upload'
                  }
                : f
            ));
          }
        }
      }

      // Verificar se todos os uploads foram bem-sucedidos
      const hasErrors = files.some(f => f.status === 'error');
      if (!hasErrors) {
        setTimeout(() => {
          router.push(`/admin/galerias/${eventId}`);
        }, 2000);
      }

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro no upload');
    } finally {
      setIsUploading(false);
    }
  };

  const getAlbumGroups = () => {
    return files.reduce((groups, file) => {
      const albumName = file.albumName || 'Álbum Principal';
      if (!groups[albumName]) {
        groups[albumName] = [];
      }
      groups[albumName].push(file);
      return groups;
    }, {} as Record<string, UploadFile[]>);
  };

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

  const albumGroups = getAlbumGroups();
  const totalFiles = files.length;
  const successFiles = files.filter(f => f.status === 'success').length;
  const errorFiles = files.filter(f => f.status === 'error').length;

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminNavbar activeTab="photos" />
      
      <div className="lg:pl-64">
        <main className="py-8">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
            {/* Header */}
            <div className="mb-8">
              <div className="flex items-center space-x-4 mb-4">
                <Link href={`/admin/galerias/${eventId}`}>
                  <Button variant="outline" size="sm">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Voltar
                  </Button>
                </Link>
              </div>
              
              <h1 className="text-2xl font-bold text-gray-900">Upload de Fotos</h1>
              <p className="mt-1 text-sm text-gray-500">
                Evento: {event.name}
              </p>
            </div>

            {/* Error Message */}
            {error && (
              <div className="mb-6 rounded-md bg-red-50 p-4">
                <div className="text-sm text-red-700">{error}</div>
              </div>
            )}

            {/* Upload Area */}
            <Card className="p-6 mb-8">
              <div
                {...getRootProps()}
                className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                  isDragActive 
                    ? 'border-blue-400 bg-blue-50' 
                    : 'border-gray-300 hover:border-gray-400'
                }`}
              >
                <input {...getInputProps()} />
                <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  {isDragActive ? 'Solte as fotos aqui' : 'Arraste fotos ou clique para selecionar'}
                </h3>
                <p className="text-sm text-gray-500 mb-4">
                  Suporte para JPEG, PNG, GIF e WebP. Você pode selecionar múltiplas fotos.
                </p>
                <p className="text-xs text-gray-400">
                  Dica: Organize suas fotos em pastas para criar álbuns automaticamente
                </p>
              </div>
            </Card>

            {/* Upload Progress */}
            {totalFiles > 0 && (
              <Card className="p-6 mb-8">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-gray-900">
                    Progresso do Upload
                  </h3>
                  <div className="text-sm text-gray-500">
                    {successFiles}/{totalFiles} concluídos
                    {errorFiles > 0 && (
                      <span className="text-red-600 ml-2">
                        ({errorFiles} com erro)
                      </span>
                    )}
                  </div>
                </div>
                
                <Progress 
                  value={(successFiles / totalFiles) * 100} 
                  className="mb-4"
                />

                <div className="flex justify-between">
                  <Button
                    onClick={uploadFiles}
                    disabled={isUploading || totalFiles === 0}
                    className="mr-4"
                  >
                    {isUploading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                        Fazendo Upload...
                      </>
                    ) : (
                      <>
                        <Upload className="h-4 w-4 mr-2" />
                        Iniciar Upload
                      </>
                    )}
                  </Button>
                  
                  {!isUploading && (
                    <Button
                      variant="outline"
                      onClick={() => {
                        files.forEach(file => URL.revokeObjectURL(file.preview));
                        setFiles([]);
                      }}
                    >
                      Limpar Tudo
                    </Button>
                  )}
                </div>
              </Card>
            )}

            {/* Albums Preview */}
            {Object.keys(albumGroups).length > 0 && (
              <div className="space-y-6">
                {Object.entries(albumGroups).map(([albumName, albumFiles]) => (
                  <Card key={albumName} className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center">
                        <FolderOpen className="h-5 w-5 text-blue-600 mr-2" />
                        <h3 className="text-lg font-medium text-gray-900">
                          {albumName}
                        </h3>
                        <span className="ml-2 text-sm text-gray-500">
                          ({albumFiles.length} fotos)
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                      {albumFiles.map((file) => (
                        <div key={file.id} className="relative group">
                          <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
                            <img
                              src={file.preview}
                              alt={file.file.name}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          
                          {/* Status Overlay */}
                          <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-lg">
                            {file.status === 'pending' && (
                              <div className="text-white text-center">
                                <ImageIcon className="h-6 w-6 mx-auto mb-1" />
                                <p className="text-xs">Aguardando</p>
                              </div>
                            )}
                            {file.status === 'uploading' && (
                              <div className="text-white text-center">
                                <div className="animate-spin rounded-full h-6 w-6 border-2 border-white border-t-transparent mx-auto mb-1"></div>
                                <p className="text-xs">Enviando...</p>
                              </div>
                            )}
                            {file.status === 'success' && (
                              <div className="text-white text-center">
                                <CheckCircle className="h-6 w-6 mx-auto mb-1 text-green-400" />
                                <p className="text-xs">Concluído</p>
                              </div>
                            )}
                            {file.status === 'error' && (
                              <div className="text-white text-center">
                                <AlertCircle className="h-6 w-6 mx-auto mb-1 text-red-400" />
                                <p className="text-xs">Erro</p>
                              </div>
                            )}
                          </div>

                          {/* Remove Button */}
                          {!isUploading && file.status === 'pending' && (
                            <button
                              onClick={() => removeFile(file.id)}
                              className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          )}

                          {/* File Info */}
                          <div className="mt-2">
                            <p className="text-xs text-gray-600 truncate">
                              {file.file.name}
                            </p>
                            {!isUploading && file.status === 'pending' && (
                              <Input
                                value={file.albumName}
                                onChange={(e) => updateAlbumName(file.id, e.target.value)}
                                className="mt-1 text-xs h-6"
                                placeholder="Nome do álbum"
                              />
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}