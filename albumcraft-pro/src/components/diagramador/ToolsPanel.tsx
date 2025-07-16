'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useState } from 'react'
import Image from 'next/image'

interface DiagramElement {
  id: string
  type: 'photo' | 'text' | 'background'
  x: number
  y: number
  width: number
  height: number
  rotation: number
  opacity: number
  zIndex: number
  data: Record<string, unknown>
}

interface Page {
  id: string
  elements: DiagramElement[]
  backgroundColor: string
  backgroundImage?: string
  backgroundOpacity: number
}

interface LayoutTemplate {
  id: string
  name: string
  preview: string
  photoCount: number
  layout: Array<{
    x: number
    y: number
    width: number
    height: number
  }>
}

interface ToolsPanelProps {
  selectedElement: DiagramElement | null
  selectedPage: 'left' | 'right' | null
  pageData: Page | null
  onElementUpdate: (elementId: string, updates: Partial<DiagramElement>) => void
  onPageUpdate: (page: 'left' | 'right', updates: Partial<Page>) => void
  onApplyLayout: (template: LayoutTemplate, page: 'left' | 'right') => void
}

const layoutTemplates: LayoutTemplate[] = [
  {
    id: 'single-center',
    name: 'Foto Central',
    preview: '🖼️',
    photoCount: 1,
    layout: [{ x: 100, y: 100, width: 300, height: 200 }]
  },
  {
    id: 'two-horizontal',
    name: 'Duas Horizontais',
    preview: '🖼️🖼️',
    photoCount: 2,
    layout: [
      { x: 50, y: 100, width: 180, height: 120 },
      { x: 270, y: 100, width: 180, height: 120 }
    ]
  },
  {
    id: 'three-mixed',
    name: 'Três Mistas',
    preview: '🖼️\n🖼️🖼️',
    photoCount: 3,
    layout: [
      { x: 50, y: 50, width: 400, height: 150 },
      { x: 50, y: 220, width: 180, height: 120 },
      { x: 270, y: 220, width: 180, height: 120 }
    ]
  },
  {
    id: 'four-grid',
    name: 'Grade 2x2',
    preview: '🖼️🖼️\n🖼️🖼️',
    photoCount: 4,
    layout: [
      { x: 50, y: 50, width: 180, height: 120 },
      { x: 270, y: 50, width: 180, height: 120 },
      { x: 50, y: 200, width: 180, height: 120 },
      { x: 270, y: 200, width: 180, height: 120 }
    ]
  },
  {
    id: 'collage',
    name: 'Colagem',
    preview: '🖼️🖼️\n🖼️🖼️🖼️',
    photoCount: 5,
    layout: [
      { x: 30, y: 30, width: 200, height: 150 },
      { x: 250, y: 30, width: 200, height: 100 },
      { x: 250, y: 150, width: 200, height: 100 },
      { x: 30, y: 200, width: 150, height: 120 },
      { x: 200, y: 270, width: 250, height: 100 }
    ]
  }
]

const fontFamilies = [
  'Arial',
  'Helvetica',
  'Times New Roman',
  'Georgia',
  'Verdana',
  'Trebuchet MS',
  'Impact',
  'Comic Sans MS'
]

