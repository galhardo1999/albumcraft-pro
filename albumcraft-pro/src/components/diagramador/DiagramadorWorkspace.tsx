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
import { Album } from '@/types/album'

interface Photo {
  id: string
  originalUrl: string
  filename: string
  width: number
  height: number
  fileSize: number
  albumId?: string | null
  thumbnailUrl?: string
  mediumUrl?: string
}

interface ImportedPhoto {
  id: string
  originalUrl?: string
  url?: string
  filename?: string
  name?: string
  width: number
  height: number
  fileSize: number
  albumId?: string | null
  thumbnailUrl?: string
  mediumUrl?: string
}

interface ApiPhoto {
  id: string
  s3Url: string
  filename: string
  width?: number
  height?: number
  size: number
  albumId?: string | null
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
  album: Album
}

export default function DiagramadorWorkspace({ album }: DiagramadorWorkspaceProps) {
  // Obter configuração do tamanho do álbum
  const albumSizeConfig = getAlbumSizeByIdWithFallback(album.albumSize)
  
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
  const [isZooming, setIsZooming] = useState(false)
  const [zoomDirection, setZoomDirection] = useState<'in' | 'out' | null>(null)
  const zoomIntervalRef = useRef<NodeJS.Timeout | null>(null)
  
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
  const MIN_ZOOM = 0.1
  const MAX_ZOOM = 4.0
  const ZOOM_STEP = 0.01 // 1%
  
  const handleZoomIn = () => {
    setZoomLevel(prev => Math.min(prev + ZOOM_STEP, MAX_ZOOM))
  }
  
  const handleZoomOut = () => {
    setZoomLevel(prev => Math.max(prev - ZOOM_STEP, MIN_ZOOM))
  }
  
  // Zoom contínuo
  const startContinuousZoom = (direction: 'in' | 'out') => {
    setIsZooming(true)
    setZoomDirection(direction)
    
    // Primeiro zoom imediato
    if (direction === 'in') {
      handleZoomIn()
    } else {
      handleZoomOut()
    }
    
    // Zoom contínuo após 300ms
    setTimeout(() => {
      if (zoomIntervalRef.current) clearInterval(zoomIntervalRef.current)
      zoomIntervalRef.current = setInterval(() => {
        if (direction === 'in') {
          setZoomLevel(prev => Math.min(prev + ZOOM_STEP, MAX_ZOOM))
        } else {
          setZoomLevel(prev => Math.max(prev - ZOOM_STEP, MIN_ZOOM))
        }
      }, 50) // 20 FPS para suavidade
    }, 300)
  }
  
  const stopContinuousZoom = () => {
    setIsZooming(false)
    setZoomDirection(null)
    if (zoomIntervalRef.current) {
      clearInterval(zoomIntervalRef.current)
      zoomIntervalRef.current = null
    }
  }
  
  // Cleanup do interval
  useEffect(() => {
    return () => {
      if (zoomIntervalRef.current) {
        clearInterval(zoomIntervalRef.current)
      }
    }
  }, [])
  
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
      
      const delta = e.deltaY > 0 ? -ZOOM_STEP * 5 : ZOOM_STEP * 5 // 5% por scroll
      setZoomLevel(prev => Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, prev + delta)))
    }
  }

  const loadPhotos = useCallback(async () => {
    try {
      console.log('🔄 Carregando fotos do álbum:', album.id)
    const response = await fetch(`/api/photos?albumId=${album.id}`, {
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
          const mapped = data.data.map((p: ApiPhoto) => ({
            id: p.id,
            originalUrl: p.s3Url,
            filename: p.filename,
            width: p.width ?? 0,
            height: p.height ?? 0,
            fileSize: p.size ?? 0,
            albumId: p.albumId ?? undefined,
            thumbnailUrl: p.thumbnailUrl ?? undefined,
            mediumUrl: p.mediumUrl ?? undefined,
          }))
          setPhotos(mapped)
          
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
  }, [album.id])

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

  // Após inicializar (loading concluído), ajustar automaticamente para caber na tela
  useEffect(() => {
    if (!isLoading && canvasContainerRef.current) {
      requestAnimationFrame(() => {
        handleZoomFit()
      })
    }
  }, [isLoading, albumConfig.width, albumConfig.height])

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

  // Fun e7 f5es de drag and drop
  const handlePhotoDrop = (x: number, y: number, page: 'left' | 'right', targetElementId?: string) => {
    if (!draggedPhoto && !targetElementId) return
  
    setSpreads(prev => {
      const updated = [...prev]
      const pageKey = `${page}Page` as const
      const current = updated[currentSpreadIndex]
  
      if (targetElementId) {
        // Preencher um placeholder existente
        const elements = current[pageKey].elements
        const idx = elements.findIndex(el => el.id === targetElementId)
        if (idx !== -1) {
          const el = elements[idx]
          elements[idx] = {
            ...el,
            data: {
              ...(el.data || {}),
              url: draggedPhoto ? draggedPhoto.originalUrl : (el.data as Record<string, unknown>)?.url,
              placeholder: false,
              originalWidth: draggedPhoto ? draggedPhoto.width : (el.data as Record<string, unknown>)?.originalWidth,
              originalHeight: draggedPhoto ? draggedPhoto.height : (el.data as Record<string, unknown>)?.originalHeight,
              zoom: 100,
              saturation: 100,
              brightness: 100
            }
          }
        }
        return updated
      }
  
      if (!draggedPhoto) return updated
  
      // Inserir nova foto solta livremente no canvas
      const isPortrait = draggedPhoto.height >= draggedPhoto.width
      const defaultWidth = isPortrait ? 1350 : 200
      const defaultHeight = isPortrait ? 2000 : 150
      
      const newElement: DiagramElement = {
        id: `photo-${typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2,8)}`}`,
        type: 'photo',
        x: x - defaultWidth / 2,
        y: y - defaultHeight / 2,
        width: defaultWidth,
        height: defaultHeight,
        rotation: 0,
        opacity: 1,
        zIndex: current[pageKey].elements.length + 1,
        data: {
          url: draggedPhoto.originalUrl,
          originalWidth: draggedPhoto.width,
          originalHeight: draggedPhoto.height,
          zoom: 100,
          saturation: 100,
          brightness: 100
        }
      }
  
      current[pageKey].elements.push(newElement)
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
    setSpreads(prev => {
      const updated = [...prev]
      const placeholders: DiagramElement[] = template.layout.map((position, index) => ({
        id: `frame-${typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : `${Date.now()}-${index}-${Math.random().toString(36).slice(2,8)}`}`,
        type: 'photo',
        x: position.x,
        y: position.y,
        width: position.width,
        height: position.height,
        rotation: 0,
        opacity: 1,
        zIndex: index + 1,
        data: {
          url: '',
          placeholder: true
        }
      }))

      updated[currentSpreadIndex][`${page}Page`].elements = placeholders
      return updated
    })
  }

  // Função de exportação
  const handleExport = async () => {
    try {
      // Implementar lógica de exportação
      console.log('Exporting album...', { album, spreads })
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
              {album.albumSize} • {albumConfig.dpi} DPI
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
                onMouseDown={() => startContinuousZoom('out')}
                onMouseUp={stopContinuousZoom}
                onMouseLeave={stopContinuousZoom}
                disabled={zoomLevel <= MIN_ZOOM}
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
                onMouseDown={() => startContinuousZoom('in')}
                onMouseUp={stopContinuousZoom}
                onMouseLeave={stopContinuousZoom}
                disabled={zoomLevel >= MAX_ZOOM}
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
            albumId={album.id}
            onPhotoDragStart={handlePhotoDragStart}
            onPhotoDragEnd={() => setDraggedPhoto(null)}
            onPhotoImport={async (newPhotos) => {
              const mappedNew = newPhotos.map((p: ImportedPhoto) => ({
                id: p.id,
                originalUrl: p.originalUrl ?? p.url ?? '',
                filename: p.filename ?? p.name ?? '',
                width: p.width,
                height: p.height,
                fileSize: p.fileSize,
                albumId: p.albumId,
                thumbnailUrl: p.thumbnailUrl,
                mediumUrl: p.mediumUrl,
              }))
              setPhotos(prev => [...mappedNew, ...prev])
              
              try {
                const response = await fetch(`/api/photos?albumId=${album.id}`)
                if (response.ok) {
                  const data = await response.json()
                  if (data.success && Array.isArray(data.data)) {
                    const remapped = data.data.map((p: ApiPhoto) => ({
                      id: p.id,
                      originalUrl: p.s3Url,
                      filename: p.filename,
                      width: p.width ?? 0,
                      height: p.height ?? 0,
                      fileSize: p.size ?? 0,
                      albumId: p.albumId ?? undefined,
                      thumbnailUrl: p.thumbnailUrl ?? undefined,
                      mediumUrl: p.mediumUrl ?? undefined,
                    }))
                    setPhotos(remapped)
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