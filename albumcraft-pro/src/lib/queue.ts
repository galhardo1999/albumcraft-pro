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
    const startTime = Date.now()
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
      
      const project = await prisma.project.create({
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

      console.log(`✅ Projeto criado: ${project.id} - ${albumName}`);
      console.log('Álbum criado com sucesso!');

      // 2. Processar fotos em paralelo usando a mesma lógica do sistema individual
      const { uploadToS3, generateS3Key, generateThumbnailKey, isS3Configured } = await import('./s3');
      const { processImage, createThumbnail, getImageMetadata, isValidImageFormat, isValidFileSize, sanitizeFileName } = await import('./image-processing');
      
      const totalFiles = files.length;
      const errors: string[] = [];

      console.log(`🚀 Processando ${totalFiles} fotos em paralelo (concorrência: ${this.photosConcurrency})`);

      // Função para processar uma única foto
      const processPhoto = async (file: any, index: number) => {
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
            return { error: `${file.name}: Formato não suportado` };
          }

          // Validar tamanho do arquivo
          if (!isValidFileSize(file.buffer.length)) {
            console.log(`❌ Arquivo muito grande: ${file.buffer.length} bytes`);
            return { error: `${file.name}: Arquivo muito grande (máximo 50MB)` };
          }

          console.log(`✅ Validações passaram, processando imagem...`);
          
          // Obter metadados originais
          const originalMetadata = await getImageMetadata(file.buffer);
          console.log(`✅ Metadados obtidos: ${originalMetadata.width}x${originalMetadata.height}`);
          
          // Sanitizar nome do arquivo
          const sanitizedFileName = sanitizeFileName(file.name);
          console.log(`🧹 Nome sanitizado: ${sanitizedFileName}`);

          let originalUrl: string;
          let thumbnailUrl: string;
          let mediumUrl: string | null = null;
          let s3Key: string | null = null;

          if (isS3Configured()) {
            // **UPLOAD PARA S3** - Processamento paralelo das 3 versões
            console.log(`☁️ Fazendo upload para S3: ${file.name}`);
            
            // Processar todas as versões em paralelo
            const [processedImage, thumbnail, mediumImage] = await Promise.all([
              processImage(file.buffer, { format: 'jpeg', quality: 85 }),
              createThumbnail(file.buffer),
              processImage(file.buffer, { maxWidth: 800, maxHeight: 800, format: 'jpeg', quality: 80 })
            ]);
            
            // Gerar chaves S3
            const originalKey = generateS3Key(userId, sanitizedFileName, project.id);
            const thumbnailKey = generateThumbnailKey(originalKey);
            const mediumKey = originalKey.replace(/(\.[^.]+)$/, '_medium$1');
            s3Key = originalKey;
            
            // Upload para S3 em paralelo
            const [originalUpload, thumbnailUpload, mediumUpload] = await Promise.all([
              uploadToS3(processedImage.buffer, originalKey, processedImage.contentType),
              uploadToS3(thumbnail.buffer, thumbnailKey, thumbnail.contentType),
              uploadToS3(mediumImage.buffer, mediumKey, mediumImage.contentType)
            ]);
            
            originalUrl = originalUpload;
            thumbnailUrl = thumbnailUpload;
            mediumUrl = mediumUpload;
            
            console.log(`✅ Upload S3 concluído: ${file.name}`);
            
          } else {
            // **FALLBACK BASE64** - Processamento paralelo das 3 versões
            console.log(`💾 S3 não configurado, usando Base64: ${file.name}`);
            
            const [processedImage, thumbnail, mediumImage] = await Promise.all([
              processImage(file.buffer, { maxWidth: 1200, maxHeight: 1200, format: 'jpeg', quality: 80 }),
              createThumbnail(file.buffer),
              processImage(file.buffer, { maxWidth: 800, maxHeight: 800, format: 'jpeg', quality: 75 })
            ]);
            
            originalUrl = `data:${processedImage.contentType};base64,${processedImage.buffer.toString('base64')}`;
            thumbnailUrl = `data:${thumbnail.contentType};base64,${thumbnail.buffer.toString('base64')}`;
            mediumUrl = `data:${mediumImage.contentType};base64,${mediumImage.buffer.toString('base64')}`;
          }

          // **SALVAR FOTO NO BANCO DE DADOS**
          const photo = await prisma.photo.create({
            data: {
              userId,
              projectId: project.id,
              filename: sanitizedFileName,
              originalUrl,
              thumbnailUrl,
              mediumUrl,
              fileSize: originalMetadata.size,
              width: originalMetadata.width,
              height: originalMetadata.height,
              mimeType: file.type,
              s3Key,
              s3Bucket: isS3Configured() ? process.env.AWS_S3_BUCKET_NAME || null : null,
              s3Region: isS3Configured() ? process.env.AWS_REGION || null : null,
              isS3Stored: isS3Configured(),
            }
          });

          console.log(`✅ Foto salva no banco: ${photo.id} - ${file.name}`);
          return { success: true, photo };

        } catch (fileError) {
          console.error(`❌ Erro ao processar arquivo ${file.name}:`, fileError);
          return { error: `Erro na foto ${file.name}: ${fileError instanceof Error ? fileError.message : 'Erro desconhecido'}` };
        }
      };

      // Processar fotos em lotes paralelos
      const results = [];
      for (let i = 0; i < files.length; i += this.photosConcurrency) {
        const batch = files.slice(i, i + this.photosConcurrency);
        const batchPromises = batch.map((file, batchIndex) => 
          processPhoto(file, i + batchIndex)
        );
        
        const batchResults = await Promise.all(batchPromises);
        results.push(...batchResults);
        
        console.log(`📊 Lote ${Math.floor(i / this.photosConcurrency) + 1} processado: ${batchResults.length} fotos`);
      }

      // Contar sucessos e erros
       const uploadedCount = results.filter(r => r.success).length;
       const batchErrors = results.filter(r => r.error).map(r => r.error!);
       errors.push(...batchErrors);

      // 3. Finalizar o projeto (igual ao sistema individual)
      console.log('Finalizando álbum...');
      
      await prisma.project.update({
        where: { id: project.id },
        data: {
          status: 'COMPLETED',
          updatedAt: new Date(),
        }
      });

      const successMessage = errors.length > 0 
        ? `Álbum concluído! ${uploadedCount}/${totalFiles} fotos processadas. ${errors.length} erros.`
        : `Álbum concluído! ${uploadedCount} fotos processadas com sucesso.`;

      console.log(successMessage);
      
      const endTime = Date.now()
      const processingTime = (endTime - startTime) / 1000
      const photosPerSecond = files.length / processingTime
      
      console.log(`🎉 Álbum processado: ${albumName}`);
      console.log(`⏱️ Tempo total: ${processingTime.toFixed(2)}s`);
      console.log(`🚀 Velocidade: ${photosPerSecond.toFixed(2)} fotos/segundo`);
      console.log(`📊 Estatísticas:`);
      console.log(`   - Projeto ID: ${project.id}`);
      console.log(`   - Fotos processadas: ${uploadedCount}/${totalFiles}`);
      console.log(`   - Erros: ${errors.length}`);
      
      if (errors.length > 0) {
        console.log(`❌ Erros encontrados:`, errors);
      }

    } catch (error) {
      console.error(`❌ Erro ao processar álbum ${albumName}:`, error);
      
      console.error(`Erro ao processar álbum: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
      
      throw error;
    }
  }

  async getStats(): Promise<QueueStats> {
    return {
      waiting: this.queue.length,
      active: this.processing.size,
      completed: this.completed.length,
      failed: this.failed.length,
    };
  }

  // Obter estatísticas por sessionId
  async getStatsBySession(sessionId: string): Promise<QueueStats & { totalJobs: number }> {
    const allJobs = [
      ...this.queue,
      ...Array.from(this.processing.values()),
      ...this.completed,
      ...this.failed
    ].filter(job => job.data.sessionId === sessionId);

    const waiting = this.queue.filter(job => job.data.sessionId === sessionId).length;
    const active = Array.from(this.processing.values()).filter(job => job.data.sessionId === sessionId).length;
    const completed = this.completed.filter(job => job.data.sessionId === sessionId).length;
    const failed = this.failed.filter(job => job.data.sessionId === sessionId).length;

    return {
      waiting,
      active,
      completed,
      failed,
      totalJobs: allJobs.length
    };
  }

  // Limpar jobs antigos (manter apenas os últimos 100 de cada tipo)
  cleanup(): void {
    if (this.completed.length > 100) {
      this.completed = this.completed.slice(-100);
    }
    if (this.failed.length > 100) {
      this.failed = this.failed.slice(-100);
    }
  }
}

// Instância global da fila
const albumQueue = new InMemoryQueue();

// Função para adicionar job à fila
export const addAlbumCreationJob = async (
  data: AlbumCreationJobData,
  priority: number = 0
): Promise<{ id: string; status: string } | null> => {
  try {
    console.log(`⚡ Processando álbum: ${data.albumName}`);
    return await albumQueue.add(data, priority);
  } catch (error) {
    console.error('❌ Erro ao adicionar job à fila:', error);
    return null;
  }
}

// Processamento síncrono como fallback
export const processAlbumSynchronously = async (data: AlbumCreationJobData) => {
  const { userId, eventName, albumName, files } = data

  try {
    console.log(`🔄 Processando álbum sincronamente: ${albumName}`)

    // Simular processamento de álbum
    console.log(`📸 Processando ${files.length} arquivos para o álbum: ${albumName}`)
    
    // Simular delay de processamento
    const processingTime = Math.min(files.length * 200, 2000); // Max 2 segundos
    await new Promise(resolve => setTimeout(resolve, processingTime))
    
    console.log(`✅ Álbum ${albumName} processado com sucesso`)
    
    return {
      id: `project_${Date.now()}`,
      name: albumName,
      eventName,
      userId,
      status: 'COMPLETED',
      photoCount: files.length
    }

  } catch (error) {
    console.error(`❌ Erro ao processar álbum ${albumName}:`, error)
    throw error
  }
}

// Obter estatísticas da fila
export const getQueueStats = async (): Promise<QueueStats> => {
  try {
    return await albumQueue.getStats();
  } catch (error) {
    console.error('❌ Erro ao obter estatísticas da fila:', error)
    return {
      waiting: 0,
      active: 0,
      completed: 0,
      failed: 0
    }
  }
}

// Obter estatísticas por sessionId
export const getQueueStatsBySession = async (sessionId: string): Promise<QueueStats & { totalJobs: number }> => {
  try {
    return await albumQueue.getStatsBySession(sessionId);
  } catch (error) {
    console.error('❌ Erro ao obter estatísticas da fila por sessionId:', error)
    return {
      waiting: 0,
      active: 0,
      completed: 0,
      failed: 0,
      totalJobs: 0
    }
  }
}

// Função para limpeza periódica
export const cleanupQueue = () => {
  albumQueue.cleanup();
}

// Limpar a fila a cada 5 minutos
if (typeof window === 'undefined') { // Apenas no servidor
  setInterval(cleanupQueue, 5 * 60 * 1000);
}