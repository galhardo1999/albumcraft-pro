import os from 'os'

// Configurações dinâmicas baseadas no sistema
export class PerformanceConfig {
  private static instance: PerformanceConfig
  
  public readonly albumConcurrency: number
  public readonly photosConcurrency: number
  public readonly sharpConcurrency: number
  public readonly maxMemoryUsage: number
  
  private constructor() {
    const cpuCount = os.cpus().length
    const totalMemory = os.totalmem()
    const freeMemory = os.freemem()
    
    // Calcular concorrência baseada no sistema
    this.albumConcurrency = Math.min(Math.max(Math.floor(cpuCount / 2), 2), 4)
    this.photosConcurrency = Math.min(Math.max(Math.floor(cpuCount * 0.75), 3), 8)
    this.sharpConcurrency = Math.min(Math.max(Math.floor(cpuCount / 2), 2), 6)
    
    // Calcular uso máximo de memória (70% da memória livre)
    this.maxMemoryUsage = Math.floor(freeMemory * 0.7)
    
    console.log('🚀 Configurações de Performance:')
    console.log(`   - CPUs: ${cpuCount}`)
    console.log(`   - Memória Total: ${(totalMemory / 1024 / 1024 / 1024).toFixed(1)}GB`)
    console.log(`   - Memória Livre: ${(freeMemory / 1024 / 1024 / 1024).toFixed(1)}GB`)
    console.log(`   - Concorrência Álbuns: ${this.albumConcurrency}`)
    console.log(`   - Concorrência Fotos: ${this.photosConcurrency}`)
    console.log(`   - Concorrência Sharp: ${this.sharpConcurrency}`)
  }
  
  public static getInstance(): PerformanceConfig {
    if (!PerformanceConfig.instance) {
      PerformanceConfig.instance = new PerformanceConfig()
    }
    return PerformanceConfig.instance
  }
  
  // Verificar se há memória suficiente para processar
  public hasEnoughMemory(estimatedUsage: number): boolean {
    const currentUsage = process.memoryUsage().heapUsed
    return (currentUsage + estimatedUsage) < this.maxMemoryUsage
  }
  
  // Obter configurações otimizadas para Sharp
  public getSharpConfig() {
    return {
      concurrency: this.sharpConcurrency,
      cache: {
        memory: Math.floor(this.maxMemoryUsage / 1024 / 1024 / 20), // 5% da memória máxima
        files: 20,
        items: 100
      }
    }
  }
}

export const performanceConfig = PerformanceConfig.getInstance()