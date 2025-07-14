import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { Navigation } from "@/components/navigation";
import { Loader2, Settings as SettingsIcon, Bell, Eye, Palette, Download, Trash2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface UserSettings {
  notifications: {
    email: boolean;
    browser: boolean;
    albumShared: boolean;
    exportReady: boolean;
  };
  display: {
    theme: 'light' | 'dark' | 'system';
    gridSize: 'small' | 'medium' | 'large';
    showFileNames: boolean;
  };
  export: {
    defaultFormat: 'jpg' | 'png' | 'webp';
    defaultQuality: 'low' | 'medium' | 'high';
    includeMetadata: boolean;
  };
}

const defaultSettings: UserSettings = {
  notifications: {
    email: true,
    browser: true,
    albumShared: true,
    exportReady: true,
  },
  display: {
    theme: 'system',
    gridSize: 'medium',
    showFileNames: true,
  },
  export: {
    defaultFormat: 'jpg',
    defaultQuality: 'high',
    includeMetadata: false,
  },
};

export function Settings() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [settings, setSettings] = useState<UserSettings>(defaultSettings);

  const { isLoading, error } = useQuery({
    queryKey: ["user-settings"],
    queryFn: async () => {
      const response = await fetch("/api/auth/user");
      if (!response.ok) {
        if (response.status === 401) {
          window.location.href = "/api/login";
          return;
        }
        throw new Error("Failed to fetch user settings");
      }
      const userData = await response.json();
      // For now, return default settings since we don't have settings stored yet
      return defaultSettings;
    },
    onSuccess: (data) => {
      setSettings(data);
    },
  });

  const updateSettingsMutation = useMutation({
    mutationFn: async (newSettings: UserSettings) => {
      const response = await fetch("/api/user/settings", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newSettings),
      });
      if (!response.ok) {
        throw new Error("Failed to update settings");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-settings"] });
      toast({
        title: "Configurações salvas",
        description: "Suas preferências foram atualizadas com sucesso.",
      });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Não foi possível salvar as configurações. Tente novamente.",
        variant: "destructive",
      });
    },
  });

  const deleteAccountMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch("/api/auth/user", {
        method: "DELETE",
      });
      if (!response.ok) {
        throw new Error("Failed to delete account");
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Conta excluída",
        description: "Sua conta foi excluída com sucesso.",
      });
      window.location.href = "/";
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Não foi possível excluir a conta. Tente novamente.",
        variant: "destructive",
      });
    },
  });

  const updateSetting = (section: keyof UserSettings, key: string, value: any) => {
    const newSettings = {
      ...settings,
      [section]: {
        ...settings[section],
        [key]: value,
      },
    };
    setSettings(newSettings);
    updateSettingsMutation.mutate(newSettings);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="flex items-center justify-center h-96">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Erro ao carregar configurações</h2>
            <p className="text-gray-600">Não foi possível carregar suas configurações.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <div className="max-w-4xl mx-auto py-8 px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Configurações</h1>
          <p className="text-gray-600 mt-2">Gerencie suas preferências e configurações da conta</p>
        </div>

        <div className="space-y-6">
          {/* Notifications Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Notificações
              </CardTitle>
              <CardDescription>
                Configure como você deseja receber notificações
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-sm font-medium">Notificações por email</Label>
                  <p className="text-sm text-gray-500">Receba atualizações importantes por email</p>
                </div>
                <Switch
                  checked={settings.notifications.email}
                  onCheckedChange={(checked) => updateSetting('notifications', 'email', checked)}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-sm font-medium">Notificações do navegador</Label>
                  <p className="text-sm text-gray-500">Receba notificações push no navegador</p>
                </div>
                <Switch
                  checked={settings.notifications.browser}
                  onCheckedChange={(checked) => updateSetting('notifications', 'browser', checked)}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-sm font-medium">Álbum compartilhado</Label>
                  <p className="text-sm text-gray-500">Notificar quando alguém compartilhar um álbum</p>
                </div>
                <Switch
                  checked={settings.notifications.albumShared}
                  onCheckedChange={(checked) => updateSetting('notifications', 'albumShared', checked)}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-sm font-medium">Exportação concluída</Label>
                  <p className="text-sm text-gray-500">Notificar quando a exportação estiver pronta</p>
                </div>
                <Switch
                  checked={settings.notifications.exportReady}
                  onCheckedChange={(checked) => updateSetting('notifications', 'exportReady', checked)}
                />
              </div>
            </CardContent>
          </Card>

          {/* Display Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="h-5 w-5" />
                Exibição
              </CardTitle>
              <CardDescription>
                Personalize como o conteúdo é exibido
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-sm font-medium">Tema</Label>
                  <p className="text-sm text-gray-500">Escolha o tema da interface</p>
                </div>
                <Select
                  value={settings.display.theme}
                  onValueChange={(value: 'light' | 'dark' | 'system') => updateSetting('display', 'theme', value)}
                >
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="light">Claro</SelectItem>
                    <SelectItem value="dark">Escuro</SelectItem>
                    <SelectItem value="system">Sistema</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-sm font-medium">Tamanho da grade</Label>
                  <p className="text-sm text-gray-500">Tamanho dos itens na visualização em grade</p>
                </div>
                <Select
                  value={settings.display.gridSize}
                  onValueChange={(value: 'small' | 'medium' | 'large') => updateSetting('display', 'gridSize', value)}
                >
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="small">Pequeno</SelectItem>
                    <SelectItem value="medium">Médio</SelectItem>
                    <SelectItem value="large">Grande</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-sm font-medium">Mostrar nomes dos arquivos</Label>
                  <p className="text-sm text-gray-500">Exibir nomes dos arquivos nas miniaturas</p>
                </div>
                <Switch
                  checked={settings.display.showFileNames}
                  onCheckedChange={(checked) => updateSetting('display', 'showFileNames', checked)}
                />
              </div>
            </CardContent>
          </Card>

          {/* Export Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Download className="h-5 w-5" />
                Exportação
              </CardTitle>
              <CardDescription>
                Configure as opções padrão de exportação
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-sm font-medium">Formato padrão</Label>
                  <p className="text-sm text-gray-500">Formato de arquivo para exportação</p>
                </div>
                <Select
                  value={settings.export.defaultFormat}
                  onValueChange={(value: 'jpg' | 'png' | 'webp') => updateSetting('export', 'defaultFormat', value)}
                >
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="jpg">JPG</SelectItem>
                    <SelectItem value="png">PNG</SelectItem>
                    <SelectItem value="webp">WebP</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-sm font-medium">Qualidade padrão</Label>
                  <p className="text-sm text-gray-500">Qualidade das imagens exportadas</p>
                </div>
                <Select
                  value={settings.export.defaultQuality}
                  onValueChange={(value: 'low' | 'medium' | 'high') => updateSetting('export', 'defaultQuality', value)}
                >
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Baixa</SelectItem>
                    <SelectItem value="medium">Média</SelectItem>
                    <SelectItem value="high">Alta</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-sm font-medium">Incluir metadados</Label>
                  <p className="text-sm text-gray-500">Manter informações EXIF nas imagens exportadas</p>
                </div>
                <Switch
                  checked={settings.export.includeMetadata}
                  onCheckedChange={(checked) => updateSetting('export', 'includeMetadata', checked)}
                />
              </div>
            </CardContent>
          </Card>

          {/* Danger Zone */}
          <Card className="border-red-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-red-600">
                <Trash2 className="h-5 w-5" />
                Zona de Perigo
              </CardTitle>
              <CardDescription>
                Ações irreversíveis para sua conta
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="bg-red-50 p-4 rounded-lg">
                <h4 className="font-medium text-red-800 mb-2">Excluir conta</h4>
                <p className="text-sm text-red-700 mb-4">
                  Esta ação é permanente e não pode ser desfeita. Todos os seus álbuns, fotos e dados serão perdidos.
                </p>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" size="sm">
                      Excluir minha conta
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Tem certeza absoluta?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Esta ação não pode ser desfeita. Isso excluirá permanentemente sua conta
                        e removerá todos os seus dados de nossos servidores.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => deleteAccountMutation.mutate()}
                        className="bg-red-600 hover:bg-red-700"
                        disabled={deleteAccountMutation.isPending}
                      >
                        {deleteAccountMutation.isPending ? (
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        ) : null}
                        Sim, excluir conta
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}