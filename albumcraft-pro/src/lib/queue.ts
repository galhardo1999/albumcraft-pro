// Interface para dados do job de criação de álbum
export interface AlbumCreationJobData {
  userId: string
  eventName: string
  albumName: string
  files: Array<{
    name: string
    size: number
    type: string
    buffer: Buffer
  }>
  sessionId: string
}

// Interface para estatísticas da fila
export interface QueueStats {
  waiting: number
  active: number
  completed: number
  failed: number
}

// Interface para jobs da fila
interface AlbumJob {
  id: string;
  data: AlbumCreationJobData;
  priority: number;
  status: 'waiting' | 'processing' | 'completed' | 'failed';
  createdAt: Date;
  attempts: number;
  maxAttempts: number;
}

import { performanceConfig } from './performance-config'

// Fila em memória para processamento de álbuns
class InMemoryQueue {
  private queue: AlbumJob[] = [];
  private processing = new Map<string, AlbumJob>();
  private completed: AlbumJob[] = [];
  private failed: AlbumJob[] = [];
  private maxConcurrency = performanceConfig.albumConcurrency; // Configuração dinâmica
  private photosConcurrency = performanceConfig.photosConcurrency; // Configuração dinâmica

  async add(jobData: AlbumCreationJobData, priority: number = 0): Promise<{ id: string; status: string }> {
    const job: AlbumJob = {
      id: `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      data: jobData,
      priority,
      status: 'waiting',
      createdAt: new Date(),
      attempts: 0,
      maxAttempts: 3,
    };

    this.queue.push(job);
    // Ordenar por prioridade (maior prioridade primeiro)
    this.queue.sort((a, b) => b.priority - a.priority);
    
    console.log(`📋 Job ${job.id} adicionado à fila`);
    
    // Processar jobs automaticamente
    this.processJobs().catch(console.error);
    
    return { id: job.id, status: 'queued' };
  }

  private isProcessing = false;

  private async processJobs(): Promise<void> {
    // Verificar se podemos processar mais jobs
    while (this.processing.size < this.maxConcurrency && this.queue.length > 0) {
      const job = this.queue.shift();
      if (!job) break;

      // Processar job em paralelo
      this.processJob(job).catch(console.error);
    }
  }

  private async processJob(job: AlbumJob): Promise<void> {
    try {
      // Marcar como processando
      job.status = 'processing';
      this.processing.set(job.id, job);
      
      console.log(`🔄 Processando job: ${job.id} - Álbum: ${job.data.albumName} (${this.processing.size}/${this.maxConcurrency})`);
      
      await this.processAlbum(job.data);
      
      // Marcar como concluído
      job.status = 'completed';
      this.processing.delete(job.id);
      this.completed.push(job);
      
      console.log(`✅ Job ${job.id} processado com sucesso`);
      
    } catch (error) {
      console.error(`❌ Erro ao processar job ${job.id}:`, error);
      
      job.attempts++;
      this.processing.delete(job.id);
      
      if (job.attempts < job.maxAttempts) {
        // Recolocar na fila para retry
        job.status = 'waiting';
        this.queue.unshift(job);
        console.log(`🔄 Job ${job.id} recolocado na fila (tentativa ${job.attempts}/${job.maxAttempts})`);
      } else {
        // Marcar como falhou
        job.status = 'failed';
        this.failed.push(job);
        console.log(`❌ Job ${job.id} falhou após ${job.maxAttempts} tentativas`);
      }
    } finally {
      // Processar próximos jobs se houver
      if (this.queue.length > 0) {
        setTimeout(() => this.processJobs(), 100);
      }
    }
  }

  private async processAlbum(data: AlbumCreationJobData): Promise<void> {
    const { userId, eventName, albumName, files, sessionId } = data;

    console.log(`\n🎯 Iniciando processamento do álbum: ${albumName}`)
    console.log(`📁 Total de arquivos: ${files.length}`)
    console.log(`🔗 Session ID: ${sessionId}`)
    console.log(`⚡ Concorrência: ${this.photosConcurrency} fotos simultâneas`)

    try {
      // Importar dependências necessárias
      const { prisma } = await import('./prisma');

      // 1. Criar o projeto/álbum no banco de dados PRIMEIRO (igual ao sistema individual)
      console.log('Criando álbum no banco de dados...');
      
      const album = await prisma.album.create({
        data: {
          userId,
          name: albumName,
          description: `Álbum criado automaticamente para o evento: ${eventName}`,
          albumSize: 'MEDIUM', // Usar enum válido
          status: 'DRAFT', // Começar como DRAFT igual ao sistema individual
          creationType: 'BATCH', // Usar enum válido
          group: eventName, // Nome do grupo/evento
          eventName: eventName, // Campo específico para nome do evento
        }
      });

      console.log(`✅ Álbum criado: ${album.id} - ${albumName}`);

      // 2. Processar fotos em paralelo usando a mesma lógica do sistema individual
      const { uploadToS3, generateS3Key, generateThumbnailKey, isS3Configured } = await import('./s3');
      const { processImage, createThumbnail, getImageMetadata, isValidImageFormat, isValidFileSize, sanitizeFileName } = await import('./image-processing');
      
      const totalFiles = files.length;

      console.log(`🚀 Processando ${totalFiles} fotos em paralelo (concorrência: ${this.photosConcurrency})`);

      type IncomingFile = {
        name: string
        size: number
        type: string
        buffer: Buffer
      }

      // Função para processar uma única foto
      const processPhoto = async (file: IncomingFile, index: number) => {
        try {
          // Verificar memória disponível
          const estimatedMemoryUsage = file.buffer.length * 3 // Estimativa: 3x o tamanho do arquivo
          if (!performanceConfig.hasEnoughMemory(estimatedMemoryUsage)) {
            console.warn('⚠️ Memória insuficiente, aguardando...')
            await new Promise(resolve => setTimeout(resolve, 1000)) // Aguardar 1 segundo
          }

          console.log(`\n--- Processando arquivo ${index + 1}/${totalFiles}: ${file.name} ---`);
          console.log(`📋 Tipo: ${file.type}, Tamanho: ${file.buffer.length} bytes`);
          
          // Validar tipo de arquivo
          if (!isValidImageFormat(file.type)) {
            console.log(`❌ Formato não suportado: ${file.type}`);
            return { error: `${file.name}: Formato não suportado` } as const;
          }

          // Validar tamanho do arquivo
          if (!isValidFileSize(file.buffer.length)) {
            console.log(`❌ Arquivo muito grande: ${file.buffer.length} bytes`);
            return { error: `${file.name}: Arquivo muito grande (máximo 50MB)` } as const;
          }

          console.log(`✅ Validações passaram, processando imagem...`);
          
          // Obter metadados originais
          const originalMetadata = await getImageMetadata(file.buffer);
          console.log(`✅ Metadados obtidos: ${originalMetadata.width}x${originalMetadata.height}`);
          
          // Sanitizar nome do arquivo
          const sanitizedFileName = sanitizeFileName(file.name);
          console.log(`🧹 Nome sanitizado: ${sanitizedFileName}`);

          let originalUrl: string;
          let s3Key: string | null = null;

          if (isS3Configured()) {
            // UPLOAD PARA S3
            console.log(`☁️ Fazendo upload para S3: ${file.name}`);
            
            // Processar versões necessárias
            const [processedImage, thumbnail, mediumImage] = await Promise.all([
              processImage(file.buffer, { format: 'jpeg', quality: 85 }),
              createThumbnail(file.buffer),
              processImage(file.buffer, { maxWidth: 800, maxHeight: 800, format: 'jpeg', quality: 80 })
            ]);
            
            // Gerar chaves S3
            const originalKey = generateS3Key(userId, sanitizedFileName, album.id);
            const thumbnailKey = generateThumbnailKey(originalKey);
            const mediumKey = originalKey.replace(/(\.[^.]+)$/, '_medium$1');
            s3Key = originalKey;
            
            // Upload para S3 em paralelo
            const [originalUpload] = await Promise.all([
              uploadToS3(processedImage.buffer, originalKey, processedImage.contentType),
              uploadToS3(thumbnail.buffer, thumbnailKey, thumbnail.contentType),
              uploadToS3(mediumImage.buffer, mediumKey, mediumImage.contentType)
            ]);
            
            originalUrl = originalUpload;
            
            console.log(`✅ Upload S3 concluído: ${file.name}`);
            
          } else {
            // FALLBACK BASE64
            console.log(`💾 S3 não configurado, usando Base64: ${file.name}`);
            
            const [processedImage] = await Promise.all([
              processImage(file.buffer, { maxWidth: 1200, maxHeight: 1200, format: 'jpeg', quality: 80 })
            ]);
            
            originalUrl = `data:${processedImage.contentType};base64,${processedImage.buffer.toString('base64')}`;
          }

          // SALVAR FOTO NO BANCO DE DADOS
          const photo = await prisma.photo.create({
            data: {
              userId,
              albumId: album.id,
              filename: sanitizedFileName,
              originalName: file.name,
              mimeType: file.type,
              size: originalMetadata.size,
              width: originalMetadata.width,
              height: originalMetadata.height,
              s3Key: s3Key || '',
              s3Url: originalUrl,
            }
          });

          console.log(`✅ Foto salva no banco: ${photo.id} - ${file.name}`);
          return { success: true as const, photo };

        } catch (fileError) {
          const message = fileError instanceof Error ? fileError.message : 'Erro desconhecido'
          console.error(`❌ Erro ao processar arquivo ${file.name}:`, fileError);
          return { error: `Erro na foto ${file.name}: ${message}` } as const;
        }
      };

      // Processar fotos em lotes paralelos
      const results: Array<{ success: true; photo: unknown } | { error: string }> = [];
      for (let i = 0; i < files.length; i += this.photosConcurrency) {
        const batch = files.slice(i, i + this.photosConcurrency);
        const batchPromises = batch.map((file, batchIndex) => 
          processPhoto(file as IncomingFile, i + batchIndex)
        );
        const batchResults = await Promise.all(batchPromises);
        results.push(...batchResults);
      }

      const failed = results.filter(r => 'error' in r);
      if (failed.length) {
        console.warn(`⚠️ ${failed.length} fotos falharam no processamento.`);
      }

    } catch (err) {
      console.error('Erro no processamento do álbum:', err);
      throw err;
    }
  }

  async getStats(): Promise<QueueStats> {
    return {
      waiting: this.queue.length,
      active: this.processing.size,
      completed: this.completed.length,
      failed: this.failed.length,
    }
  }

  async getStatsBySession(sessionId: string): Promise<QueueStats & { totalJobs: number }> {
    const relatedJobs = [
      ...this.queue,
      ...Array.from(this.processing.values()),
      ...this.completed,
      ...this.failed,
    ].filter(job => job.data.sessionId === sessionId)

    return {
      waiting: relatedJobs.filter(j => j.status === 'waiting').length,
      active: relatedJobs.filter(j => j.status === 'processing').length,
      completed: relatedJobs.filter(j => j.status === 'completed').length,
      failed: relatedJobs.filter(j => j.status === 'failed').length,
      totalJobs: relatedJobs.length,
    }
  }

  cleanup(): void {
    this.queue = []
    this.processing.clear()
    this.completed = []
    this.failed = []
  }
}

const albumQueue = new InMemoryQueue();

export const addAlbumCreationJob = async (
  data: AlbumCreationJobData,
  priority: number = 0
): Promise<{ id: string; status: string } | null> => {
  try {
    return await albumQueue.add(data, priority)
  } catch (error) {
    console.error('Erro ao adicionar job à fila:', error)
    return null
  }
}

export const processAlbumSynchronously = async (data: AlbumCreationJobData) => {
  try {
    // Processar diretamente sem fila
    // @ts-expect-error Acesso ao método privado apenas para processamento síncrono controlado
    await albumQueue.processAlbum(data)
    return { status: 'completed' as const }
  } catch (error) {
    console.error('Erro no processamento síncrono:', error)
    return { status: 'failed' as const, error }
  }
}

export const getQueueStats = async (): Promise<QueueStats> => {
  return albumQueue.getStats()
}

export const getQueueStatsBySession = async (sessionId: string): Promise<QueueStats & { totalJobs: number }> => {
  return albumQueue.getStatsBySession(sessionId)
}

export const cleanupQueue = () => {
  albumQueue.cleanup()
}

export default albumQueue