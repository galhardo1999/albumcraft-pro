'use client'

import { useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

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

interface SpreadTimelineProps {
  spreads: Spread[]
  currentSpreadIndex: number
  onSpreadSelect: (index: number) => void
  onSpreadAdd: () => void
  onSpreadRemove: (index: number) => void
  onSpreadReorder: (startIndex: number, endIndex: number) => void
}

export default function SpreadTimeline({
  spreads,
  currentSpreadIndex,
  onSpreadSelect,
  onSpreadAdd,
  onSpreadRemove,
  onSpreadReorder
}: SpreadTimelineProps) {
  const scrollRef = useRef<HTMLDivElement>(null)

  // Gerar thumbnail de uma página
  const generatePageThumbnail = (page: Page) => {
    // Simular thumbnail baseado nos elementos da página
    const elementCount = page.elements.length

    if (elementCount === 0) {
      return (
        <div 
          className="w-full h-full flex items-center justify-center text-xs text-muted-foreground"
          style={{ backgroundColor: page.backgroundColor }}
        >
          Vazio
        </div>
      )
    }

    return (
      <div 
        className="w-full h-full relative overflow-hidden"
        style={{ 
          backgroundColor: page.backgroundColor,
          backgroundImage: page.backgroundImage ? `url(${page.backgroundImage})` : undefined,
          backgroundSize: 'cover',
          backgroundPosition: 'center'
        }}
      >
        {/* Simular elementos como pequenos retângulos */}
        {page.elements.slice(0, 6).map((element) => (
          <div
            key={element.id}
            className={`absolute rounded-sm ${
              element.type === 'photo' 
                ? 'bg-blue-300 border border-blue-400' 
                : 'bg-gray-300 border border-gray-400'
            }`}
            style={{
              left: `${(element.x / 500) * 100}%`,
              top: `${(element.y / 350) * 100}%`,
              width: `${Math.min((element.width / 500) * 100, 30)}%`,
              height: `${Math.min((element.height / 350) * 100, 30)}%`,
              opacity: element.opacity
            }}
          />
        ))}
        
        {/* Indicador de mais elementos */}
        {page.elements.length > 6 && (
          <div className="absolute bottom-0 right-0 bg-black/50 text-white text-xs px-1 rounded-tl">
            +{page.elements.length - 6}
          </div>
        )}
      </div>
    )
  }

  // Handlers para drag and drop
  const handleDragStart = (e: React.DragEvent, index: number) => {
    e.dataTransfer.setData('text/plain', index.toString())
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault()
    const dragIndex = parseInt(e.dataTransfer.getData('text/plain'))
    if (dragIndex !== dropIndex) {
      onSpreadReorder(dragIndex, dropIndex)
    }
  }

  // Renderizar thumbnail de um spread
  const renderSpreadThumbnail = (spread: Spread, index: number) => {
    const isSelected = index === currentSpreadIndex
    
    return (
      <Card 
        className={`
          relative cursor-pointer transition-all duration-200 hover:shadow-md
          ${isSelected 
            ? 'ring-2 ring-primary shadow-lg' 
            : 'hover:ring-1 hover:ring-muted-foreground/30'
          }
        `}
        draggable
        onDragStart={(e) => handleDragStart(e, index)}
        onDragOver={handleDragOver}
        onDrop={(e) => handleDrop(e, index)}
        onClick={() => onSpreadSelect(index)}
      >
        <div className="p-2">
          {/* Número da lâmina */}
          <div className="text-xs text-center text-muted-foreground mb-2 font-medium">
            Lâmina {index + 1}
          </div>
          
          {/* Páginas lado a lado */}
          <div className="flex space-x-1">
            {/* Página Esquerda */}
            <div className="w-16 h-12 border border-muted-foreground/20 rounded-sm overflow-hidden">
              {generatePageThumbnail(spread.leftPage)}
            </div>
            
            {/* Página Direita */}
            <div className="w-16 h-12 border border-muted-foreground/20 rounded-sm overflow-hidden">
              {generatePageThumbnail(spread.rightPage)}
            </div>
          </div>
          
          {/* Estatísticas */}
          <div className="mt-2 text-xs text-muted-foreground text-center">
            {spread.leftPage.elements.length + spread.rightPage.elements.length} elementos
          </div>
        </div>
        
        {/* Botão de remover */}
        {spreads.length > 1 && (
          <Button
            variant="destructive"
            size="sm"
            className="absolute -top-2 -right-2 w-6 h-6 p-0 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={(e) => {
              e.stopPropagation()
              onSpreadRemove(index)
            }}
          >
            ×
          </Button>
        )}
      </Card>
    )
  }

  // Scroll para o spread atual
  const scrollToCurrentSpread = () => {
    if (scrollRef.current) {
      const spreadWidth = 150 // Largura aproximada de cada spread
      const scrollPosition = currentSpreadIndex * spreadWidth - scrollRef.current.clientWidth / 2
      scrollRef.current.scrollTo({
        left: Math.max(0, scrollPosition),
        behavior: 'smooth'
      })
    }
  }

  return (
    <div className="border-t bg-card">
      {/* Cabeçalho */}
      <div className="flex items-center justify-between p-3 border-b">
        <div className="flex items-center space-x-3">
          <h3 className="font-medium">Timeline das Lâminas</h3>
          <span className="text-xs text-muted-foreground bg-accent px-2 py-1 rounded">
            {spreads.length} lâmina{spreads.length !== 1 ? 's' : ''}
          </span>
        </div>
        
        <div className="flex items-center space-x-4">
          {/* Navegação rápida */}
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onSpreadSelect(Math.max(0, currentSpreadIndex - 1))}
              disabled={currentSpreadIndex === 0}
              className="text-xs"
            >
              ← Anterior
            </Button>
            
            <div className="text-xs text-muted-foreground px-2">
              {currentSpreadIndex + 1} de {spreads.length}
            </div>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onSpreadSelect(Math.min(spreads.length - 1, currentSpreadIndex + 1))}
              disabled={currentSpreadIndex === spreads.length - 1}
              className="text-xs"
            >
              Próxima →
            </Button>
          </div>
          
          <div className="flex items-center space-x-2">
            <Button
              onClick={onSpreadAdd}
              size="sm"
              className="text-xs transition-colors"
              title="Adicionar nova lâmina (Ctrl + N)"
            >
              + Adicionar Lâmina
            </Button>
          </div>
        </div>
      </div>

      {/* Timeline */}
      <div 
        ref={scrollRef}
        className="flex items-center space-x-3 p-4 overflow-x-auto scrollbar-thin scrollbar-thumb-muted scrollbar-track-transparent"
        style={{ minHeight: '120px' }}
      >
        <div className="flex space-x-3">
          {spreads.map((spread, index) => (
            <div
              key={spread.id}
              className="group transition-transform hover:scale-105"
              style={{ minWidth: '140px' }}
            >
              {renderSpreadThumbnail(spread, index)}
            </div>
          ))}
        </div>
        
        {/* Botão de adicionar no final */}
        <Card 
          className="flex-shrink-0 cursor-pointer border-dashed border-2 hover:border-primary/50 transition-colors"
          onClick={onSpreadAdd}
        >
          <div className="w-32 h-20 flex flex-col items-center justify-center text-muted-foreground hover:text-primary transition-colors">
            <div className="text-2xl mb-1">+</div>
            <div className="text-xs">Nova Lâmina</div>
          </div>
        </Card>
      </div>
    </div>
  )
}