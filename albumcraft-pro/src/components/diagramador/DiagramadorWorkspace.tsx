'use client'

import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import PhotoGallery from './PhotoGallery'
import DiagramCanvas from './DiagramCanvas'
import ToolsPanel from './ToolsPanel'
import SpreadTimeline from './SpreadTimeline'
import { samplePhotos } from '@/data/sampleData'

interface Project {
  id: string
  name: string
  description?: string
  albumSize: string
  status: string
  creationType: string
  group?: string
  createdAt: string
  updatedAt: string
  _count: {
    pages: number
  }
}

interface Photo {
  id: string
  url: string
  name: string
  width: number
  height: number
  fileSize: number
  projectId?: string | null // Incluir projectId
}

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

interface Spread {
  id: string
  leftPage: Page
  rightPage: Page
}

interface AlbumConfig {
  width: number
  height: number
  dpi: number
  bleed: number
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

interface DiagramadorWorkspaceProps {
  project: Project
}

export default function DiagramadorWorkspace({ project }: DiagramadorWorkspaceProps) {
  // Estados principais
  const [photos, setPhotos] = useState<Photo[]>([])
  const [spreads, setSpreads] = useState<Spread[]>([])
  const [currentSpreadIndex, setCurrentSpreadIndex] = useState(0)
  const [selectedElement, setSelectedElement] = useState<DiagramElement | null>(null)
  const [selectedPage, setSelectedPage] = useState<'left' | 'right' | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [draggedPhoto, setDraggedPhoto] = useState<Photo | null>(null)
  const [albumConfig] = useState<AlbumConfig>({
    width: 500,
    height: 350,
    dpi: 300,
    bleed: 15
  })

  const loadPhotos = useCallback(async () => {
    try {
      setIsLoading(true)
      
      // Buscar fotos reais do projeto específico
      const response = await fetch(`/api/photos?projectId=${project.id}`)
      
      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          setPhotos(data.data)
        } else {
          console.error('Erro ao carregar fotos:', data.error)
          // Fallback para dados de exemplo se não houver fotos
          setPhotos(samplePhotos)
        }
      } else {
        console.error('Erro na requisição de fotos')
        // Fallback para dados de exemplo
        setPhotos(samplePhotos)
      }
    } catch (error) {
      console.error('Erro ao carregar fotos:', error)
      // Fallback para dados de exemplo em caso de erro
      setPhotos(samplePhotos)
    } finally {
      setIsLoading(false)
    }
  }, [project.id])

  const initializeProject = useCallback(async () => {
    try {
      setIsLoading(true)
      
      // Carregar fotos do projeto
      await loadPhotos()
      
      // Inicializar com uma lâmina dupla
      const initialSpread: Spread = {
        id: `spread-${Date.now()}`,
        leftPage: {
          id: `page-left-${Date.now()}`,
          elements: [],
          backgroundColor: '#ffffff',
          backgroundOpacity: 1
        },
        rightPage: {
          id: `page-right-${Date.now()}`,
          elements: [],
          backgroundColor: '#ffffff',
          backgroundOpacity: 1
        }
      }
      
      setSpreads([initialSpread])
    } catch (error) {
      console.error('Error initializing project:', error)
    } finally {
      setIsLoading(false)
    }
  }, [loadPhotos])

  // Inicialização
  useEffect(() => {
    initializeProject()
  }, [initializeProject])

  // Funções de manipulação de lâminas
  const addSpread = () => {
    const newSpread: Spread = {
      id: `spread-${Date.now()}`,
      leftPage: {
        id: `page-left-${Date.now()}`,
        elements: [],
        backgroundColor: '#ffffff',
        backgroundOpacity: 1
      },
      rightPage: {
        id: `page-right-${Date.now()}`,
        elements: [],
        backgroundColor: '#ffffff',
        backgroundOpacity: 1
      }
    }
    setSpreads(prev => [...prev, newSpread])
    setCurrentSpreadIndex(spreads.length)
  }

  const removeSpread = (index: number) => {
    if (spreads.length <= 1) return
    
    setSpreads(prev => prev.filter((_, i) => i !== index))
    
    if (currentSpreadIndex >= spreads.length - 1) {
      setCurrentSpreadIndex(Math.max(0, spreads.length - 2))
    }
  }

  const reorderSpreads = (startIndex: number, endIndex: number) => {
    const result = Array.from(spreads)
    const [removed] = result.splice(startIndex, 1)
    result.splice(endIndex, 0, removed)
    
    setSpreads(result)
    
    // Ajustar índice atual se necessário
    if (currentSpreadIndex === startIndex) {
      setCurrentSpreadIndex(endIndex)
    } else if (currentSpreadIndex > startIndex && currentSpreadIndex <= endIndex) {
      setCurrentSpreadIndex(currentSpreadIndex - 1)
    } else if (currentSpreadIndex < startIndex && currentSpreadIndex >= endIndex) {
      setCurrentSpreadIndex(currentSpreadIndex + 1)
    }
  }

  // Funções de drag and drop
  const handlePhotoDragStart = (photo: Photo) => {
    setDraggedPhoto(photo)
  }

  const handlePhotoDrop = (x: number, y: number, page: 'left' | 'right') => {
    if (!draggedPhoto) return

    const newElement: DiagramElement = {
      id: `photo-${Date.now()}`,
      type: 'photo',
      x,
      y,
      width: 200,
      height: 150,
      rotation: 0,
      opacity: 1,
      zIndex: spreads[currentSpreadIndex][`${page}Page`].elements.length + 1,
      data: {
        url: draggedPhoto.url,
        originalWidth: draggedPhoto.width,
        originalHeight: draggedPhoto.height,
        zoom: 100,
        saturation: 100,
        brightness: 100
      }
    }

    setSpreads(prev => {
      const updated = [...prev]
      updated[currentSpreadIndex][`${page}Page`].elements.push(newElement)
      return updated
    })

    setDraggedPhoto(null)
  }

  // Funções de seleção
  const handleElementSelect = (element: DiagramElement) => {
    setSelectedElement(element)
    setSelectedPage(null)
  }

  const handlePageSelect = (page: 'left' | 'right') => {
    setSelectedPage(page)
    setSelectedElement(null)
  }

  const handleDeselectAll = () => {
    setSelectedElement(null)
    setSelectedPage(null)
  }

  // Atualização de elementos
  const handleElementUpdate = (elementId: string, updates: Partial<DiagramElement>) => {
    setSpreads(prev => {
      const updated = [...prev]
      const currentSpread = updated[currentSpreadIndex]
      
      // Procurar o elemento na página esquerda
      let elementIndex = currentSpread.leftPage.elements.findIndex(el => el.id === elementId)
      if (elementIndex !== -1) {
        currentSpread.leftPage.elements[elementIndex] = {
          ...currentSpread.leftPage.elements[elementIndex],
          ...updates
        }
      } else {
        // Procurar na página direita
        elementIndex = currentSpread.rightPage.elements.findIndex(el => el.id === elementId)
        if (elementIndex !== -1) {
          currentSpread.rightPage.elements[elementIndex] = {
            ...currentSpread.rightPage.elements[elementIndex],
            ...updates
          }
        }
      }
      
      return updated
    })

    // Atualizar elemento selecionado se for o mesmo
    if (selectedElement?.id === elementId) {
      setSelectedElement(prev => prev ? { ...prev, ...updates } : null)
    }
  }

  // Atualização de páginas
  const handlePageUpdate = (page: 'left' | 'right', updates: Partial<Page>) => {
    setSpreads(prev => {
      const updated = [...prev]
      updated[currentSpreadIndex][`${page}Page`] = {
        ...updated[currentSpreadIndex][`${page}Page`],
        ...updates
      }
      return updated
    })
  }

  // Aplicar layout template
  const handleApplyLayout = (template: LayoutTemplate, page: 'left' | 'right') => {
    // Remover elementos existentes da página
    setSpreads(prev => {
      const updated = [...prev]
      updated[currentSpreadIndex][`${page}Page`].elements = []
      return updated
    })

    // Aplicar novo layout com fotos disponíveis
    const availablePhotos = photos.slice(0, template.photoCount)
    
    template.layout.forEach((position, index) => {
      if (index < availablePhotos.length) {
        const photo = availablePhotos[index]
        const newElement: DiagramElement = {
          id: `photo-${Date.now()}-${index}`,
          type: 'photo',
          x: position.x,
          y: position.y,
          width: position.width,
          height: position.height,
          rotation: 0,
          opacity: 1,
          zIndex: index + 1,
          data: {
            url: photo.url,
            originalWidth: photo.width,
            originalHeight: photo.height,
            zoom: 100,
            saturation: 100,
            brightness: 100
          }
        }

        setSpreads(prev => {
          const updated = [...prev]
          updated[currentSpreadIndex][`${page}Page`].elements.push(newElement)
          return updated
        })
      }
    })
  }

  // Função de exportação
  const handleExport = async () => {
    try {
      // Implementar lógica de exportação
      console.log('Exporting project...', { project, spreads })
      alert('Funcionalidade de exportação será implementada!')
    } catch (error) {
      console.error('Export error:', error)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <div className="text-center space-y-4">
          <div className="relative">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-primary/20 border-t-primary mx-auto"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-6 h-6 bg-primary rounded-full animate-pulse"></div>
            </div>
          </div>
          <div className="space-y-2">
            <p className="text-lg font-medium">Carregando projeto...</p>
            <p className="text-sm text-muted-foreground">Preparando o ambiente de diagramação</p>
          </div>
          <div className="flex justify-center space-x-1">
            <div className="w-2 h-2 bg-primary rounded-full animate-bounce"></div>
            <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
            <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
          </div>
        </div>
      </div>
    )
  }

  const currentSpread = spreads[currentSpreadIndex]
  const currentPageData = selectedPage ? currentSpread?.[`${selectedPage}Page`] : null

  return (
    <div className="flex-1 flex flex-col h-[calc(100vh-73px)]">
      {/* Barra de Ferramentas Superior */}
      <div className="border-b bg-card px-4 py-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="text-sm text-muted-foreground">
              Lâmina {currentSpreadIndex + 1} de {spreads.length}
            </div>
            <div className="text-sm text-muted-foreground">
              {project.albumSize} • {albumConfig.dpi} DPI
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm">
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
              Importar Fotos
            </Button>
            <Button variant="outline" size="sm">
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
              </svg>
              Layouts
            </Button>
            <Button onClick={handleExport}>
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Exportar
            </Button>
          </div>
        </div>
      </div>

      {/* Área Principal */}
      <div className="flex-1 flex">
        {/* Painel Esquerdo - Galeria de Fotos */}
        <div className="w-80 border-r bg-card flex-shrink-0">
          <PhotoGallery
            photos={photos}
            projectId={project.id} // Passar o ID do projeto
            onPhotoDragStart={handlePhotoDragStart}
            onPhotoDragEnd={() => setDraggedPhoto(null)}
            onPhotoImport={async (newPhotos) => {
              // Adicionar as novas fotos ao estado
              setPhotos(prev => [...newPhotos, ...prev])
              
              // Recarregar todas as fotos para garantir sincronização
              try {
                const response = await fetch(`/api/photos?projectId=${project.id}`)
                if (response.ok) {
                  const data = await response.json()
                  if (data.success) {
                    setPhotos(data.data)
                  }
                }
              } catch (error) {
                console.error('Erro ao recarregar fotos:', error)
              }
            }}
          />
        </div>

        {/* Área Central - Canvas de Diagramação */}
        <div className="flex-1">
          {currentSpread && (
            <DiagramCanvas
              spread={currentSpread}
              albumConfig={albumConfig}
              selectedElement={selectedElement}
              selectedPage={selectedPage}
              onElementSelect={handleElementSelect}
              onPageSelect={handlePageSelect}
              onDeselectAll={handleDeselectAll}
              onPhotoDrop={handlePhotoDrop}
              draggedPhoto={draggedPhoto}
            />
          )}
        </div>

        {/* Painel Direito - Ferramentas */}
        <div className="w-80 border-l bg-card">
          <ToolsPanel
            selectedElement={selectedElement}
            selectedPage={selectedPage}
            pageData={currentPageData}
            onElementUpdate={handleElementUpdate}
            onPageUpdate={handlePageUpdate}
            onApplyLayout={handleApplyLayout}
          />
        </div>
      </div>

      {/* Linha do Tempo - Fixa na parte inferior */}
      <div className="h-48 border-t flex-shrink-0">
        <SpreadTimeline
          spreads={spreads}
          currentSpreadIndex={currentSpreadIndex}
          onSpreadSelect={setCurrentSpreadIndex}
          onSpreadAdd={addSpread}
          onSpreadRemove={removeSpread}
          onSpreadReorder={reorderSpreads}
        />
      </div>
    </div>
  )
}