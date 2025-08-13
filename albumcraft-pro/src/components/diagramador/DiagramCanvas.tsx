'use client'

import { useState, useRef, useCallback } from 'react'
import Image from 'next/image'

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

interface DiagramCanvasProps {
  spread: Spread
  albumConfig: AlbumConfig
  selectedElement: DiagramElement | null
  selectedPage: 'left' | 'right' | null
  onElementSelect: (element: DiagramElement) => void
  onPageSelect: (page: 'left' | 'right') => void
  onDeselectAll: () => void
  onPhotoDrop: (x: number, y: number, page: 'left' | 'right') => void
  draggedPhoto: Photo | null
  zoomLevel?: number
}

export default function DiagramCanvas({
  spread,
  albumConfig,
  selectedElement,
  selectedPage,
  onElementSelect,
  onPageSelect,
  onPhotoDrop,
  draggedPhoto,
  zoomLevel = 1.0
}: DiagramCanvasProps) {
  const canvasRef = useRef<HTMLDivElement>(null)
  const [showGuides, setShowGuides] = useState(false)
  const [guides] = useState<{ x: number[], y: number[] }>({ x: [], y: [] })
  
  // Usar o zoom level passado como prop
  const scale = zoomLevel

  // Calcular dimensões do canvas
  const canvasWidth = albumConfig.width * 2 // Lâmina dupla
  const canvasHeight = albumConfig.height
  const displayWidth = canvasWidth * scale
  const displayHeight = canvasHeight * scale

  // Áreas de segurança e sangria
  const safeArea = 50 // pixels da borda
  const bleedArea = albumConfig.bleed

  // Funções de conversão de coordenadas
  const screenToCanvas = useCallback((screenX: number, screenY: number) => {
    if (!canvasRef.current) return { x: 0, y: 0 }
    
    const rect = canvasRef.current.getBoundingClientRect()
    const x = (screenX - rect.left) / scale
    const y = (screenY - rect.top) / scale
    
    return { x, y }
  }, [scale])

  // Detectar qual página está sendo clicada
  const getPageFromCoordinates = (x: number) => {
    return x < albumConfig.width ? 'left' : 'right'
  }

  // Ajustar coordenadas para a página específica
  const adjustCoordinatesForPage = (x: number, page: 'left' | 'right') => {
    return page === 'right' ? x - albumConfig.width : x
  }

  // Handlers de eventos
  const handleCanvasClick = (event: React.MouseEvent) => {
    const { x, y } = screenToCanvas(event.clientX, event.clientY)
    const page = getPageFromCoordinates(x)
    const adjustedX = adjustCoordinatesForPage(x, page)
    
    // Verificar se clicou em algum elemento
    const pageData = spread[`${page}Page`]
    const clickedElement = pageData.elements
      .sort((a, b) => b.zIndex - a.zIndex)
      .find(element => 
        adjustedX >= element.x && 
        adjustedX <= element.x + element.width &&
        y >= element.y && 
        y <= element.y + element.height
      )

    if (clickedElement) {
      onElementSelect(clickedElement)
    } else {
      onPageSelect(page)
    }
  }

  const handleCanvasDoubleClick = (event: React.MouseEvent) => {
    const { x, y } = screenToCanvas(event.clientX, event.clientY)
    const page = getPageFromCoordinates(x)
    const adjustedX = adjustCoordinatesForPage(x, page)
    
    // Adicionar caixa de texto
    const newTextElement: DiagramElement = {
      id: `text-${Date.now()}`,
      type: 'text',
      x: adjustedX - 100,
      y: y - 25,
      width: 200,
      height: 50,
      rotation: 0,
      opacity: 1,
      zIndex: spread[`${page}Page`].elements.length + 1,
      data: {
        text: 'Texto aqui...',
        fontSize: 16,
        fontFamily: 'Arial',
        color: '#000000',
        align: 'left'
      }
    }

    // Aqui você adicionaria o elemento ao spread
    console.log('Add text element:', newTextElement)
  }

  // Drag and Drop
  const handleDragOver = (event: React.DragEvent) => {
    event.preventDefault()
    if (draggedPhoto) {
      setShowGuides(true)
      // Aqui você calcularia as guias baseadas nos elementos existentes
    }
  }

  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault()
    if (draggedPhoto) {
      const { x, y } = screenToCanvas(event.clientX, event.clientY)
      const page = getPageFromCoordinates(x)
      const adjustedX = adjustCoordinatesForPage(x, page)
      
      onPhotoDrop(adjustedX - 100, y - 75, page) // Centralizar a foto no cursor
    }
    setShowGuides(false)
  }

  const handleDragLeave = () => {
    setShowGuides(false)
  }



  // Renderizar elemento
  const renderElement = (element: DiagramElement, page: 'left' | 'right') => {
    const isSelected = selectedElement?.id === element.id
    const pageOffsetX = page === 'right' ? albumConfig.width : 0
    
    const style = {
      position: 'absolute' as const,
      left: (element.x + pageOffsetX) * scale,
      top: element.y * scale,
      width: element.width * scale,
      height: element.height * scale,
      transform: `rotate(${element.rotation}deg)`,
      opacity: element.opacity,
      zIndex: element.zIndex,
      cursor: 'move'
    }

    const className = `border-2 transition-colors ${
      isSelected 
        ? 'border-primary shadow-lg' 
        : 'border-transparent hover:border-primary/50'
    }`

    if (element.type === 'photo') {
      return (
        <div
          key={element.id}
          style={style}
          className={className}
          onClick={(e) => {
            e.stopPropagation()
            onElementSelect(element)
          }}
        >
          <Image
            src={element.data.url as string}
            alt="Photo"
            width={element.width}
            height={element.height}
            className="w-full h-full object-cover rounded"
            draggable={false}
          />
          
          {/* Handles de redimensionamento */}
          {isSelected && (
            <>
              <div className="absolute -top-1 -left-1 w-3 h-3 bg-primary rounded-full cursor-nw-resize" />
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-primary rounded-full cursor-ne-resize" />
              <div className="absolute -bottom-1 -left-1 w-3 h-3 bg-primary rounded-full cursor-sw-resize" />
              <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-primary rounded-full cursor-se-resize" />
            </>
          )}
        </div>
      )
    }

    if (element.type === 'text') {
      return (
        <div
          key={element.id}
          style={style}
          className={`${className} flex items-center justify-center bg-white/80 rounded`}
          onClick={(e) => {
            e.stopPropagation()
            onElementSelect(element)
          }}
        >
          <span
            style={{
              fontSize: (typeof element.data.fontSize === 'number' ? element.data.fontSize : 16) * scale,
              fontFamily: (typeof element.data.fontFamily === 'string' ? element.data.fontFamily : 'Arial') as React.CSSProperties['fontFamily'],
              color: (typeof element.data.color === 'string' ? element.data.color : '#000000') as React.CSSProperties['color'],
              textAlign: (typeof element.data.align === 'string' ? element.data.align : 'left') as React.CSSProperties['textAlign']
            }}
          >
            {(typeof element.data.text === 'string' ? element.data.text : 'Texto')}
          </span>
          
          {/* Handles de redimensionamento */}
          {isSelected && (
            <>
              <div className="absolute -top-1 -left-1 w-3 h-3 bg-primary rounded-full cursor-nw-resize" />
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-primary rounded-full cursor-ne-resize" />
              <div className="absolute -bottom-1 -left-1 w-3 h-3 bg-primary rounded-full cursor-sw-resize" />
              <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-primary rounded-full cursor-se-resize" />
            </>
          )}
        </div>
      )
    }

    return null
  }

  // Renderizar página
  const renderPage = (page: 'left' | 'right') => {
    const pageData = spread[`${page}Page`]
    const isSelected = selectedPage === page
    const pageOffsetX = page === 'right' ? albumConfig.width : 0
    
    return (
      <div
        key={page}
        className={`absolute border-2 transition-colors ${
          isSelected 
            ? 'border-primary bg-primary/5' 
            : 'border-muted-foreground/20 hover:border-muted-foreground/40'
        }`}
        style={{
          left: pageOffsetX * scale,
          top: 0,
          width: albumConfig.width * scale,
          height: albumConfig.height * scale,
          backgroundColor: pageData.backgroundColor,
          backgroundImage: pageData.backgroundImage ? `url(${pageData.backgroundImage})` : undefined,
          backgroundSize: 'cover',
          backgroundPosition: 'center'
        }}
        onClick={() => onPageSelect(page)}
      >
        {/* Área de sangria */}
        <div
          className="absolute border border-red-300 border-dashed opacity-50"
          style={{
            left: -bleedArea * scale,
            top: -bleedArea * scale,
            width: (albumConfig.width + bleedArea * 2) * scale,
            height: (albumConfig.height + bleedArea * 2) * scale
          }}
        />
        
        {/* Área de segurança */}
        <div
          className="absolute border border-blue-300 border-dashed opacity-50"
          style={{
            left: safeArea * scale,
            top: safeArea * scale,
            width: (albumConfig.width - safeArea * 2) * scale,
            height: (albumConfig.height - safeArea * 2) * scale
          }}
        />
        
        {/* Label da página */}
        <div className="absolute top-2 left-2 text-xs bg-black/50 text-white px-2 py-1 rounded">
          {page === 'left' ? 'Página Esquerda' : 'Página Direita'}
        </div>
        
        {/* Elementos da página */}
        {pageData.elements.map(element => renderElement(element, page))}
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col bg-muted/10">
      {/* Informações do Album */}
      <div className="flex items-center justify-center p-4 border-b bg-card">
        <div className="text-sm text-muted-foreground">
          {albumConfig.width}×{albumConfig.height}px • {albumConfig.dpi} DPI • Zoom: 100%
        </div>
      </div>

      {/* Canvas Principal */}
      <div className="flex-1 overflow-auto bg-gray-100 p-8">
        <div className="flex justify-center">
          <div
            ref={canvasRef}
            className="relative bg-white shadow-2xl"
            style={{
              width: displayWidth,
              height: displayHeight
            }}
            onClick={handleCanvasClick}
            onDoubleClick={handleCanvasDoubleClick}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            onDragLeave={handleDragLeave}

          >
            {/* Réguas */}
            

            {/* Divisor central */}
            <div
              className="absolute top-0 bottom-0 border-l-2 border-dashed border-gray-400"
              style={{ left: albumConfig.width * scale }}
            />

            {/* Páginas */}
            {renderPage('left')}
            {renderPage('right')}

            {/* Guias de alinhamento */}
            {showGuides && (
              <>
                {guides.x.map((x, i) => (
                  <div
                    key={`guide-x-${i}`}
                    className="absolute top-0 bottom-0 border-l border-green-400 pointer-events-none"
                    style={{ left: x * scale }}
                  />
                ))}
                {guides.y.map((y, i) => (
                  <div
                    key={`guide-y-${i}`}
                    className="absolute left-0 right-0 border-t border-green-400 pointer-events-none"
                    style={{ top: y * scale }}
                  />
                ))}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Legenda */}
      <div className="border-t bg-card p-2">
        <div className="flex items-center justify-center space-x-6 text-xs text-muted-foreground">
          <div className="flex items-center">
            <div className="w-3 h-3 border border-red-300 border-dashed mr-2" />
            Área de Sangria
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 border border-blue-300 border-dashed mr-2" />
            Área de Segurança
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 border-2 border-primary mr-2" />
            Selecionado
          </div>
        </div>
      </div>
    </div>
  )
}