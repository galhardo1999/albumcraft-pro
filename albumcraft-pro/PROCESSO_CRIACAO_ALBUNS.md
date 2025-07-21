# 📸 Processo de Criação de Álbuns - AlbumCraft Pro

## 📋 Visão Geral

1. **Criação Individual (Single Album)** - Para álbuns únicos com controle detalhado
2. **Criação em Lote (Batch Albums)** - Para múltiplos álbuns de eventos ou sessões

---

## 🎯 1. Criação Individual de Álbuns

### 📍 Localização
- **Página**: `/projects/new/single`
- **Componente**: `SingleAlbumPage`
- **API**: `/api/projects` (POST)

### 🔄 Fluxo do Processo

#### **Etapa 1: Configuração Inicial**
```typescript
interface FormData {
  name: string        // Nome do álbum
  albumSize: string   // Tamanho do álbum (ex: SIZE_20X20)
}
```

#### **Etapa 2: Gerenciamento de Fotos**

**Duas fontes de fotos:**
1. **Upload de Novas Fotos**
   - Validação de formato (apenas imagens)
   - Criação de preview temporário
   - Obtenção de dimensões automática
   - Armazenamento temporário em memória

2. **Fotos Existentes**
   - Carregamento de fotos não associadas a projetos
   - Seleção múltipla
   - Reutilização sem re-upload

#### **Etapa 3: Processamento e Criação**

**Validações:**
- Validação de dados com Zod Schema
- Verificação de autenticação

**Criação do Projeto:**

- Ser de acordo com o schema prisma


### 🎨 Templates Disponíveis
- Nao vai exisitir templates

---

## 🚀 2. Criação em Lote de Álbuns

### 📍 Localização
- **Página**: `/projects/new/batch`
- **Componente**: `CreateBatchAlbumsPage`
- **API**: `/api/projects/batch` (POST)

### 🔄 Fluxo do Processo

#### **Etapa 1: Configuração do Evento**
```typescript
interface BatchConfig {
  eventName: string      // Nome do evento/sessão
  selectedTemplate: string // Template aplicado a todos
  applyToAll: boolean    // Aplicar template a todos os álbuns
}
```

#### **Etapa 2: Upload de Estrutura de Pastas**

**Estrutura Esperada:**
```
📁 Evento Principal/
├── 📁 Álbum 1/
│   ├── 🖼️ foto1.jpg
│   ├── 🖼️ foto2.jpg
│   └── 🖼️ foto3.jpg
├── 📁 Álbum 2/
│   ├── 🖼️ foto4.jpg
│   └── 🖼️ foto5.jpg
└── 📁 Álbum 3/
    └── 🖼️ foto6.jpg
```

**Processamento:**
- Análise automática da estrutura de pastas
- Agrupamento de fotos por subpasta
- Validação de formatos de imagem
- Geração de preview com amostras

#### **Etapa 3: Sistema de Filas Assíncronas**

**Características:**
- **Processamento Não-Bloqueante**: Interface permanece responsiva
- **Priorização**: Álbuns processados por ordem de prioridade
- **Retry Logic**: Tentativas automáticas em caso de falha
- **Monitoramento em Tempo Real**: WebSocket para atualizações

**Estrutura do Job:**
```typescript
interface AlbumJob {
  id: string
  data: AlbumCreationJobData
  priority: number
  status: 'waiting' | 'processing' | 'completed' | 'failed'
  attempts: number
  maxAttempts: number
}
```

#### **Etapa 4: Processamento Individual por Álbum**

**Para cada álbum na fila:**

1. **Criação do Projeto**

- Criar de acordo com o schema prisma.

2. **Processamento de Imagens**
   - Validação de formato e tamanho
   - Obtenção de metadados (dimensões, EXIF)
   - Sanitização de nomes de arquivo
   - Processamento de imagem (redimensionamento, otimização)
   - Criação de thumbnails na galeria de fotos no diagramador
   - Upload para S3 

3. **Criação de Registros de Fotos**
   ```typescript
   const photo = await prisma.photo.create({
     data: {
       userId,
       projectId: project.id,
       name: sanitizedFileName,
       url: s3Url || localUrl,
       thumbnailUrl: thumbnailS3Url || localThumbnailUrl,
       width: originalMetadata.width,
       height: originalMetadata.height,
       fileSize: file.buffer.length,
       format: file.type
     }
   })
   ```

### 📊 Monitoramento em Tempo Real

