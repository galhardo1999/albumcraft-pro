'use client'

import React, { useState, useRef, useCallback, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Download, ZoomIn, ZoomOut, Square } from 'lucide-react'
import PhotoGallery from './PhotoGallery'
import DiagramCanvas from './DiagramCanvas'
import ToolsPanel from './ToolsPanel'
import SpreadTimeline from './SpreadTimeline'
import { samplePhotos } from '@/data/sampleData'
import { getAlbumSizeByIdWithFallback, calculatePixelDimensions } from '@/lib/album-sizes'

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
  originalUrl: string
  filename: string
  width: number
  height: number
  fileSize: number
  projectId?: string | null
  thumbnailUrl?: string
  mediumUrl?: string
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
  widthCm: number
  heightCm: number
  aspectRatio: number
  category: string
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
  // Obter configuração do tamanho do álbum
  const albumSizeConfig = getAlbumSizeByIdWithFallback(project.albumSize)
  
  // Calcular dimensões em pixels para o canvas (300 DPI padrão)
  const canvasDimensions = calculatePixelDimensions(
    albumSizeConfig.width, 
    albumSizeConfig.height, 
    300
  )
  
  // Estados principais
  const [photos, setPhotos] = useState<Photo[]>([])
  const [spreads, setSpreads] = useState<Spread[]>([])
  const [currentSpreadIndex, setCurrentSpreadIndex] = useState(0)
  const [selectedElement, setSelectedElement] = useState<DiagramElement | null>(null)
  const [selectedPage, setSelectedPage] = useState<'left' | 'right' | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [draggedPhoto, setDraggedPhoto] = useState<Photo | null>(null)
  
  // Estados de zoom e visualização
  const [zoomLevel, setZoomLevel] = useState(0.5) // Começar com 50% para caber na tela
  const [panPosition, setPanPosition] = useState({ x: 0, y: 0 })
  const [isPanning, setIsPanning] = useState(false)
  const [lastPanPoint, setLastPanPoint] = useState({ x: 0, y: 0 })
  
  // Refs
  const canvasContainerRef = useRef<HTMLDivElement>(null)
  
  // Configuração do álbum
  const [albumConfig] = useState<AlbumConfig>({
      width: canvasDimensions.width,
      height: canvasDimensions.height,
      dpi: 300,
      bleed: 15,
      // Informações adicionais do tamanho
      widthCm: albumSizeConfig.width,
      heightCm: albumSizeConfig.height,
      aspectRatio: albumSizeConfig.aspectRatio,
      category: albumSizeConfig.category
    })

  // Controles de zoom
  const zoomLevels = [0.1, 0.25, 0.5, 0.75, 1.0, 1.25, 1.5, 2.0, 3.0, 4.0]
  
  const handleZoomIn = () => {
    const currentIndex = zoomLevels.findIndex(level => level >= zoomLevel)
    const nextIndex = Math.min(currentIndex + 1, zoomLevels.length - 1)
    setZoomLevel(zoomLevels[nextIndex])
  }
  
  const handleZoomOut = () => {
    const currentIndex = zoomLevels.findIndex(level => level >= zoomLevel)
    const prevIndex = Math.max(currentIndex - 1, 0)
    setZoomLevel(zoomLevels[prevIndex])
  }
  
  const handleZoomFit = () => {
    if (!canvasContainerRef.current) return
    
    const container = canvasContainerRef.current
    const containerWidth = container.clientWidth - 40 // padding
    const containerHeight = container.clientHeight - 40 // padding
    
    const canvasWidth = albumConfig.width * 2 // lâmina dupla
    const canvasHeight = albumConfig.height
    
    const scaleX = containerWidth / canvasWidth
    const scaleY = containerHeight / canvasHeight
    const scale = Math.min(scaleX, scaleY, 1.0) // não aumentar além de 100%
    
    setZoomLevel(scale)
    setPanPosition({ x: 0, y: 0 }) // centralizar
  }
  
  const handleZoomActualSize = () => {
    setZoomLevel(1.0)
    setPanPosition({ x: 0, y: 0 })
  }
  
  // Controles de pan (arrastar para mover)
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button === 1 || (e.button === 0 && e.altKey)) { // botão do meio ou Alt+click
      setIsPanning(true)
      setLastPanPoint({ x: e.clientX, y: e.clientY })
      e.preventDefault()
    }
  }
  
  const handleMouseMove = (e: React.MouseEvent) => {
    if (isPanning) {
      const deltaX = e.clientX - lastPanPoint.x
      const deltaY = e.clientY - lastPanPoint.y
      
      setPanPosition(prev => ({
        x: prev.x + deltaX,
        y: prev.y + deltaY
      }))
      
      setLastPanPoint({ x: e.clientX, y: e.clientY })
    }
  }
  
  const handleMouseUp = () => {
    setIsPanning(false)
  }
  
  // Zoom com scroll do mouse
  const handleWheel = (e: React.WheelEvent) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault()
      
      const delta = e.deltaY > 0 ? -1 : 1
      const currentIndex = zoomLevels.findIndex(level => level >= zoomLevel)
      const newIndex = Math.max(0, Math.min(zoomLevels.length - 1, currentIndex + delta))
      
      setZoomLevel(zoomLevels[newIndex])
    }
  }

  const loadPhotos = useCallback(async () => {
    try {
      console.log('🔄 Carregando fotos do projeto:', project.id)
      const response = await fetch(`/api/photos?projectId=${project.id}`, {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        console.log('📸 Resposta da API de fotos:', data)
        
        if (data.success && data.data && Array.isArray(data.data)) {
          console.log(`✅ ${data.data.length} fotos encontradas para o projeto`)
          setPhotos(data.data)
          
          // Se não há fotos reais, usar fotos de exemplo apenas para demonstração
          if (data.data.length === 0) {
            console.log('📷 Nenhuma foto real encontrada, usando fotos de exemplo para demonstração')
            const mappedSamplePhotos = samplePhotos.map(photo => ({
              ...photo,
              originalUrl: photo.url,
              filename: photo.name
            }))
            setPhotos(mappedSamplePhotos)
          }
        } else {
          console.log('📷 Estrutura de dados inválida, usando fotos de exemplo')
          console.log('Dados recebidos:', data)
          const mappedSamplePhotos = samplePhotos.map(photo => ({
            ...photo,
            originalUrl: photo.url,
            filename: photo.name
          }))
          setPhotos(mappedSamplePhotos)
        }
      } else {
        const errorData = await response.json().catch(() => ({ error: 'Erro desconhecido' }))
        console.error('❌ Erro HTTP ao carregar fotos:', response.status, errorData)
        
        // Só usar fotos de exemplo se for erro de autorização ou não encontrado
        if (response.status === 401 || response.status === 404) {
          console.log('📷 Usando fotos de exemplo devido ao erro de autorização/não encontrado')
          const mappedSamplePhotos = samplePhotos.map(photo => ({
            ...photo,
            originalUrl: photo.url,
            filename: photo.name
          }))
          setPhotos(mappedSamplePhotos)
        } else {
          // Para outros erros, deixar vazio para mostrar o problema real
          setPhotos([])
        }
      }
    } catch (error) {
      console.error('❌ Erro de rede ao carregar fotos:', error)
      // Em caso de erro de rede, deixar vazio para mostrar o problema
      setPhotos([])
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
        url: draggedPhoto.originalUrl,
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
            url: photo.originalUrl,
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
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Navbar Superior Fixa */}
      <div className="border-b bg-card px-4 py-2 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="text-sm text-muted-foreground">
              Lâmina {currentSpreadIndex + 1} de {spreads.length}
            </div>
            <div className="text-sm text-muted-foreground">
              {project.albumSize} • {albumConfig.dpi} DPI
            </div>
            <Separator orientation="vertical" className="h-4" />
            <div className="text-sm font-medium">
              Zoom: {Math.round(zoomLevel * 100)}%
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            {/* Controles de Zoom */}
            <div className="flex items-center space-x-1 border rounded-md">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={handleZoomOut}
                disabled={zoomLevel <= zoomLevels[0]}
              >
                <ZoomOut className="w-4 h-4" />
              </Button>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={handleZoomFit}
                title="Ajustar à tela"
              >
                <Square className="w-4 h-4" />
              </Button>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={handleZoomActualSize}
                title="Tamanho real (100%)"
              >
                100%
              </Button>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={handleZoomIn}
                disabled={zoomLevel >= zoomLevels[zoomLevels.length - 1]}
              >
                <ZoomIn className="w-4 h-4" />
              </Button>
            </div>
            
            <Separator orientation="vertical" className="h-6" />
            
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
              <Download className="w-4 h-4 mr-2" />
              Exportar
            </Button>
          </div>
        </div>
      </div>

      {/* Área Principal com Layout Fixo */}
      <div className="flex-1 flex min-h-0">
        {/* Painel Esquerdo - Galeria de Fotos (Fixo) */}
        <div className="w-80 border-r bg-card flex-shrink-0 flex flex-col">
          <PhotoGallery
            photos={photos}
            projectId={project.id}
            onPhotoDragStart={handlePhotoDragStart}
            onPhotoDragEnd={() => setDraggedPhoto(null)}
            onPhotoImport={async (newPhotos) => {
              setPhotos(prev => [...newPhotos, ...prev])
              
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

        {/* Área Central - Canvas de Diagramação com Scroll */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Informações do Canvas */}
          <div className="flex items-center justify-center p-2 border-b bg-muted/30 flex-shrink-0">
            <div className="text-xs text-muted-foreground">
              {albumConfig.width * 2}×{albumConfig.height}px • Use Ctrl+Scroll para zoom • Alt+Click para mover
            </div>
          </div>
          
          {/* Container do Canvas com Scroll */}
          <div 
            ref={canvasContainerRef}
            className="flex-1 overflow-auto bg-gray-100 relative"
            onWheel={handleWheel}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            style={{ 
              cursor: isPanning ? 'grabbing' : 'grab'
            }}
          >
            <div 
              className="flex justify-center items-center min-h-full p-8"
              style={{
                transform: `translate(${panPosition.x}px, ${panPosition.y}px)`,
                transition: isPanning ? 'none' : 'transform 0.1s ease-out'
              }}
            >
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
                  zoomLevel={zoomLevel}
                />
              )}
            </div>
          </div>
        </div>

        {/* Painel Direito - Ferramentas (Fixo) */}
        <div className="w-80 border-l bg-card flex-shrink-0">
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

      {/* Timeline Inferior (Fixo) */}
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