export default function ToolsPanel({
  selectedElement,
  selectedPage,
  pageData,
  onElementUpdate,
  onPageUpdate,
  onApplyLayout
}: ToolsPanelProps) {
  const [photoCount, setPhotoCount] = useState(1)

  // Renderizar sugestões de layout (quando nenhum elemento está selecionado)
  const renderLayoutSuggestions = () => (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Sugestões de Layout</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label htmlFor="photo-count">Número de fotos para esta lâmina</Label>
          <Input
            id="photo-count"
            type="number"
            min="1"
            max="10"
            value={photoCount}
            onChange={(e) => setPhotoCount(parseInt(e.target.value) || 1)}
            className="mt-1"
          />
        </div>
        
        <div className="space-y-2">
          <Label>Templates Disponíveis</Label>
          <div className="grid grid-cols-1 gap-2 max-h-96 overflow-y-auto">
            {layoutTemplates
              .filter(template => template.photoCount <= photoCount)
              .map(template => (
                <Button
                  key={template.id}
                  variant="outline"
                  className="h-auto p-3 text-left justify-start"
                  onClick={() => selectedPage && onApplyLayout(template, selectedPage)}
                  disabled={!selectedPage}
                >
                  <div className="flex items-center space-x-3">
                    <div className="text-2xl">{template.preview}</div>
                    <div>
                      <div className="font-medium">{template.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {template.photoCount} foto{template.photoCount > 1 ? 's' : ''}
                      </div>
                    </div>
                  </div>
                </Button>
              ))}
          </div>
        </div>
        
        {!selectedPage && (
          <div className="text-sm text-muted-foreground bg-muted p-3 rounded">
            💡 Selecione uma página (esquerda ou direita) para aplicar um layout
          </div>
        )}
      </CardContent>
    </Card>
  )

  // Renderizar ferramentas de edição de foto
  const renderPhotoTools = () => {
    if (!selectedElement || selectedElement.type !== 'photo') return null

    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Propriedades da Foto</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label>Largura</Label>
              <Input
                type="number"
                value={Math.round(selectedElement.width)}
                onChange={(e) => 
                  onElementUpdate(selectedElement.id, { 
                    width: parseInt(e.target.value) || selectedElement.width 
                  })
                }
                className="mt-1"
              />
            </div>
            <div>
              <Label>Altura</Label>
              <Input
                type="number"
                value={Math.round(selectedElement.height)}
                onChange={(e) => 
                  onElementUpdate(selectedElement.id, { 
                    height: parseInt(e.target.value) || selectedElement.height 
                  })
                }
                className="mt-1"
              />
            </div>
          </div>
          
          <div>
            <Label>Opacidade</Label>
            <Slider
              value={[selectedElement.opacity * 100]}
              onValueChange={([value]) => 
                onElementUpdate(selectedElement.id, { opacity: value / 100 })
              }
              min={0}
              max={100}
              step={1}
              className="mt-2"
            />
            <div className="text-sm text-muted-foreground mt-1">
              {Math.round(selectedElement.opacity * 100)}%
            </div>
          </div>
          
          <div className="mt-6 pt-4 border-t">
            <Button 
              variant="outline" 
              className="w-full"
              onClick={() => {
                // Implementar troca de imagem
                console.log('Trocar imagem')
              }}
            >
              🔄 Trocar Imagem
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Renderizar ferramentas de edição de texto
  const renderTextTools = () => {
    if (!selectedElement || selectedElement.type !== 'text') return null

    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Edição de Texto</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Texto</Label>
            <textarea
              value={typeof selectedElement.data?.text === 'string' ? selectedElement.data.text : ''}
              onChange={(e) => 
                onElementUpdate(selectedElement.id, { 
                  data: { ...selectedElement.data, text: e.target.value }
                })
              }
              className="w-full mt-1 p-2 border rounded resize-none"
              rows={3}
              placeholder="Digite seu texto aqui..."
            />
          </div>
          
          <div>
            <Label>Fonte</Label>
            <Select
              value={typeof selectedElement.data?.fontFamily === 'string' ? selectedElement.data.fontFamily : 'Arial'}
              onValueChange={(value) => 
                onElementUpdate(selectedElement.id, { 
                  data: { ...selectedElement.data, fontFamily: value }
                })
              }
            >
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {fontFamilies.map(font => (
                  <SelectItem key={font} value={font}>{font}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <Label>Tamanho</Label>
            <Slider
              value={[typeof selectedElement.data?.fontSize === 'number' ? selectedElement.data.fontSize : 16]}
              onValueChange={([value]) => 
                onElementUpdate(selectedElement.id, { 
                  data: { ...selectedElement.data, fontSize: value }
                })
              }
              min={8}
              max={72}
              step={1}
              className="mt-2"
            />
            <div className="text-sm text-muted-foreground mt-1">
              {typeof selectedElement.data?.fontSize === 'number' ? selectedElement.data.fontSize : 16}px
            </div>
          </div>
          
          <div>
            <Label>Cor</Label>
            <Input
              type="color"
              value={typeof selectedElement.data?.color === 'string' ? selectedElement.data.color : '#000000'}
              onChange={(e) => 
                onElementUpdate(selectedElement.id, { 
                  data: { ...selectedElement.data, color: e.target.value }
                })
              }
              className="mt-1 h-10"
            />
          </div>
          
          <div>
            <Label>Alinhamento</Label>
            <Select
              value={typeof selectedElement.data?.align === 'string' ? selectedElement.data.align : 'left'}
              onValueChange={(value) => 
                onElementUpdate(selectedElement.id, { 
                  data: { ...selectedElement.data, align: value }
                })
              }
            >
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="left">Esquerda</SelectItem>
                <SelectItem value="center">Centro</SelectItem>
                <SelectItem value="right">Direita</SelectItem>
                <SelectItem value="justify">Justificado</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Renderizar ferramentas de página
  const renderPageTools = () => {
    if (!selectedPage || !pageData) return null

    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">
            Configurações da Página {selectedPage === 'left' ? 'Esquerda' : 'Direita'}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Cor de Fundo</Label>
            <Input
              type="color"
              value={pageData.backgroundColor || '#ffffff'}
              onChange={(e) => 
                onPageUpdate(selectedPage, { backgroundColor: e.target.value })
              }
              className="mt-1 h-10"
            />
          </div>
          
          <div>
            <Label>Imagem de Fundo</Label>
            <div className="space-y-2">
              <Input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) {
                    const url = URL.createObjectURL(file)
                    onPageUpdate(selectedPage, { backgroundImage: url })
                  }
                }}
                className="mt-1"
              />
              {pageData.backgroundImage && (
                <div className="flex items-center space-x-2">
                  <Image
                    src={pageData.backgroundImage}
                    alt="Background"
                    width={48}
                    height={48}
                    className="object-cover rounded"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onPageUpdate(selectedPage, { backgroundImage: undefined })}
                  >
                    Remover
                  </Button>
                </div>
              )}
            </div>
          </div>
          
          {pageData.backgroundImage && (
            <div>
              <Label>Opacidade do Fundo</Label>
              <Slider
                value={[pageData.backgroundOpacity * 100]}
                onValueChange={([value]) => 
                  onPageUpdate(selectedPage, { backgroundOpacity: value / 100 })
                }
                min={0}
                max={100}
                step={5}
                className="mt-2"
              />
              <div className="text-sm text-muted-foreground mt-1">
                {Math.round(pageData.backgroundOpacity * 100)}%
              </div>
            </div>
          )}
          
          <div className="pt-4 border-t">
            <div className="text-sm text-muted-foreground">
              <div>Elementos na página: {pageData.elements.length}</div>
              <div className="mt-2">
                💡 Dica: Clique duplo na página para adicionar texto
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="h-full overflow-y-auto p-4 space-y-4">
      {/* Renderizar o painel apropriado baseado na seleção */}
      {selectedElement && selectedElement.type === 'photo' && renderPhotoTools()}
      {selectedElement && selectedElement.type === 'text' && renderTextTools()}
      {selectedPage && !selectedElement && renderPageTools()}
      {!selectedElement && !selectedPage && renderLayoutSuggestions()}
    </div>
  )
}