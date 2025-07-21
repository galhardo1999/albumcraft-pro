import { processAlbumSynchronously, type AlbumCreationJobData } from './queue'

// Interface para jobs
interface WorkerJob {
  id: string
  data: AlbumCreationJobData
  attempts: number
  maxAttempts: number
}

// Worker simples para processamento em background
class SimpleWorker {
  private isRunning = false
  private jobs: WorkerJob[] = []

  async start() {
    if (this.isRunning) {
      console.log('⚠️ Worker já está rodando')
      return
    }

    this.isRunning = true
    console.log('🚀 Worker iniciado')

    // Loop principal do worker
    while (this.isRunning) {
      try {
        await this.processNextJob()
        // Aguardar um pouco antes de verificar novamente
        await new Promise(resolve => setTimeout(resolve, 1000))
      } catch (error) {
        console.error('❌ Erro no worker:', error)
        await new Promise(resolve => setTimeout(resolve, 5000)) // Aguardar mais tempo em caso de erro
      }
    }
  }

  async stop() {
    console.log('🛑 Parando worker...')
    this.isRunning = false
  }

  private async processNextJob() {
    if (this.jobs.length === 0) return

    const job = this.jobs.shift()
    if (!job) return

    console.log(`🔄 Processando job: ${job.id}`)

    try {
      await processAlbumSynchronously(job.data)
      console.log(`✅ Job ${job.id} processado com sucesso`)
    } catch (error) {
      console.error(`❌ Erro ao processar job ${job.id}:`, error)
      
      job.attempts++
      if (job.attempts < job.maxAttempts) {
        // Recolocar na fila para retry
        this.jobs.push(job)
        console.log(`🔄 Job ${job.id} recolocado na fila (tentativa ${job.attempts}/${job.maxAttempts})`)
      } else {
        console.log(`❌ Job ${job.id} falhou após ${job.maxAttempts} tentativas`)
      }
    }
  }

  addJob(data: AlbumCreationJobData): string {
    const job: WorkerJob = {
      id: `worker_job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      data,
      attempts: 0,
      maxAttempts: 3
    }

    this.jobs.push(job)
    console.log(`📋 Job ${job.id} adicionado ao worker`)
    return job.id
  }

  getStats() {
    return {
      isRunning: this.isRunning,
      queueLength: this.jobs.length
    }
  }
}

// Instância global do worker
export const albumWorker = new SimpleWorker()

// Função para iniciar o worker (chamada automaticamente)
export const startWorker = async () => {
  try {
    await albumWorker.start()
  } catch (error) {
    console.error('❌ Erro ao iniciar worker:', error)
  }
}

// Função para parar o worker
export const stopWorker = async () => {
  await albumWorker.stop()
}

// Função para adicionar job ao worker
export const addJobToWorker = (data: AlbumCreationJobData): string => {
  return albumWorker.addJob(data)
}

// Iniciar worker automaticamente no servidor
if (typeof window === 'undefined') {
  // Iniciar worker após um pequeno delay
  setTimeout(() => {
    startWorker().catch(console.error)
  }, 1000)
}