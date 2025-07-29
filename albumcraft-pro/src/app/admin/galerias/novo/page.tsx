'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useDropzone } from 'react-dropzone';
import { AdminNavbar } from '@/components/AdminNavbar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { 
  ArrowLeft, 
  Save, 
  Upload, 
  X, 
  User, 
  Search,
  Image,
  Trash2,
  UserPlus,
  FolderOpen,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import Link from 'next/link';

interface User {
  id: string;
  name: string;
  email: string;
}

interface UploadedFile {
  file: File;
  preview: string;
  progress: number;
  uploaded: boolean;
  error?: string;
  folderName?: string;
  originalPath?: string;
}

export default function NovoEventoPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    description: ''
  });

  // Estados para usuários
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<User[]>([]);
  const [userSearch, setUserSearch] = useState('');
  const [loadingUsers, setLoadingUsers] = useState(false);

  // Estados para upload de fotos
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [uploading, setUploading] = useState(false);

  // Buscar usuários
  const fetchUsers = async (search = '') => {
    try {
      setLoadingUsers(true);
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      
      const response = await fetch(`/api/admin/users?${params}`);
      if (!response.ok) throw new Error('Erro ao buscar usuários');
      
      const data = await response.json();
      setUsers(data.users || []);
    } catch (err) {
      console.error('Erro ao buscar usuários:', err);
    } finally {
      setLoadingUsers(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // Debounce para busca de usuários
  useEffect(() => {
    const timer = setTimeout(() => {
      if (userSearch !== '') {
        fetchUsers(userSearch);
      } else {
        fetchUsers();
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [userSearch]);

  // Configuração do dropzone para suportar pastas
  const onDrop = useCallback((acceptedFiles: File[]) => {
    console.log('Files dropped:', acceptedFiles);
    console.log('Files with paths:', acceptedFiles.map(f => ({
      name: f.name,
      webkitRelativePath: (f as any).webkitRelativePath,
      path: (f as any).path
    })));
    
    // Filtrar apenas arquivos válidos
    const validFiles = acceptedFiles.filter(file => file && file instanceof File);
    
    // Processar arquivos aceitos
    const newFiles: UploadedFile[] = validFiles.map(file => {
      // Extrair informações da pasta se disponível
      const filePath = (file as any).webkitRelativePath || (file as any).path || file.name;
      console.log('Processing file:', file.name, 'Path:', filePath);
      
      const pathParts = filePath.split('/').filter((part: string) => part.length > 0);
      
      // Se há mais de uma parte no caminho, a primeira é a pasta principal
      // Se há subpastas, usar o caminho completo exceto o arquivo
      let folderName = 'Álbum Principal';
      
      if (pathParts.length > 1) {
        // Se há subpastas, criar nome do álbum baseado no caminho completo
        if (pathParts.length > 2) {
          // Para subpastas: "PastaPrincipal/Subpasta"
          folderName = pathParts.slice(0, -1).join('/');
        } else {
          // Para pasta simples: apenas o nome da pasta
          folderName = pathParts[0];
        }
      }
      
      console.log('Folder name determined:', folderName);
      
      return {
        file,
        preview: URL.createObjectURL(file),
        progress: 0,
        uploaded: false,
        folderName,
        originalPath: filePath
      };
    });

    setUploadedFiles(prev => [...prev, ...newFiles]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.gif', '.webp']
    },
    multiple: true,
    noClick: true // Desabilitar click no dropzone para usar botões customizados
  });

  // Remover arquivo
  const removeFile = (index: number) => {
    setUploadedFiles(prev => {
      const newFiles = [...prev];
      if (newFiles[index] && newFiles[index].preview) {
        URL.revokeObjectURL(newFiles[index].preview);
      }
      newFiles.splice(index, 1);
      return newFiles;
    });
  };

  // Adicionar usuário
  const addUser = (user: User) => {
    if (!selectedUsers.find(u => u.id === user.id)) {
      setSelectedUsers(prev => [...prev, user]);
    }
  };

  // Remover usuário
  const removeUser = (userId: string) => {
    setSelectedUsers(prev => prev.filter(u => u.id !== userId));
  };

  // Upload de fotos
  const uploadFiles = async (eventId: string) => {
    if (uploadedFiles.length === 0) return;

    setUploading(true);
    
    // Filtrar apenas arquivos válidos
    const validFiles = uploadedFiles.filter(fileData => fileData && fileData.file);
    
    // Agrupar arquivos por pasta
    const filesByFolder = validFiles.reduce((acc, file, index) => {
      const folderName = file.folderName || 'Álbum Principal';
      if (!acc[folderName]) acc[folderName] = [];
      acc[folderName].push({ ...file, index });
      return acc;
    }, {} as Record<string, Array<UploadedFile & { index: number }>>);

    // Criar álbuns para cada pasta
    const albumMap: Record<string, string> = {};
    
    for (const [folderName, files] of Object.entries(filesByFolder)) {
      try {
        const albumResponse = await fetch('/api/admin/photo-albums', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            eventId,
            name: folderName,
            description: `Álbum ${folderName} do evento`
          })
        });

        if (!albumResponse.ok) {
          throw new Error(`Erro ao criar álbum ${folderName}`);
        }

        const albumData = await albumResponse.json();
        albumMap[folderName] = albumData.album.id;
      } catch (err) {
        console.error(`Erro ao criar álbum ${folderName}:`, err);
        // Marcar todos os arquivos desta pasta como erro
        files.forEach(fileData => {
          setUploadedFiles(prev => {
            const newFiles = [...prev];
            newFiles[fileData.index] = { 
              ...newFiles[fileData.index], 
              error: `Erro ao criar álbum ${folderName}` 
            };
            return newFiles;
          });
        });
        continue;
      }
    }

    // Upload das fotos para seus respectivos álbuns
    for (const [folderName, files] of Object.entries(filesByFolder)) {
      const albumId = albumMap[folderName];
      if (!albumId) continue; // Pular se o álbum não foi criado

      for (const fileData of files) {
        try {
          // Atualizar progresso para "iniciando"
          setUploadedFiles(prev => {
            const newFiles = [...prev];
            newFiles[fileData.index] = { ...newFiles[fileData.index], progress: 10 };
            return newFiles;
          });

          const formData = new FormData();
          formData.append('file', fileData.file);
          formData.append('albumId', albumId);

          const response = await fetch('/api/admin/photo-upload', {
            method: 'POST',
            body: formData
          });

          if (!response.ok) {
            throw new Error('Erro no upload');
          }

          // Atualizar progresso para "concluído"
          setUploadedFiles(prev => {
            const newFiles = [...prev];
            newFiles[fileData.index] = { 
              ...newFiles[fileData.index], 
              progress: 100, 
              uploaded: true 
            };
            return newFiles;
          });

        } catch (err) {
          setUploadedFiles(prev => {
            const newFiles = [...prev];
            newFiles[fileData.index] = { 
              ...newFiles[fileData.index], 
              error: err instanceof Error ? err.message : 'Erro no upload' 
            };
            return newFiles;
          });
        }
      }
    }

    setUploading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      setError('Nome do evento é obrigatório');
      return;
    }

    try {
      setIsLoading(true);
      setError('');

      // Preparar dados do evento incluindo usuários selecionados
      const eventData = {
        ...formData,
        userIds: selectedUsers.map(user => user.id)
      };

      // Criar evento
      const response = await fetch('/api/admin/photo-events', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(eventData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro ao criar evento');
      }

      const data = await response.json();
      const eventId = data.event.id;

      // Upload das fotos
      if (uploadedFiles.length > 0) {
        await uploadFiles(eventId);
      }

      router.push(`/admin/galerias/${eventId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao criar evento');
      console.error('Error creating event:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminNavbar activeTab="photos" />
      
      <div className="lg:pl-64">
        <main className="py-8">
          <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
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
              <h1 className="text-2xl font-bold text-gray-900">Novo Evento de Fotos</h1>
              <p className="mt-1 text-sm text-gray-500">
                Crie um novo evento, adicione usuários e faça upload das fotos
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Error Message */}
              {error && (
                <div className="rounded-md bg-red-50 p-4">
                  <div className="text-sm text-red-700">{error}</div>
                </div>
              )}

              {/* Informações do Evento */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Image className="h-5 w-5 mr-2" />
                    Informações do Evento
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="name" className="text-sm font-medium text-gray-700">
                      Nome do Evento *
                    </Label>
                    <Input
                      id="name"
                      type="text"
                      value={formData.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      placeholder="Ex: Formatura 2024, Casamento João e Maria..."
                      className="mt-1"
                      required
                    />
                    <p className="mt-1 text-xs text-gray-500">
                      Nome que será exibido para os usuários
                    </p>
                  </div>

                  <div>
                    <Label htmlFor="description" className="text-sm font-medium text-gray-700">
                      Descrição
                    </Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => handleInputChange('description', e.target.value)}
                      placeholder="Descrição opcional do evento..."
                      className="mt-1"
                      rows={3}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Adicionar Usuários */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <UserPlus className="h-5 w-5 mr-2" />
                    Adicionar Usuários
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-700">
                      Buscar Usuários
                    </Label>
                    <div className="relative mt-1">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        type="text"
                        value={userSearch}
                        onChange={(e) => setUserSearch(e.target.value)}
                        placeholder="Digite o nome ou email do usuário..."
                        className="pl-10"
                      />
                    </div>
                  </div>

                  {/* Lista de usuários disponíveis */}
                  {userSearch && (
                    <div className="max-h-40 overflow-y-auto border rounded-md">
                      {loadingUsers ? (
                        <div className="p-4 text-center text-gray-500">Carregando...</div>
                      ) : users.length === 0 ? (
                        <div className="p-4 text-center text-gray-500">Nenhum usuário encontrado</div>
                      ) : (
                        users.map(user => (
                          <div
                            key={user.id}
                            className="p-3 hover:bg-gray-50 cursor-pointer border-b last:border-b-0"
                            onClick={() => addUser(user)}
                          >
                            <div className="flex items-center">
                              <User className="h-4 w-4 mr-2 text-gray-400" />
                              <div>
                                <p className="text-sm font-medium">{user.name}</p>
                                <p className="text-xs text-gray-500">{user.email}</p>
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  )}

                  {/* Usuários selecionados */}
                  {selectedUsers.length > 0 && (
                    <div>
                      <Label className="text-sm font-medium text-gray-700">
                        Usuários Selecionados ({selectedUsers.length})
                      </Label>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {selectedUsers.map(user => (
                          <Badge key={user.id} variant="secondary" className="flex items-center gap-1">
                            <User className="h-3 w-3" />
                            {user.name}
                            <button
                              type="button"
                              onClick={() => removeUser(user.id)}
                              className="ml-1 hover:text-red-600"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Upload de Fotos */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Upload className="h-5 w-5 mr-2" />
                    Upload de Fotos
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Dropzone */}
                  <div
                    {...getRootProps()}
                    className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                      isDragActive 
                        ? 'border-blue-400 bg-blue-50' 
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                  >
                    <input {...getInputProps()} />
                    <input
                       type="file"
                       multiple
                       {...({ webkitdirectory: '', directory: '' } as any)}
                       onChange={(e) => {
                         if (e.target.files) {
                           const files = Array.from(e.target.files);
                           console.log('Folder selected, files:', files.length);
                           onDrop(files);
                         }
                       }}
                       className="hidden"
                       id="folder-upload"
                       accept="image/*"
                     />
                    <Upload className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                    {isDragActive ? (
                      <p className="text-blue-600">Solte as fotos aqui...</p>
                    ) : (
                      <div>
                        <p className="text-gray-600 mb-2">
                          Arraste e solte fotos aqui, ou use os botões abaixo
                        </p>
                        <div className="flex gap-2 justify-center mb-2">
                          <button
                            type="button"
                            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                            onClick={() => {
                              const input = document.getElementById('folder-upload') as HTMLInputElement;
                              if (input) {
                                input.click();
                              }
                            }}
                          >
                            Selecionar Pasta
                          </button>
                          <button
                            type="button"
                            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
                            onClick={() => {
                              const input = document.createElement('input');
                              input.type = 'file';
                              input.multiple = true;
                              input.accept = 'image/*';
                              input.onchange = (e) => {
                                const target = e.target as HTMLInputElement;
                                if (target.files) {
                                  const files = Array.from(target.files);
                                  console.log('Individual files selected:', files.length);
                                  onDrop(files);
                                }
                              };
                              input.click();
                            }}
                          >
                            Selecionar Arquivos
                          </button>
                        </div>
                        <p className="text-sm text-gray-500">
                          Suporta: JPG, PNG, GIF, WebP<br/>
                          <strong>Selecionar Pasta:</strong> Cria álbuns para cada subpasta<br/>
                          <strong>Selecionar Arquivos:</strong> Adiciona ao álbum principal
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Preview das fotos */}
                  {uploadedFiles.length > 0 && (
                    <div>
                      <Label className="text-sm font-medium text-gray-700">
                        Fotos Selecionadas ({uploadedFiles.length})
                      </Label>
                      
                      {/* Agrupar por pasta */}
                      {(() => {
                        const groupedFiles = uploadedFiles.reduce((acc, file, index) => {
                          const folder = file.folderName || 'Álbum Principal';
                          if (!acc[folder]) acc[folder] = [];
                          acc[folder].push({ ...file, index });
                          return acc;
                        }, {} as Record<string, Array<UploadedFile & { index: number }>>);

                        return Object.entries(groupedFiles).map(([folderName, files]) => (
                          <div key={folderName} className="mb-6">
                            <div className="flex items-center mb-3">
                              <FolderOpen className="h-4 w-4 mr-2 text-blue-600" />
                              <h4 className="text-sm font-medium text-gray-800">{folderName}</h4>
                              <Badge variant="secondary" className="ml-2 text-xs">
                                {files.length} foto{files.length !== 1 ? 's' : ''}
                              </Badge>
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                              {files.map((fileData) => {
                                // Verificação de segurança
                                if (!fileData.file) {
                                  return null;
                                }
                                
                                return (
                                  <div key={fileData.index} className="relative">
                                    <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
                                      <img
                                        src={fileData.preview}
                                        alt={fileData.file?.name || 'Imagem'}
                                        className="w-full h-full object-cover"
                                      />
                                    </div>
                                    <button
                                      type="button"
                                      onClick={() => removeFile(fileData.index)}
                                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                                    >
                                      <X className="h-3 w-3" />
                                    </button>
                                    <div className="mt-1">
                                      <p className="text-xs text-gray-600 truncate" title={fileData.file?.name || 'Arquivo'}>
                                        {fileData.file?.name || 'Arquivo sem nome'}
                                      </p>
                                      <div className="flex gap-1 mt-1">
                                        {fileData.uploaded && (
                                          <Badge variant="default" className="text-xs">
                                            <CheckCircle className="h-3 w-3 mr-1" />
                                            Enviado
                                          </Badge>
                                        )}
                                        {fileData.error && (
                                          <Badge variant="destructive" className="text-xs">
                                            <AlertCircle className="h-3 w-3 mr-1" />
                                            Erro
                                          </Badge>
                                        )}
                                        {fileData.progress > 0 && fileData.progress < 100 && (
                                          <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                                            <div 
                                              className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                                              style={{ width: `${fileData.progress}%` }}
                                            ></div>
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        ));
                      })()}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Actions */}
              <div className="flex items-center justify-end space-x-4 pt-6">
                <Link href="/admin/galerias">
                  <Button type="button" variant="outline">
                    Cancelar
                  </Button>
                </Link>
                <Button type="submit" disabled={isLoading || uploading}>
                  {isLoading || uploading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                      {uploading ? 'Enviando fotos...' : 'Criando...'}
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Criar Evento
                    </>
                  )}
                </Button>
              </div>
            </form>
          </div>
        </main>
      </div>
    </div>
  );
}