#### **Notificações WebSocket**
- **Progresso por Álbum**: Percentual de conclusão
- **Status da Fila**: Estatísticas gerais
- **Mensagens de Status**: Feedback detalhado do processo

#### **Estatísticas da Fila**
```typescript
interface QueueStats {
  waiting: number    // Jobs aguardando
  active: number     // Jobs em processamento
  completed: number  // Jobs concluídos
  failed: number     // Jobs que falharam
}
```

---

## 🔧 Componentes Técnicos

### 🗄️ Banco de Dados (Prisma)

**Modelos Principais:**
- **Project**: Álbum/projeto principal
- **Photo**: Fotos individuais
- **User**: Usuário proprietário

**Relacionamentos:**
```prisma
model Project {
  id          String   @id @default(cuid())
  userId      String
  name        String
  description String?
  albumSize   AlbumSize
  template    Template
  status      ProjectStatus
  creationType CreationType
  group       String?
  
  user        User     @relation(fields: [userId], references: [id])
  photos      Photo[]
}
```

### 🖼️ Processamento de Imagens

**Validações:**
- **Formatos Suportados**: JPEG, JPG
- **Tamanho Máximo**: 15MB por arquivo
- **Dimensões**: Automáticas via metadata

**Otimizações:**
- Redimensionamento inteligente
- Compressão com qualidade preservada
- Geração de thumbnails (300x300px)
- Preservação de metadados EXIF

### ☁️ Armazenamento (S3)

**Estrutura de Chaves:**
```
photos/{userId}/{projectId}/{photoId}/{filename}
thumbnails/{userId}/{projectId}/{photoId}/thumb_{filename}
```

**Configuração:**
- Upload direto para S3 (se configurado)
- Fallback para armazenamento local
- URLs pré-assinadas para acesso seguro

---

## 🎯 Diferenças Entre os Métodos

| Aspecto | Criação Individual | Criação em Lote |
|---------|-------------------|-----------------|
| **Interface** | Formulário detalhado | Upload de pastas |
| **Processamento** | Síncrono | Assíncrono (filas) |
| **Controle** | Total sobre cada foto | Automático por pasta |
| **Monitoramento** | Feedback imediato | Tempo real via WebSocket |
| **Uso Ideal** | Álbuns personalizados | Eventos com múltiplos álbuns |
| **Performance** | Rápido para poucos álbuns | Otimizado para volume |

---

## 🚦 Estados e Status

### **Status do Projeto**
- **DRAFT**: Rascunho, em edição
- **PROCESSING**: Em processamento
- **COMPLETED**: Concluído
- **FAILED**: Falhou no processamento

### **Status da Fila (Batch)**
- **waiting**: Aguardando processamento
- **processing**: Em processamento
- **completed**: Processado com sucesso
- **failed**: Falhou após tentativas

---

## 🔐 Segurança e Validação

### **Autenticação**
- JWT tokens para todas as operações
- Middleware de autenticação automática
- Verificação de propriedade de recursos

### **Validação de Dados**
- **Zod Schemas** para validação rigorosa
- Sanitização de nomes de arquivo
- Verificação de tipos MIME
- Limites de tamanho por plano

### **Limites por Plano**
- **FREE**: 3 projetos máximo
- **PRO**: Ilimitado (futuro)
- **ENTERPRISE**: Recursos avançados (futuro)

---

## 📈 Performance e Otimização

### **Criação Individual**
- Upload direto para S3
- Processamento síncrono otimizado
- Cache de fotos existentes

### **Criação em Lote**
- Sistema de filas para não bloquear UI
- Processamento paralelo limitado
- Retry automático com backoff
- Notificações em tempo real eficientes

---

## 🛠️ Arquivos Principais

### **Frontend**
- `src/app/projects/new/single/page.tsx` - Interface criação individual
- `src/app/projects/new/batch/page.tsx` - Interface criação em lote
- `src/hooks/useNotifications.ts` - Hook para WebSocket

### **Backend**
- `src/app/api/projects/route.ts` - API criação individual
- `src/app/api/projects/batch/route.ts` - API criação em lote
- `src/lib/queue.ts` - Sistema de filas
- `src/lib/image-processing.ts` - Processamento de imagens
- `src/lib/s3.ts` - Integração com S3

### **Configuração**
- `prisma/schema.prisma` - Schema do banco
- `src/lib/validations.ts` - Schemas de validação
- `src/lib/album-sizes.ts` - Configurações de tamanhos
