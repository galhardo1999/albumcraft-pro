'use client'

import DiagramadorWorkspace from '@/components/diagramador/DiagramadorWorkspace'
import { sampleProject } from '@/data/sampleData'

export default function DiagramadorTestPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header simples */}
      <header className="border-b bg-card">
        <div className="flex items-center justify-between px-6 py-4">
          <div>
            <h1 className="text-xl font-semibold">{sampleProject.name}</h1>
            <p className="text-sm text-muted-foreground">
              {sampleProject.description} - Teste do Diagramador
            </p>
          </div>
          
          <div className="flex items-center space-x-2">
            <button className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors">
              Exportar
            </button>
          </div>
        </div>
      </header>

      {/* Diagramador Workspace */}
      <DiagramadorWorkspace project={sampleProject} />
    </div>
  )
}