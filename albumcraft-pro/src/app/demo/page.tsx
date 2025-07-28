'use client'

import React, { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  ArrowLeft, 
  Upload, 
  Image, 
  Layout, 
  Download, 
  Play,
  Pause,
  RotateCcw,
  Eye,
  Settings,
  Palette,
  Grid3X3,
  MousePointer2,
  Sparkles,
  Check,
  Star,
  Zap,
  Heart,
  Camera,
  Wand2,
  Layers,
  FileImage,
  Printer,
  Clock,
  Users,
  Award,
  FolderOpen,
  LogIn
} from 'lucide-react'

export default function DemoPage() {
  const [currentStep, setCurrentStep] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [progress, setProgress] = useState(0)
  const [hoveredFeature, setHoveredFeature] = useState<number | null>(null)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [showSuccess, setShowSuccess] = useState(false)
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // Simular movimento do mouse para efeitos visuais
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY })
    }
    window.addEventListener('mousemove', handleMouseMove)
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [])

  const demoSteps = [
    {
      id: 'upload',
      title: 'Upload Inteligente',
      description: 'Arraste suas fotos e veja a mágica acontecer',
      icon: Upload,
      color: 'from-blue-500 to-cyan-500',
      bgColor: 'bg-gradient-to-br from-blue-50 to-cyan-50',
      demo: 'Processando 24 fotos...',
      details: ['Detecção automática de faces', 'Organização por data', 'Análise de qualidade'],
      animation: 'upload'
    },
    {
      id: 'ai-organize',
      title: 'IA Organizadora',
      description: 'Inteligência artificial organiza suas memórias',
      icon: Sparkles,
      color: 'from-purple-500 to-pink-500',
      bgColor: 'bg-gradient-to-br from-purple-50 to-pink-50',
      demo: 'Criando grupos: Cerimônia, Festa, Família...',
      details: ['Reconhecimento facial', 'Agrupamento por evento', 'Sugestões inteligentes'],
      animation: 'organize'
    },
    {
      id: 'template',
      title: 'Templates Mágicos',
      description: 'Escolha entre centenas de designs profissionais',
      icon: Wand2,
      color: 'from-emerald-500 to-teal-500',
      bgColor: 'bg-gradient-to-br from-emerald-50 to-teal-50',
      demo: 'Template "Elegância Clássica" aplicado',
      details: ['100+ templates premium', 'Designs responsivos', 'Personalização total'],
      animation: 'template'
    },
    {
      id: 'customize',
      title: 'Personalização Pro',
      description: 'Cada detalhe sob seu controle',
      icon: Palette,
      color: 'from-orange-500 to-red-500',
      bgColor: 'bg-gradient-to-br from-orange-50 to-red-50',
      demo: 'Aplicando paleta dourada...',
      details: ['Cores personalizadas', 'Fontes exclusivas', 'Layouts flexíveis'],
      animation: 'customize'
    },
    {
      id: 'arrange',
      title: 'Arranjo Perfeito',
      description: 'Posicionamento preciso com drag & drop',
      icon: MousePointer2,
      color: 'from-indigo-500 to-purple-500',
      bgColor: 'bg-gradient-to-br from-indigo-50 to-purple-50',
      demo: 'Otimizando composição visual...',
      details: ['Drag & drop intuitivo', 'Guias de alinhamento', 'Redimensionamento automático'],
      animation: 'arrange'
    },
    {
      id: 'export',
      title: 'Exportação Premium',
      description: 'Qualidade profissional garantida',
      icon: Download,
      color: 'from-green-500 to-emerald-500',
      bgColor: 'bg-gradient-to-br from-green-50 to-emerald-50',
      demo: 'Gerando PDF em 300 DPI...',
      details: ['Alta resolução', 'Múltiplos formatos', 'Pronto para impressão'],
      animation: 'export'
    }
  ]

  const features = [
    {
      id: 'drag-drop',
      title: 'Drag & Drop Mágico',
      description: 'Interface intuitiva que entende suas intenções',
      icon: MousePointer2,
      color: 'from-blue-500 to-cyan-500',
      stats: '99% mais rápido',
      rating: 5
    },
    {
      id: 'ai-creative',
      title: 'IA Criativa',
      description: 'Inteligência artificial que cria layouts únicos',
      icon: Sparkles,
      color: 'from-purple-500 to-pink-500',
      stats: '1000+ combinações',
      rating: 5
    },
    {
      id: 'templates',
      title: 'Templates Premium',
      description: 'Designs criados por profissionais renomados',
      icon: Award,
      color: 'from-emerald-500 to-teal-500',
      stats: '150+ templates',
      rating: 5
    },
    {
      id: 'quality',
      title: 'Qualidade 4K',
      description: 'Exportação em ultra alta definição',
      icon: Printer,
      color: 'from-orange-500 to-red-500',
      stats: 'Até 300 DPI',
      rating: 5
    }
  ]

  const testimonials = [
    {
      id: 'maria',
      name: 'Maria Silva',
      role: 'Fotógrafa Profissional',
      comment: 'Revolucionou meu workflow! Economizo 5 horas por projeto.',
      rating: 5,
      avatar: '👩‍💼',
      projects: 150,
      timeSaved: '750h'
    },
    {
      id: 'joao',
      name: 'João Santos',
      role: 'Designer Gráfico',
      comment: 'A qualidade dos templates é impressionante. Clientes adoram!',
      rating: 5,
      avatar: '👨‍🎨',
      projects: 89,
      timeSaved: '445h'
    },
    {
      id: 'ana',
      name: 'Ana Costa',
      role: 'Proprietária de Estúdio',
      comment: 'ROI incrível! Triplicamos nossa produtividade.',
      rating: 5,
      avatar: '👩‍💻',
      projects: 320,
      timeSaved: '1600h'
    }
  ]

  const handlePlayDemo = () => {
    setIsPlaying(true)
    setCurrentStep(0)
    setProgress(0)
    setShowSuccess(false)
    
    intervalRef.current = setInterval(() => {
      setProgress(prev => {
        const newProgress = prev + 2
        if (newProgress >= 100) {
          setCurrentStep(current => {
            const nextStep = current + 1
            if (nextStep >= demoSteps.length) {
              setIsPlaying(false)
              setShowSuccess(true)
              if (intervalRef.current) clearInterval(intervalRef.current)
              return 0
            }
            return nextStep
          })
          return 0
        }
        return newProgress
      })
    }, 100)
  }

  const handleStopDemo = () => {
    setIsPlaying(false)
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
    setProgress(0)
    setCurrentStep(0)
  }

  const handleStepClick = (stepIndex: number) => {
    if (!isPlaying) {
      setCurrentStep(stepIndex)
      setProgress(0)
    }
  }

  // Simular upload progress
  useEffect(() => {
    if (isPlaying && currentStep === 0) {
      const uploadInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 100) {
            clearInterval(uploadInterval)
            return 100
          }
          return prev + 5
        })
      }, 150)
      return () => clearInterval(uploadInterval)
    } else {
      setUploadProgress(0)
    }
  }, [isPlaying, currentStep])

  const currentStepData = demoSteps[currentStep]

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div 
          className="absolute w-96 h-96 bg-gradient-to-r from-blue-400/20 to-purple-400/20 rounded-full blur-3xl animate-pulse"
          style={{
            left: mousePosition.x / 10,
            top: mousePosition.y / 10,
            transform: 'translate(-50%, -50%)'
          }}
        />
        <div className="absolute top-1/4 right-1/4 w-64 h-64 bg-gradient-to-r from-pink-400/20 to-orange-400/20 rounded-full blur-2xl animate-bounce" />
        <div className="absolute bottom-1/4 left-1/4 w-48 h-48 bg-gradient-to-r from-green-400/20 to-cyan-400/20 rounded-full blur-2xl animate-pulse" />
      </div>

      {/* Header */}
      <header className="relative z-10 border-b bg-white/80 backdrop-blur-xl sticky top-0 shadow-sm">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link href="/">
                <Button variant="ghost" size="sm" className="hover:bg-blue-50 transition-colors">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Voltar
                </Button>
              </Link>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  Demonstração Interativa
                </h1>
                <p className="text-sm text-muted-foreground">
                  Experimente o futuro da criação de álbuns
                </p>
              </div>

        {/* Interactive Demo Visualization */}
        <div className="max-w-6xl mx-auto mb-20">
          <Card className="overflow-hidden border-0 shadow-2xl bg-white/80 backdrop-blur-xl">
            <CardHeader className={`${currentStepData?.bgColor || 'bg-gradient-to-r from-blue-50 to-purple-50'} transition-all duration-1000`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  {currentStepData && (
                    <>
                      <div className={`p-4 rounded-2xl bg-gradient-to-r ${currentStepData.color} text-white shadow-lg transform ${isPlaying ? 'animate-pulse' : ''}`}>
                        {React.createElement(currentStepData.icon, { className: "h-8 w-8" })}
                      </div>
                      <div>
                        <CardTitle className="text-2xl font-bold text-gray-900">
                          Passo {currentStep + 1}: {currentStepData.title}
                        </CardTitle>
                        <CardDescription className="text-lg text-gray-600 mt-2">
                          {currentStepData.description}
                        </CardDescription>
                      </div>
                    </>
                  )}
                </div>
                <div className="flex items-center space-x-3">
                  <Badge variant="secondary" className="px-4 py-2 text-lg">
                    {currentStep + 1} de {demoSteps.length}
                  </Badge>
                  {showSuccess && (
                    <Badge className="px-4 py-2 text-lg bg-green-500 animate-bounce">
                      <Check className="h-4 w-4 mr-2" />
                      Concluído!
                    </Badge>
                  )}
                </div>
              </div>
              
              {/* Progress Bar */}
              <div className="mt-6">
                <div className="flex justify-between text-sm text-gray-600 mb-2">
                  <span>Progresso</span>
                  <span>{Math.round(progress)}%</span>
                </div>
                <div className="w-full bg-white/50 rounded-full h-3 overflow-hidden">
                  <div 
                    className={`h-full bg-gradient-to-r ${currentStepData?.color || 'from-blue-500 to-purple-500'} transition-all duration-300 ease-out`}
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="p-12">
              <div className="grid lg:grid-cols-2 gap-12 items-center">
                {/* Demo Visualization */}
                <div className="space-y-6">
                  <div className={`${currentStepData?.bgColor || 'bg-gray-50'} rounded-2xl p-8 min-h-[300px] flex flex-col justify-center items-center transition-all duration-1000 relative overflow-hidden`}>
                    {/* Animated Background Pattern */}
                    <div className="absolute inset-0 opacity-10">
                      <div className="absolute inset-0 bg-gradient-to-br from-blue-400 to-purple-400 animate-pulse" />
                      <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.8),transparent_50%)]" />
                    </div>
                    
                    <div className="relative z-10 text-center space-y-6">
                      {currentStepData && (
                        <>
                          <div className={`inline-flex p-6 rounded-full bg-gradient-to-r ${currentStepData.color} text-white shadow-xl transform ${isPlaying ? 'animate-bounce' : 'hover:scale-110'} transition-all duration-300`}>
                            {React.createElement(currentStepData.icon, { className: "h-12 w-12" })}
                          </div>
                          
                          <div className="space-y-3">
                            <p className="text-2xl font-bold text-gray-900">
                              {currentStepData.demo}
                            </p>
                            
                            {/* Upload Progress Simulation */}
                            {currentStep === 0 && isPlaying && (
                              <div className="space-y-2">
                                <div className="flex justify-between text-sm text-gray-600">
                                  <span>Analisando fotos...</span>
                                  <span>{uploadProgress}%</span>
                                </div>
                                <div className="w-full bg-white rounded-full h-2">
                                  <div 
                                    className="h-full bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full transition-all duration-300"
                                    style={{ width: `${uploadProgress}%` }}
                                  />
                                </div>
                              </div>
                            )}
                            
                            {/* Processing Animation */}
                            {isPlaying && (
                              <div className="flex items-center justify-center space-x-2 text-gray-600">
                                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
                                <span className="text-lg">Processando...</span>
                              </div>
                            )}
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                  
                  {/* Step Navigation */}
                  <div className="flex justify-center space-x-3">
                    {demoSteps.map((step, index) => (
                      <button
                        key={step.id}
                        onClick={() => handleStepClick(index)}
                        disabled={isPlaying}
                        className={`group relative w-4 h-4 rounded-full transition-all duration-300 ${
                          index === currentStep 
                            ? `bg-gradient-to-r ${currentStepData?.color || 'from-blue-500 to-purple-500'} scale-125 shadow-lg` 
                            : index < currentStep 
                              ? 'bg-green-400 hover:bg-green-500' 
                              : 'bg-gray-300 hover:bg-gray-400'
                        } ${!isPlaying ? 'hover:scale-110 cursor-pointer' : 'cursor-not-allowed'}`}
                      >
                        {index < currentStep && (
                          <Check className="h-3 w-3 text-white absolute top-0.5 left-0.5" />
                        )}
                        
                        {/* Tooltip */}
                        <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                          {step.title}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
                
                {/* Step Details */}
                <div className="space-y-6">
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-4">
                      O que acontece nesta etapa?
                    </h3>
                    <div className="space-y-3">
                      {currentStepData?.details.map((detail, index) => (
                        <div 
                          key={index} 
                          className={`flex items-center space-x-3 p-3 rounded-lg bg-white/60 border border-gray-200 transform transition-all duration-500 ${
                            isPlaying ? 'animate-pulse' : 'hover:shadow-md hover:scale-105'
                          }`}
                          style={{ animationDelay: `${index * 200}ms` }}
                        >
                          <div className={`p-2 rounded-full bg-gradient-to-r ${currentStepData?.color || 'from-blue-500 to-purple-500'} text-white`}>
                            <Check className="h-4 w-4" />
                          </div>
                          <span className="text-gray-700 font-medium">{detail}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  {/* Quick Stats for Current Step */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-4 bg-white/60 rounded-xl border border-gray-200">
                      <div className="text-2xl font-bold text-blue-600">
                        {currentStep === 0 ? '< 30s' : currentStep === 1 ? '95%' : currentStep === 2 ? '150+' : currentStep === 3 ? '∞' : currentStep === 4 ? '100%' : '300 DPI'}
                      </div>
                      <div className="text-sm text-gray-600">
                        {currentStep === 0 ? 'Tempo médio' : currentStep === 1 ? 'Precisão IA' : currentStep === 2 ? 'Templates' : currentStep === 3 ? 'Possibilidades' : currentStep === 4 ? 'Precisão' : 'Qualidade'}
                      </div>
                    </div>
                    <div className="text-center p-4 bg-white/60 rounded-xl border border-gray-200">
                      <div className="text-2xl font-bold text-purple-600">
                        {currentStep === 0 ? '24' : currentStep === 1 ? '6' : currentStep === 2 ? '1' : currentStep === 3 ? '12' : currentStep === 4 ? '0' : '1'}
                      </div>
                      <div className="text-sm text-gray-600">
                        {currentStep === 0 ? 'Fotos/lote' : currentStep === 1 ? 'Grupos criados' : currentStep === 2 ? 'Clique apenas' : currentStep === 3 ? 'Cores disponíveis' : currentStep === 4 ? 'Erros' : 'Arquivo final'}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Features Showcase */}
        <div className="max-w-6xl mx-auto mb-20">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Recursos Avançados
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Descubra todas as funcionalidades que fazem do AlbumCraft Pro a escolha ideal para seus projetos
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <Card 
                key={feature.id} 
                className={`group hover:shadow-2xl transition-all duration-500 border-0 bg-white/80 backdrop-blur-xl transform hover:scale-105 ${
                  hoveredFeature === feature.id ? 'shadow-2xl scale-105' : ''
                }`}
                onMouseEnter={() => setHoveredFeature(feature.id)}
                onMouseLeave={() => setHoveredFeature(null)}
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <CardContent className="p-8 text-center">
                  <div className={`inline-flex p-4 rounded-2xl bg-gradient-to-r ${feature.color} text-white mb-6 group-hover:animate-bounce transition-all duration-300`}>
                    {React.createElement(feature.icon, { className: "h-8 w-8" })}
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600 leading-relaxed">
                    {feature.description}
                  </p>
                  
                  {/* Feature Stats */}
                  <div className="mt-6 pt-6 border-t border-gray-200">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-500">Eficiência</span>
                      <div className="flex space-x-1">
                        {[...Array(5)].map((_, i) => (
                          <Star 
                            key={i} 
                            className={`h-4 w-4 ${i < feature.rating ? 'text-yellow-400 fill-current' : 'text-gray-300'}`} 
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Testimonials */}
        <div className="max-w-6xl mx-auto mb-20">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              O que nossos usuários dizem
            </h2>
            <p className="text-xl text-gray-600">
              Experiências reais de quem já transformou suas fotos em álbuns incríveis
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <Card 
                key={testimonial.id} 
                className="border-0 bg-white/80 backdrop-blur-xl hover:shadow-xl transition-all duration-500 transform hover:scale-105"
                style={{ animationDelay: `${index * 200}ms` }}
              >
                <CardContent className="p-8">
                  <div className="flex items-center mb-6">
                    <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold text-lg">
                      {testimonial.name.charAt(0)}
                    </div>
                    <div className="ml-4">
                      <h4 className="font-bold text-gray-900">{testimonial.name}</h4>
                      <p className="text-sm text-gray-600">{testimonial.role}</p>
                    </div>
                  </div>
                  
                  <div className="flex mb-4">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="h-5 w-5 text-yellow-400 fill-current" />
                    ))}
                  </div>
                  
                  <p className="text-gray-700 italic leading-relaxed">
                    "{testimonial.comment}"
                  </p>
                  
                  <div className="mt-6 pt-6 border-t border-gray-200">
                    <div className="flex justify-between text-sm text-gray-500">
                      <span>Projetos criados: {testimonial.projects}</span>
                      <span>Tempo economizado: {testimonial.timeSaved}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Call to Action */}
        <div className="max-w-4xl mx-auto text-center mb-20">
          <Card className="border-0 bg-gradient-to-r from-blue-600 to-purple-600 text-white overflow-hidden relative">
            <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="none" fill-rule="evenodd"%3E%3Cg fill="%23ffffff" fill-opacity="0.1"%3E%3Ccircle cx="30" cy="30" r="4"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] opacity-20"></div>
            <CardContent className="p-12 relative z-10">
              <h2 className="text-4xl font-bold mb-6">
                Pronto para criar seu primeiro álbum?
              </h2>
              <p className="text-xl mb-8 opacity-90">
                Junte-se a milhares de usuários que já transformaram suas memórias em álbuns profissionais
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                <Button 
                  size="lg" 
                  className="bg-white text-blue-600 hover:bg-gray-100 px-8 py-4 text-lg font-semibold transform hover:scale-105 transition-all duration-300 shadow-xl"
                  onClick={() => window.location.href = '/register'}
                >
                  <Sparkles className="mr-2 h-5 w-5" />
                  Começar Gratuitamente
                </Button>
                <Button 
                  size="lg" 
                  variant="outline" 
                  className="border-white text-white hover:bg-white hover:text-blue-600 px-8 py-4 text-lg font-semibold transform hover:scale-105 transition-all duration-300"
                  onClick={() => window.location.href = '/login'}
                >
                  <LogIn className="mr-2 h-5 w-5" />
                  Fazer Login
                </Button>
              </div>
              
              <div className="mt-8 flex justify-center items-center space-x-8 text-sm opacity-80">
                <div className="flex items-center">
                  <Check className="h-4 w-4 mr-2" />
                  Sem cartão de crédito
                </div>
                <div className="flex items-center">
                  <Check className="h-4 w-4 mr-2" />
                  Teste grátis por 14 dias
                </div>
                <div className="flex items-center">
                  <Check className="h-4 w-4 mr-2" />
                  Suporte 24/7
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
            </div>
            <div className="flex items-center space-x-2">
              <Link href="/auth/register">
                <Button variant="outline" className="hover:bg-blue-50 transition-colors">
                  Criar Conta
                </Button>
              </Link>
              <Link href="/auth/login">
                <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 transition-all">
                  Fazer Login
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="relative z-10 container mx-auto px-6 py-12" ref={containerRef}>
        {/* Hero Section */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-blue-100 to-purple-100 rounded-full text-sm font-medium text-blue-700 mb-6 animate-pulse">
            <Sparkles className="h-4 w-4 mr-2" />
            Powered by AI • Trusted by 10,000+ professionals
          </div>
          
          <h2 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-gray-900 via-blue-800 to-purple-800 bg-clip-text text-transparent">
            Veja a Magia
            <br />
            <span className="text-transparent bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text">
              Acontecer
            </span>
          </h2>
          
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto leading-relaxed">
            Transforme suas fotos em álbuns profissionais com o poder da inteligência artificial. 
            Cada clique é uma experiência única.
          </p>
          
          <div className="flex items-center justify-center space-x-6 mb-8">
            {!isPlaying ? (
              <Button 
                onClick={handlePlayDemo} 
                size="lg" 
                className="px-12 py-4 text-lg bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 transform hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-xl"
              >
                <Play className="h-6 w-6 mr-3" />
                Iniciar Experiência
              </Button>
            ) : (
              <Button 
                onClick={handleStopDemo} 
                size="lg" 
                variant="outline" 
                className="px-12 py-4 text-lg border-2 hover:bg-red-50 hover:border-red-300 transition-all duration-300"
              >
                <Pause className="h-6 w-6 mr-3" />
                Pausar Demo
              </Button>
            )}
            
            <Button 
              onClick={() => setCurrentStep(0)} 
              variant="ghost" 
              size="lg"
              className="px-8 py-4 text-lg hover:bg-gray-100 transition-all duration-300"
            >
              <RotateCcw className="h-6 w-6 mr-3" />
              Reiniciar
            </Button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-2xl mx-auto">
            {[
              { label: 'Projetos Criados', value: '50,000+', icon: FolderOpen },
              { label: 'Tempo Economizado', value: '2M+ horas', icon: Clock },
              { label: 'Usuários Ativos', value: '10,000+', icon: Users },
              { label: 'Satisfação', value: '99%', icon: Heart }
            ].map((stat, index) => (
              <div key={index} className="text-center p-4 rounded-xl bg-white/60 backdrop-blur-sm border border-white/20 hover:bg-white/80 transition-all duration-300">
                <stat.icon className="h-6 w-6 mx-auto mb-2 text-blue-600" />
                <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
                <div className="text-sm text-gray-600">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Demo Visualization */}
        <div className="max-w-4xl mx-auto mb-16">
          <Card className="overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-primary/10 to-primary/5">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center">
                    {demoSteps[currentStep] && (
                      <>
                        <div className={`p-2 rounded-lg ${demoSteps[currentStep].color} text-white mr-3`}>
                          {React.createElement(demoSteps[currentStep].icon, { className: "h-5 w-5" })}
                        </div>
                        Passo {currentStep + 1}: {demoSteps[currentStep].title}
                      </>
                    )}
                  </CardTitle>
                  <CardDescription className="mt-2">
                    {demoSteps[currentStep]?.description}
                  </CardDescription>
                </div>
                <Badge variant="secondary">
                  {currentStep + 1} de {demoSteps.length}
                </Badge>
              </div>
            </CardHeader>
            
            <CardContent className="p-8">
              <div className="bg-slate-50 rounded-lg p-8 text-center min-h-[200px] flex items-center justify-center">
                <div className="space-y-4">
                  {demoSteps[currentStep] && (
                    <>
                      <div className={`inline-flex p-4 rounded-full ${demoSteps[currentStep].color} text-white`}>
                        {React.createElement(demoSteps[currentStep].icon, { className: "h-8 w-8" })}
                      </div>
                      <p className="text-lg font-medium">
                        {demoSteps[currentStep].demo}
                      </p>
                      {isPlaying && (
                        <div className="flex items-center justify-center space-x-2 text-sm text-muted-foreground">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                          <span>Processando...</span>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Progress Steps */}
          <div className="mt-8 flex justify-center">
            <div className="flex space-x-2">
              {demoSteps.map((step, index) => (
                <button
                  key={step.id}
                  onClick={() => setCurrentStep(index)}
                  className={`w-3 h-3 rounded-full transition-all ${
                    index === currentStep 
                      ? 'bg-primary scale-125' 
                      : index < currentStep 
                        ? 'bg-primary/60' 
                        : 'bg-gray-300'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Features Grid */}
        <section className="mb-16">
          <div className="text-center mb-12">
            <h3 className="text-2xl font-bold mb-4">
              Principais Funcionalidades
            </h3>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Descubra todas as ferramentas que fazem do AlbumCraft Pro 
              a escolha ideal para profissionais.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {features.map((feature, index) => (
              <Card key={index} className="text-center hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="inline-flex p-3 rounded-full bg-primary/10 text-primary mb-4">
                    <feature.icon className="h-6 w-6" />
                  </div>
                  <h4 className="font-semibold mb-2">{feature.title}</h4>
                  <p className="text-sm text-muted-foreground">
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* CTA Section */}
        <section className="text-center bg-gradient-to-r from-primary/10 to-primary/5 rounded-2xl p-12">
          <h3 className="text-2xl font-bold mb-4">
            Pronto para Criar Seus Álbuns?
          </h3>
          <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
            Comece gratuitamente e descubra como o AlbumCraft Pro pode 
            transformar suas fotos em álbuns profissionais.
          </p>
          
          <div className="flex items-center justify-center space-x-4">
            <Link href="/auth/register">
              <Button size="lg" className="px-8">
                Começar Grátis
              </Button>
            </Link>
            <Link href="/auth/login">
              <Button variant="outline" size="lg" className="px-8">
                <Eye className="h-5 w-5 mr-2" />
                Ver Mais Exemplos
              </Button>
            </Link>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t bg-white/80 backdrop-blur-sm mt-16">
        <div className="container mx-auto px-6 py-8">
          <div className="text-center">
            <p className="text-sm text-muted-foreground">
              © 2024 AlbumCraft Pro. Todos os direitos reservados.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}