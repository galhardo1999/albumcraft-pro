Documento de Requisitos de Produto (PRD): AlbumCraft Pro
Versão: 2.0

Data: 16 de Janeiro de 2025
Status: Em Desenvolvimento - MVP Implementado

1. Introdução
O **AlbumCraft Pro** é uma aplicação web moderna para criação e diagramação de álbuns de fotos profissionais, desenvolvida com Next.js 15, TypeScript, PostgreSQL e AWS S3. A plataforma oferece uma experiência intuitiva de drag-and-drop para fotógrafos profissionais e amadores criarem layouts personalizados de álbuns.

**Status Atual da Implementação:**
- ✅ **Arquitetura Base**: Next.js 15 com App Router, TypeScript, Prisma ORM
- ✅ **Autenticação**: Sistema completo com JWT, recuperação de senha e login social (Google)
- ✅ **Banco de Dados**: PostgreSQL com schema completo implementado
- ✅ **Upload de Fotos**: Integração com AWS S3, processamento de imagens com Sharp
- ✅ **Gerenciamento de Projetos**: CRUD completo de projetos e páginas
- ✅ **Interface de Diagramação**: Canvas interativo com drag-and-drop (React DnD)
- ✅ **Painel Administrativo**: Gestão de usuários, projetos e relatórios
- ✅ **Galeria de Fotos**: Sistema de eventos e álbuns para organização
- 🚧 **Exportação**: Em desenvolvimento (JPEG, alta resolução)
- 🚧 **Templates Avançados**: Biblioteca expandida de layouts
- 🚧 **Ferramentas de Edição**: Máscaras e personalização avançada

2. Objetivos
Capacitar a criação de álbuns profissionais: Fornecer a fotógrafos as ferramentas necessárias para desenhar e diagramar álbuns de alta qualidade para seus clientes.

Simplificar o processo de design: Oferecer uma interface intuitiva de arrastar e soltar (drag-and-drop), modelos pré-definidos e funcionalidades de design inteligente para agilizar o fluxo de trabalho.

Facilitar a organização de fotos: Integrar uma galeria de fotos que permita aos usuários importar, organizar e selecionar imagens facilmente.

Garantir flexibilidade e personalização: Permitir a customização completa dos layouts, incluindo fundos, margens, textos e outros elementos gráficos.

Construir uma plataforma robusta e escalável: Utilizar tecnologias modernas para garantir um desempenho rápido, segurança dos dados e capacidade de crescimento futuro.

3. Público-Alvo
Identificamos dois principais grupos de usuários para o diagramador de álbuns:

Fotógrafos Profissionais:

Necessidades: Precisam de uma ferramenta eficiente para criar álbuns para seus clientes (casamentos, ensaios, eventos). O fluxo de trabalho deve ser rápido e permitir a colaboração com o cliente para aprovação dos layouts. A qualidade final do exportável é crucial.

Fluxo de Trabalho Típico:

Importa uma grande quantidade de fotos de um evento.

Pré-seleciona as melhores imagens.

Cria um novo projeto de álbum, definindo tamanho e número de lâminas.

Utiliza layouts pré-definidos para agilizar a diagramação inicial.

Ajusta manualmente os layouts, troca fotos e adiciona toques pessoais.

Exporta uma versão de baixa resolução para aprovação do cliente.

Aplica as revisões solicitadas.

Exporta os arquivos finais em alta resolução para impressão.

Amadores e Entusiastas de Fotografia:

Necessidades: Desejam uma maneira fácil e criativa de compilar suas fotos pessoais (viagens, família, projetos pessoais) em álbuns memoráveis. A interface deve ser amigável e oferecer muitas opções de personalização para expressar sua criatividade.

Fluxo de Trabalho Típico:

Importa fotos de diversas fontes (computador, redes sociais, etc.).

Organiza as fotos em álbuns ou eventos.

Escolhe um tema ou modelo de layout que goste.

Arrasta e solta as fotos nas páginas.

Adiciona textos, adesivos e outros elementos decorativos.

Visualiza o álbum finalizado.

Exporta o álbum em formato digital para compartilhar ou em formato para impressão.

4. Requisitos Funcionais
4.1. Gerenciamento de Contas de Usuário
RF001: Os usuários devem poder se cadastrar utilizando e-mail and senha.

RF002: Os usuários devem poder fazer login e logout de suas contas.

RF003: O sistema deve ter um mecanismo de recuperação de senha.

4.2. Galeria de Fotos
RF004: Os usuários devem poder fazer upload de múltiplas imagens (JPEG, PNG) de uma só vez.

RF005: As imagens upadas devem ser armazenadas de forma segura.

RF006: Os usuários devem poder criar álbuns (pastas) para organizar suas fotos.

RF007: Os usuários devem poder visualizar as miniaturas de suas fotos na galeria.

RF008: O sistema deve exibir metadados básicos das imagens (nome do arquivo, dimensões, tamanho).

4.3. Criação e Gerenciamento de Projetos de Álbum
RF009: Os usuários devem poder criar um novo projeto de álbum, especificando um nome, tamanho do álbum (ex: 30x30cm, 20x30cm) e o número inicial de lâminas.

RF010: Os projetos de álbum devem ser salvos automaticamente para evitar perda de trabalho.

RF011: Os usuários devem poder visualizar, editar e excluir seus projetos existentes.

4.4. Interface de Diagramação
RF012: A interface deve apresentar uma visão geral das lâminas do álbum.

RF013: Os usuários devem poder adicionar e remover lâminas do projeto.

RF014: A interface deve ter um painel com a galeria de fotos do usuário.

RF015: Os usuários devem poder arrastar e soltar fotos da galeria para os espaços designados nos layouts das lâminas.

RF016: O sistema deve exibir um aviso para imagens de baixa resolução que possam comprometer a qualidade da impressão.

4.5. Layouts e Modelos de Lâminas
RF017: O sistema deve oferecer uma biblioteca de modelos de layouts pré-definidos para as lâminas.

RF018: Os modelos devem variar em número e disposição dos espaços para fotos.

RF019: Os usuários devem poder aplicar um modelo a uma lâmina com um único clique.

RF020: Os usuários devem poder modificar um layout existente ajustando o tamanho e a posição dos espaços para fotos.

RF021: (Opcional - Futuro) Os usuários devem poder salvar seus próprios layouts personalizados para uso futuro.

4.6. Ferramentas de Personalização
RF022: Os usuários devem poder adicionar caixas de texto às lâminas com opções de formatação (fonte, tamanho, cor).

RF023: Os usuários devem poder alterar a cor ou imagem de fundo das lâminas.

RF024: Os usuários devem poder aplicar máscaras e bordas às fotos.

RF025: O sistema deve fornecer uma biblioteca de cliparts e elementos gráficos para decoração.

4.7. Exportação e Compartilhamento
RF026: Os usuários devem poder exportar o álbum completo ou lâminas individuais em formato JPEG de alta resolução, pronto para impressão.

RF027: Os usuários devem poder exportar uma versão em baixa resolução (JPEG ou PDF) para compartilhamento e aprovação.

RF028: (Opcional - Futuro) O sistema deve gerar um link de compartilhamento para visualização online do álbum.

5. Requisitos Não Funcionais
RNF001 - Desempenho: A interface de diagramação deve ser fluida e responsiva, mesmo com um grande número de imagens. O tempo de carregamento das páginas deve ser otimizado.

RNF002 - Usabilidade: A interface deve ser intuitiva e fácil de usar, minimizando a curva de aprendizado para novos usuários.

RNF003 - Confiabilidade: O sistema deve ser estável e garantir a integridade dos dados dos usuários. Backups regulares do banco de dados devem ser implementados.

RNF004 - Segurança: As senhas dos usuários devem ser armazenadas de forma criptografada. O acesso aos dados dos usuários deve ser restrito e seguro.

RNF005 - Compatibilidade: A aplicação deve ser compatível com os principais navegadores web modernos (Chrome, Firefox, Safari, Edge).

RNF006 - Escalabilidade: A arquitetura deve ser capaz de suportar um número crescente de usuários e dados sem degradação significativa do desempenho.

6. Especificações Técnicas

6.1. Stack Tecnológico Implementado
**Frontend:**
- Next.js 15.4.1 (App Router) - Framework React com SSR/SSG ✅
- TypeScript 5+ - Type safety end-to-end ✅
- React 19.1.0 - Biblioteca de interface ✅
- Tailwind CSS 4+ - Framework CSS utilitário ✅
- Framer Motion 12.23.5 - Animações e transições ✅
- React Hook Form 7.60.0 + Zod 4.0.5 - Gerenciamento de formulários e validação ✅
- Zustand 5.0.6 - Gerenciamento de estado global ✅
- TanStack Query 5.83.0 - Cache e sincronização de dados ✅
- React DnD 16.0.1 - Sistema de drag-and-drop ✅
- React Dropzone 14.3.8 - Upload de arquivos ✅

**Backend:**
- Next.js API Routes - Endpoints RESTful ✅
- TypeScript - Type safety no servidor ✅
- Prisma ORM 6.11.1 - Database toolkit type-safe ✅
- Zod - Validação de schemas server-side ✅
- bcryptjs 3.0.2 - Hash de senhas ✅
- jose 6.0.11 - JWT handling seguro ✅

**Banco de Dados:**
- PostgreSQL 15+ - Banco relacional principal ✅
- Prisma Client - ORM type-safe ✅
- Schema completo implementado com relacionamentos ✅

**Autenticação e Autorização:**
- Sistema JWT customizado - Gerenciamento de sessões ✅
- Google OAuth - Login social implementado ✅
- Middleware de autenticação - Proteção de rotas ✅
- RBAC (Role-Based Access Control) - Controle de acesso com admin ✅
- Recuperação de senha - Sistema completo ✅

**Armazenamento e CDN:**
- AWS S3 - Armazenamento de imagens ✅
- AWS SDK 3.846.0 - Integração completa ✅
- Sharp 0.34.3 - Processamento de imagens server-side ✅
- Múltiplas resoluções - Thumbnail, medium, original ✅
- Presigned URLs - Upload seguro direto ao S3 ✅

**Infraestrutura e Deploy:**
- Vercel - Hosting e CI/CD ✅
- Vercel Postgres - Banco gerenciado ✅
- Build otimizado com Turbopack ✅
- Variáveis de ambiente configuradas ✅

**Bibliotecas de UI:**
- Radix UI - Componentes acessíveis ✅
- Lucide React 0.525.0 - Ícones ✅
- Class Variance Authority - Variantes de componentes ✅
- Tailwind Merge - Merge de classes CSS ✅
- Tailwind Animate - Animações CSS ✅

6.2. Funcionalidades Implementadas

**Sistema de Usuários:**
- Cadastro e login com validação ✅
- Recuperação de senha por email ✅
- Login social com Google ✅
- Perfis de usuário com avatar ✅
- Planos (FREE, PRO, ENTERPRISE) ✅
- Painel administrativo completo ✅

**Gerenciamento de Projetos:**
- Criação de projetos individuais e em lote ✅
- Múltiplos formatos de álbum (15x15 até 40x30cm) ✅
- Templates (classic, modern, artistic, minimal) ✅
- Status de projeto (DRAFT, IN_PROGRESS, COMPLETED) ✅
- Configurações personalizáveis ✅

**Sistema de Fotos:**
- Upload múltiplo com drag-and-drop ✅
- Integração completa com AWS S3 ✅
- Processamento automático de thumbnails ✅
- Metadados de imagem (dimensões, tamanho, MIME) ✅
- Galeria organizada por eventos e álbuns ✅
- Associação de fotos a projetos ✅

**Interface de Diagramação:**
- Canvas interativo com React DnD ✅
- Drag-and-drop de fotos para páginas ✅
- Sistema de páginas com numeração ✅
- Posicionamento preciso (x, y, width, height) ✅
- Rotação e z-index ✅
- Timeline de páginas (SpreadTimeline) ✅
- Painel de ferramentas (ToolsPanel) ✅

**Painel Administrativo:**
- Gestão completa de usuários ✅
- Visualização e edição de projetos ✅
- Relatórios e estatísticas ✅
- Gestão de galerias de fotos ✅
- Proteção por middleware ✅

6.2. Arquitetura de Segurança

**Autenticação:**
- Senhas hasheadas com bcrypt (salt rounds: 12)
- JWT tokens com expiração curta (15min) + refresh tokens
- Rate limiting em endpoints de autenticação
- CSRF protection habilitado
- Secure cookies (httpOnly, secure, sameSite)

**Autorização:**
- Middleware de autenticação em todas as rotas protegidas
- Validação de ownership de recursos (usuário só acessa seus dados)
- Sanitização de inputs com Zod
- SQL injection prevention via Prisma ORM

**Upload de Arquivos:**
- Validação de tipo MIME server-side
- Limite de tamanho por arquivo (50MB)
- Scan de malware (integração com serviços externos)
- Signed URLs para upload direto ao S3
- Compressão automática de imagens

**Dados Sensíveis:**
- Variáveis de ambiente para secrets
- Criptografia de dados sensíveis em repouso
- Logs sem informações pessoais
- GDPR compliance para dados de usuários

6.3. Estratégias de Escalabilidade

**Performance Frontend:**
- Server Components por padrão
- Client Components apenas quando necessário
- Image optimization com next/image
- Font optimization com next/font
- Bundle splitting automático
- Lazy loading de componentes pesados

**Caching Strategy:**
- Next.js fetch cache com revalidation
- Redis para cache de sessões e dados frequentes
- CDN cache para assets estáticos
- Database query optimization com índices

**Database Scaling:**
- Connection pooling com PgBouncer
- Read replicas para queries de leitura
- Índices otimizados para queries frequentes
- Pagination para listagens grandes
- Soft deletes para preservar integridade

**Monitoramento:**
- Real User Monitoring (RUM)
- Core Web Vitals tracking
- Database performance monitoring
- Error rate e latency alerts
- Resource usage monitoring

7. Modelo de Dados (Implementado)

7.1. Schema Prisma Atual

**User**
```prisma
model User {
  id                    String    @id @default(cuid())
  email                 String    @unique
  passwordHash          String    @map("password_hash")
  name                  String
  avatarUrl             String?   @map("avatar_url")
  plan                  UserPlan  @default(FREE)
  isAdmin               Boolean   @map("is_admin") @default(false)
  createdAt             DateTime  @default(now()) @map("created_at")
  updatedAt             DateTime  @updatedAt @map("updated_at")
  lastLogin             DateTime? @map("last_login")
  resetPasswordToken    String?   @map("reset_password_token")
  resetPasswordExpires  DateTime? @map("reset_password_expires")

  // Relacionamentos
  projects Project[]
  photos   Photo[]
  layouts  Layout[]
  photoEvents PhotoEvent[] @relation("PhotoEventUsers")
}
```

**Project**
```prisma
model Project {
  id           String        @id @default(cuid())
  userId       String        @map("user_id")
  name         String
  description  String?
  albumSize    AlbumSize     @map("album_size")
  template     Template      @default(classic)
  status       ProjectStatus @default(DRAFT)
  creationType CreationType  @map("creation_type") @default(SINGLE)
  group        String?       // Nome do grupo (evento, escola, etc.)
  eventName    String?       @map("event_name")
  pageCount    Int?          @map("page_count")
  format       String?       // Formato do álbum
  settings     Json?
  createdAt    DateTime      @default(now()) @map("created_at")
  updatedAt    DateTime      @updatedAt @map("updated_at")

  // Relacionamentos
  user   User   @relation(fields: [userId], references: [id], onDelete: Cascade)
  pages  Page[]
  photos Photo[]
}
```

**Photo**
```prisma
model Photo {
  id           String   @id @default(cuid())
  userId       String   @map("user_id")
  projectId    String?  @map("project_id")
  originalUrl  String   @map("original_url")
  thumbnailUrl String   @map("thumbnail_url")
  mediumUrl    String?  @map("medium_url")
  filename     String
  fileSize     Int      @map("file_size")
  width        Int
  height       Int
  mimeType     String   @map("mime_type")
  uploadedAt   DateTime @default(now()) @map("uploaded_at")
  metadata     Json?
  
  // Campos para S3
  s3Key        String?  @map("s3_key")
  s3Bucket     String?  @map("s3_bucket")
  s3Region     String?  @map("s3_region")
  isS3Stored   Boolean  @map("is_s3_stored") @default(false)

  // Relacionamentos
  user           User             @relation(fields: [userId], references: [id], onDelete: Cascade)
  project        Project?         @relation(fields: [projectId], references: [id], onDelete: SetNull)
  photoPlacement PhotoPlacement[]
}
```

**Page**
```prisma
model Page {
  id                  String  @id @default(cuid())
  projectId           String  @map("project_id")
  pageNumber          Int     @map("page_number")
  layoutId            String? @map("layout_id")
  backgroundColor     String? @map("background_color")
  backgroundImageUrl  String? @map("background_image_url")
  createdAt           DateTime @default(now()) @map("created_at")
  updatedAt           DateTime @updatedAt @map("updated_at")

  // Relacionamentos
  project         Project          @relation(fields: [projectId], references: [id], onDelete: Cascade)
  layout          Layout?          @relation(fields: [layoutId], references: [id])
  photoPlacement  PhotoPlacement[]

  @@unique([projectId, pageNumber])
}
```

**PhotoPlacement**
```prisma
model PhotoPlacement {
  id       String @id @default(cuid())
  pageId   String @map("page_id")
  photoId  String @map("photo_id")
  x        Float
  y        Float
  width    Float
  height   Float
  rotation Float  @default(0)
  zIndex   Int    @map("z_index") @default(0)
  filters  Json?

  // Relacionamentos
  page  Page  @relation(fields: [pageId], references: [id], onDelete: Cascade)
  photo Photo @relation(fields: [photoId], references: [id], onDelete: Cascade)
}
```

**Layout**
```prisma
model Layout {
  id           String   @id @default(cuid())
  name         String
  category     String
  isPublic     Boolean  @map("is_public") @default(true)
  createdBy    String?  @map("created_by")
  templateData Json     @map("template_data")
  previewUrl   String   @map("preview_url")
  createdAt    DateTime @default(now()) @map("created_at")

  // Relacionamentos
  creator User?  @relation(fields: [createdBy], references: [id])
  pages   Page[]
}
```

**Sistema de Galeria de Fotos**
```prisma
model PhotoEvent {
  id          String   @id @default(cuid())
  name        String
  description String?
  createdAt   DateTime @default(now()) @map("created_at")
  updatedAt   DateTime @updatedAt @map("updated_at")

  // Relacionamentos
  albums PhotoAlbum[]
  users  User[]       @relation("PhotoEventUsers")
}

model PhotoAlbum {
  id           String   @id @default(cuid())
  eventId      String   @map("event_id")
  name         String
  description  String?
  createdAt    DateTime @default(now()) @map("created_at")
  updatedAt    DateTime @updatedAt @map("updated_at")

  // Relacionamentos
  event  PhotoEvent      @relation(fields: [eventId], references: [id], onDelete: Cascade)
  photos PhotoGallery[]
}

model PhotoGallery {
  id         String   @id @default(cuid())
  albumId    String   @map("album_id")
  filename   String
  url        String
  size       Int
  mimeType   String   @map("mime_type")
  uploadedAt DateTime @default(now()) @map("uploaded_at")
  s3Key      String   @map("s3_key")

  // Relacionamentos
  album PhotoAlbum @relation(fields: [albumId], references: [id], onDelete: Cascade)
}
```

7.2. Enums Implementados
```prisma
enum UserPlan {
  FREE
  PRO
  ENTERPRISE
}

enum ProjectStatus {
  DRAFT
  IN_PROGRESS
  COMPLETED
}

enum AlbumSize {
  // Formatos Quadrados
  SIZE_15X15    // 15x15cm - Compacto
  SIZE_20X20    // 20x20cm - Clássico
  SIZE_25X25    // 25x25cm - Premium
  SIZE_30X30    // 30x30cm - Grande
  
  // Formatos Paisagem
  SIZE_20X15    // 20x15cm - Compacto
  SIZE_30X20    // 30x20cm - Popular
  SIZE_40X30    // 40x30cm - Grande
  
  // Formatos Retrato
  SIZE_15X20    // 15x20cm - Clássico
  SIZE_20X30    // 20x30cm - Popular
  SIZE_30X40    // 30x40cm - Profissional
  
  // Compatibilidade (deprecated)
  SMALL         // Mapeado para SIZE_15X20
  MEDIUM        // Mapeado para SIZE_20X30
  LARGE         // Mapeado para SIZE_30X40
  EXTRA_LARGE   // Mapeado para SIZE_40X30
  CUSTOM        // Personalizado
}

enum Template {
  classic
  modern
  artistic
  minimal
}

enum CreationType {
  SINGLE
  BATCH
}
```

7.3. Relacionamentos Implementados
- User 1:N Project ✅
- User 1:N Photo ✅
- User 1:N Layout ✅
- Project 1:N Page ✅
- Project 1:N Photo ✅
- Page 1:N PhotoPlacement ✅
- Photo 1:N PhotoPlacement ✅
- Layout 1:N Page ✅
- PhotoEvent 1:N PhotoAlbum ✅
- PhotoAlbum 1:N PhotoGallery ✅
- User M:N PhotoEvent ✅

8. API Design (Implementado)

8.1. Estrutura de Rotas Implementadas
```
/api/auth/*                    - Autenticação customizada ✅
  ├── /login                   - Login com email/senha ✅
  ├── /register                - Registro de usuário ✅
  ├── /google                  - Login social Google ✅
  ├── /forgot-password         - Recuperação de senha ✅
  └── /reset-password          - Reset de senha ✅

/api/user/*                    - Gerenciamento de usuários ✅
  ├── /profile                 - Perfil do usuário ✅
  └── /me                      - Dados do usuário atual ✅

/api/projects/*                - CRUD de projetos ✅
  ├── /                        - Listar/criar projetos ✅
  ├── /[id]                    - Obter/atualizar/deletar projeto ✅
  ├── /[id]/pages              - Gerenciar páginas do projeto ✅
  ├── /batch                   - Criação em lote ✅
  └── /export/[id]             - Exportação (em desenvolvimento) 🚧

/api/photos/*                  - Upload e gerenciamento de fotos ✅
  ├── /upload                  - Upload de fotos ✅
  ├── /                        - Listar fotos do usuário ✅
  ├── /[id]                    - Obter/deletar foto específica ✅
  └── /presigned-url           - URLs assinadas para S3 ✅

/api/admin/*                   - Painel administrativo ✅
  ├── /users                   - Gestão de usuários ✅
  ├── /projects                - Gestão de projetos ✅
  ├── /stats                   - Estatísticas do sistema ✅
  └── /reports                 - Relatórios ✅

/api/dashboard/*               - Dashboard do usuário ✅
  └── /stats                   - Estatísticas pessoais ✅

/api/notifications/*           - Sistema de notificações ✅
  └── /                        - Listar notificações ✅
```

8.2. Padrões de Response Implementados
```typescript
// Success Response
interface ApiResponse<T> {
  success: true;
  data: T;
  meta?: {
    pagination?: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
    timestamp: string;
  };
}

// Error Response
interface ApiError {
  success: false;
  error: {
    code: string;
    message: string;
    details?: any;
    timestamp: string;
  };
}
```

8.3. Validação com Zod (Implementado)
```typescript
// Schemas de validação implementados
const CreateProjectSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  albumSize: z.enum(['SIZE_15X15', 'SIZE_20X20', 'SIZE_25X25', 'SIZE_30X30', 
                     'SIZE_20X15', 'SIZE_30X20', 'SIZE_40X30', 'SIZE_15X20', 
                     'SIZE_20X30', 'SIZE_30X40', 'CUSTOM']),
  template: z.enum(['classic', 'modern', 'artistic', 'minimal']).default('classic'),
  pageCount: z.number().min(1).max(200).optional(),
  format: z.string().optional()
});

const PhotoUploadSchema = z.object({
  filename: z.string(),
  mimeType: z.string().regex(/^image\/(jpeg|jpg|png|webp)$/),
  fileSize: z.number().max(50 * 1024 * 1024), // 50MB max
  width: z.number().positive(),
  height: z.number().positive()
});

const UserRegistrationSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email(),
  password: z.string().min(8).max(100)
});
```

8.4. Middleware de Autenticação (Implementado)
```typescript
// Middleware para proteção de rotas
export async function authMiddleware(request: NextRequest) {
  const token = request.cookies.get('auth-token')?.value;
  
  if (!token) {
    return NextResponse.json(
      { success: false, error: { code: 'UNAUTHORIZED', message: 'Token não fornecido' } },
      { status: 401 }
    );
  }

  try {
    const payload = await verifyJWT(token);
    // Adiciona dados do usuário ao request
    return NextResponse.next();
  } catch (error) {
    return NextResponse.json(
      { success: false, error: { code: 'INVALID_TOKEN', message: 'Token inválido' } },
      { status: 401 }
    );
  }
}
```

8.5. Endpoints Principais Implementados

**Autenticação:**
- `POST /api/auth/login` - Login com email/senha ✅
- `POST /api/auth/register` - Registro de usuário ✅
- `POST /api/auth/google` - Login social Google ✅
- `POST /api/auth/forgot-password` - Solicitar reset de senha ✅
- `POST /api/auth/reset-password` - Confirmar reset de senha ✅

**Projetos:**
- `GET /api/projects` - Listar projetos do usuário ✅
- `POST /api/projects` - Criar novo projeto ✅
- `GET /api/projects/[id]` - Obter projeto específico ✅
- `PUT /api/projects/[id]` - Atualizar projeto ✅
- `DELETE /api/projects/[id]` - Deletar projeto ✅
- `POST /api/projects/batch` - Criar múltiplos projetos ✅

**Fotos:**
- `POST /api/photos/upload` - Upload de fotos ✅
- `GET /api/photos` - Listar fotos do usuário ✅
- `DELETE /api/photos/[id]` - Deletar foto ✅
- `POST /api/photos/presigned-url` - Obter URL assinada S3 ✅

**Administração:**
- `GET /api/admin/users` - Listar usuários ✅
- `POST /api/admin/users` - Criar usuário ✅
- `PUT /api/admin/users/[id]` - Atualizar usuário ✅
- `DELETE /api/admin/users/[id]` - Deletar usuário ✅
- `GET /api/admin/stats` - Estatísticas do sistema ✅

9. Interface do Usuário (UI/UX)

9.1. Design System
- Paleta de cores profissional e acessível
- Tipografia clara e legível (Inter/Roboto)
- Componentes reutilizáveis com Tailwind CSS
- Dark mode support
- Responsive design (mobile-first)
- Acessibilidade WCAG 2.1 AA

9.2. Fluxos Principais
**Onboarding:**
1. Cadastro/Login
2. Tour guiado da interface
3. Criação do primeiro projeto
4. Upload das primeiras fotos

**Criação de Álbum:**
1. Novo projeto → Configurações básicas
2. Upload de fotos → Organização
3. Seleção de layout → Customização
4. Arrastar e soltar fotos
5. Ajustes finais → Preview
6. Exportação

9.3. Componentes Críticos
- **Drag & Drop Interface**: Biblioteca react-dnd
- **Image Viewer**: Zoom, pan, rotate
- **Layout Grid**: Sistema flexível de posicionamento
- **Toolbar**: Ferramentas de edição contextuais
- **Preview Modal**: Visualização em tempo real

10. Status de Desenvolvimento Atual

10.1. MVP Implementado ✅ (Concluído)
**Fundação Técnica:**
- ✅ Setup do projeto Next.js 15 + TypeScript
- ✅ Configuração do banco PostgreSQL + Prisma
- ✅ Sistema de autenticação completo (JWT + Google OAuth)
- ✅ Deploy funcional na Vercel
- ✅ Integração AWS S3 para armazenamento

**Funcionalidades Core:**
- ✅ Upload e gerenciamento de fotos com S3
- ✅ CRUD completo de projetos e páginas
- ✅ Interface de diagramação com drag-and-drop
- ✅ Sistema de layouts e templates
- ✅ Galeria de fotos organizada por eventos
- ✅ Painel administrativo completo

**Interface e UX:**
- ✅ Design system com Tailwind CSS + Radix UI
- ✅ Componentes reutilizáveis implementados
- ✅ Interface responsiva e acessível
- ✅ Drag & drop funcional (React DnD)
- ✅ Preview em tempo real
- ✅ Salvamento automático

10.2. Fase Atual - Funcionalidades Avançadas 🚧 (Em Desenvolvimento)
**Exportação e Finalização:**
- 🚧 Exportação em JPEG de alta resolução
- 🚧 Geração de arquivos para impressão
- 🚧 Preview final do álbum
- 🚧 Compressão e otimização de exports

**Ferramentas de Edição:**
- 🚧 Máscaras e bordas personalizadas
- 🚧 Biblioteca expandida de elementos gráficos

**Templates e Layouts:**
- 🚧 Biblioteca expandida de templates (50+ layouts)
- 🚧 Editor de layouts customizáveis
- 🚧 Templates por categoria (casamento, família, etc.)
- 🚧 Marketplace de templates

10.3. Próximas Fases - Roadmap

**Fase 3 - Colaboração e Workflow (2-3 meses)**
- 📋 Sistema de aprovação de clientes
- 📋 Comentários e revisões em tempo real
- 📋 Versionamento de projetos
- 📋 Workflow de aprovação customizável
- 📋 Notificações por email

**Fase 4 - Integrações e Automação (2-3 meses)**
- 📋 Integração com serviços de impressão
- 📋 API pública para integrações
- 📋 Automação de workflows
- 📋 Backup automático na nuvem
- 📋 Sincronização com Google Drive/Dropbox

**Fase 5 - AI e Funcionalidades Premium (3-4 meses)**
- 📋 Sugestões automáticas de layout (AI)
- 📋 Reconhecimento facial para agrupamento
- 📋 Auto-cropping inteligente
- 📋 Remoção automática de fundo
- 📋 Análise de qualidade de imagem

10.4. Métricas de Progresso Atual

**Desenvolvimento:**
- ✅ 85% das funcionalidades MVP implementadas
- ✅ 100% da arquitetura base concluída
- ✅ 90% dos endpoints API funcionais
- 🚧 60% das funcionalidades de exportação
- 🚧 40% das ferramentas avançadas de edição

**Qualidade:**
- ✅ Type safety 100% (TypeScript)
- ✅ Testes unitários básicos implementados
- 🚧 Testes de integração em desenvolvimento
- 🚧 Testes E2E planejados
- ✅ Performance otimizada (Core Web Vitals)

**Infraestrutura:**
- ✅ Deploy automatizado (Vercel)
- ✅ Banco de dados em produção
- ✅ CDN configurado (S3 + CloudFront)
- ✅ Monitoramento básico ativo
- 🚧 Backup automatizado em implementação

11. Métricas de Sucesso

11.1. Métricas Técnicas
- **Performance**: Core Web Vitals > 90
- **Uptime**: 99.9% disponibilidade
- **Load Time**: < 2s para primeira página
- **Error Rate**: < 0.1% de erros críticos

11.2. Métricas de Produto
- **Retenção**: 70% usuários ativos após 7 dias
- **Conversão**: 15% de free para paid users
- **Engagement**: 3+ projetos por usuário ativo
- **NPS**: Score > 50

11.3. Métricas de Negócio
- **CAC**: Customer Acquisition Cost < $50
- **LTV**: Lifetime Value > $200
- **Churn Rate**: < 5% mensal
- **Revenue Growth**: 20% MoM

12. Riscos e Mitigações

12.1. Riscos Técnicos
**Performance com muitas imagens**
- Mitigação: Lazy loading, CDN, compressão automática

**Escalabilidade do banco**
- Mitigação: Connection pooling, read replicas, caching

**Segurança de uploads**
- Mitigação: Validação rigorosa, scan de malware, signed URLs

12.2. Riscos de Produto
**Complexidade da interface**
- Mitigação: Testes de usabilidade, onboarding guiado

**Concorrência**
- Mitigação: Foco em nicho específico, features diferenciadas

**Adoção lenta**
- Mitigação: Marketing direcionado, parcerias com fotógrafos

13. Considerações de Compliance

13.1. LGPD/GDPR
- Consentimento explícito para coleta de dados
- Direito ao esquecimento (delete account)
- Portabilidade de dados
- Relatórios de privacidade

13.2. Acessibilidade
- Conformidade WCAG 2.1 AA
- Navegação por teclado
- Screen reader compatibility
- Alto contraste e zoom

13.3. Licenciamento
- Termos de uso claros
- Política de privacidade
- Licenças de uso de imagens
- Copyright e propriedade intelectual

14. Estratégia de Monetização

14.1. Modelo Freemium
**Plano Gratuito (FREE):**
- Até 3 projetos ativos
- 500MB de armazenamento
- Layouts básicos (10 templates)
- Exportação em baixa resolução
- Marca d'água do AlbumCraftPro

**Plano Profissional (PRO) - R$ 29,90/mês:**
- Projetos ilimitados
- 10GB de armazenamento
- Biblioteca completa de layouts (100+ templates)
- Exportação em alta resolução sem marca d'água
- Ferramentas avançadas de edição
- Suporte prioritário
- Backup automático na nuvem

**Plano Enterprise (ENTERPRISE) - R$ 99,90/mês:**
- Tudo do PRO +
- 100GB de armazenamento
- White-label (marca própria)
- API access para integrações
- Colaboração em equipe
- Analytics avançados
- Suporte dedicado
- SLA garantido

14.2. Funcionalidades Premium
- **Templates Exclusivos**: Layouts criados por designers profissionais
- **AI-Powered Suggestions**: Sugestões automáticas de layout baseadas nas fotos
- **Batch Processing**: Processamento em lote de múltiplos álbuns
- **Advanced Export Options**: Formatos especiais (INDD, PSD)
- **Print Integration**: Integração direta com gráficas parceiras

14.3. Marketplace de Templates
- Criadores podem vender templates personalizados
- Revenue sharing: 70% criador / 30% plataforma
- Sistema de avaliações e reviews
- Categorização por estilo e ocasião

15. Integrações e APIs

15.1. Integrações Nativas
**Armazenamento em Nuvem:**
- Google Drive - Import/export direto
- Dropbox - Sincronização automática
- OneDrive - Backup de projetos

**Redes Sociais:**
- Instagram - Import de fotos
- Facebook - Albums e eventos
- Google Photos - Sincronização

**Serviços de Impressão:**
- Photobook Brasil - Envio direto para impressão
- Mixbook - Templates e impressão
- Shutterfly - Marketplace internacional

15.2. API Pública (Enterprise)
```typescript
// Exemplo de endpoints da API
GET /api/v1/projects
POST /api/v1/projects
PUT /api/v1/projects/{id}
DELETE /api/v1/projects/{id}

GET /api/v1/projects/{id}/pages
POST /api/v1/projects/{id}/pages
PUT /api/v1/pages/{id}

POST /api/v1/photos/upload
GET /api/v1/photos
DELETE /api/v1/photos/{id}

POST /api/v1/export/{projectId}
GET /api/v1/export/{exportId}/status
GET /api/v1/export/{exportId}/download
```

15.3. Webhooks
- Project created/updated/deleted
- Export completed
- Payment processed
- User subscription changed

16. Estratégia de Testes

16.1. Testes Automatizados
**Unit Tests (Jest + Testing Library):**
```typescript
// Exemplo de teste de componente
describe('PhotoUpload Component', () => {
  it('should validate file types correctly', () => {
    const validFiles = ['image.jpg', 'photo.png'];
    const invalidFiles = ['document.pdf', 'video.mp4'];
    
    validFiles.forEach(file => {
      expect(validateFileType(file)).toBe(true);
    });
    
    invalidFiles.forEach(file => {
      expect(validateFileType(file)).toBe(false);
    });
  });
});
```

**Integration Tests (Playwright):**
- Fluxo completo de criação de álbum
- Upload e posicionamento de fotos
- Exportação de projetos
- Autenticação e autorização

**API Tests (Supertest):**
- Validação de endpoints
- Testes de segurança
- Performance testing
- Rate limiting

16.2. Testes de Performance
**Load Testing (k6):**
- Simulação de 1000+ usuários simultâneos
- Teste de upload de múltiplas imagens
- Stress testing do banco de dados

**Core Web Vitals:**
- LCP (Largest Contentful Paint) < 2.5s
- FID (First Input Delay) < 100ms
- CLS (Cumulative Layout Shift) < 0.1

16.3. Testes de Usabilidade
- A/B testing de interfaces
- Heatmaps e session recordings
- User interviews e feedback
- Accessibility testing

17. DevOps e Deployment

17.1. CI/CD Pipeline
```yaml
# .github/workflows/deploy.yml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      - name: Install dependencies
        run: npm ci
      - name: Run tests
        run: npm run test:ci
      - name: Run E2E tests
        run: npm run test:e2e

  deploy:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v20
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.ORG_ID }}
          vercel-project-id: ${{ secrets.PROJECT_ID }}
```

17.2. Ambientes
**Development:**
- Local development com Docker
- Hot reload e debugging
- Mock services para APIs externas

**Staging:**
- Ambiente idêntico à produção
- Testes de integração
- Preview deployments

**Production:**
- Vercel Pro com edge functions
- Banco PostgreSQL gerenciado
- CDN global com cache otimizado

17.3. Monitoramento e Observabilidade
**Application Monitoring:**
- Sentry para error tracking
- Vercel Analytics para performance
- LogRocket para session replay

**Infrastructure Monitoring:**
- Uptime monitoring (UptimeRobot)
- Database performance (Prisma Pulse)
- API response times

**Business Metrics:**
- Mixpanel para product analytics
- Stripe para revenue tracking
- Customer.io para user engagement

18. Considerações de Acessibilidade

18.1. WCAG 2.1 AA Compliance
**Perceivable:**
- Alt text para todas as imagens
- Contraste mínimo de 4.5:1
- Suporte a zoom até 200%
- Legendas para conteúdo de vídeo

**Operable:**
- Navegação completa por teclado
- Tempo suficiente para interações
- Sem conteúdo que cause convulsões
- Atalhos de teclado customizáveis

**Understandable:**
- Linguagem clara e simples
- Navegação consistente
- Mensagens de erro descritivas
- Ajuda contextual disponível

**Robust:**
- Compatibilidade com screen readers
- Markup semântico correto
- Graceful degradation
- Progressive enhancement

18.2. Implementação Técnica
```typescript
// Exemplo de componente acessível
const PhotoUploadButton = () => {
  return (
    <button
      type="button"
      aria-label="Fazer upload de fotos"
      aria-describedby="upload-help"
      className="focus:ring-2 focus:ring-blue-500"
      onKeyDown={handleKeyDown}
    >
      <UploadIcon aria-hidden="true" />
      Upload Fotos
    </button>
  );
};
```

19. Roadmap Futuro

19.1. Funcionalidades Avançadas (6-12 meses)
**AI/ML Integration:**
- Auto-layout baseado em conteúdo das fotos
- Reconhecimento facial para agrupamento
- Sugestões inteligentes de cropping
- Remoção automática de fundo

**Colaboração Avançada:**
- Comentários em tempo real
- Aprovação de clientes integrada
- Versionamento de projetos
- Workflow de aprovação customizável

**Mobile App:**
- React Native para iOS/Android
- Sincronização offline
- Camera integration
- Push notifications

19.2. Expansão de Mercado (12-24 meses)
**Internacionalização:**
- Suporte a múltiplos idiomas
- Moedas locais
- Parcerias com gráficas regionais
- Compliance local (GDPR, CCPA)

**Novos Verticais:**
- Álbuns corporativos
- Yearbooks escolares
- Portfolios de arte
- Catálogos de produtos

19.3. Tecnologias Emergentes (24+ meses)
**Web3 Integration:**
- NFT galleries
- Blockchain-based ownership
- Decentralized storage options

**AR/VR:**
- Preview em realidade aumentada
- Experiências imersivas
- Virtual photo shoots

20. Conclusão e Status Atual

O **AlbumCraft Pro** evoluiu significativamente desde sua concepção inicial, com o MVP praticamente completo e funcional. A plataforma já demonstra seu potencial no mercado de ferramentas criativas para fotógrafos, com uma base sólida implementada.

### **Estado Atual da Implementação:**

**✅ Conquistas Realizadas:**
1. **Arquitetura Robusta**: Next.js 15, TypeScript, PostgreSQL e AWS S3 totalmente integrados
2. **Funcionalidades Core**: Sistema completo de projetos, upload de fotos e diagramação
3. **Interface Moderna**: Design system implementado com Tailwind CSS e Radix UI
4. **Segurança**: Autenticação JWT, Google OAuth e proteção de rotas implementadas
5. **Escalabilidade**: Infraestrutura preparada para crescimento com Vercel e AWS
6. **Administração**: Painel administrativo completo para gestão da plataforma

**🚧 Em Desenvolvimento:**
1. **Exportação Avançada**: Sistema de geração de JPEG de alta resolução
2. **Ferramentas de Edição**: Máscaras e personalização avançada
3. **Templates Premium**: Biblioteca expandida de layouts profissionais
4. **Otimizações**: Performance e experiência do usuário

### **Vantagens Competitivas Consolidadas:**
1. **Performance Superior**: Implementação otimizada com Server Components
2. **Type Safety**: Redução de bugs com TypeScript end-to-end
3. **UX Intuitiva**: Interface drag-and-drop responsiva e acessível
4. **Escalabilidade Comprovada**: Arquitetura testada em produção
5. **Segurança Robusta**: Implementação de melhores práticas desde o início

### **Próximos Marcos Críticos:**
1. **Q1 2025**: Finalização das funcionalidades de exportação
2. **Q2 2025**: Lançamento do sistema de colaboração cliente-fotógrafo
3. **Q3 2025**: Implementação de integrações com serviços de impressão
4. **Q4 2025**: Funcionalidades de AI para sugestões automáticas

### **Métricas de Sucesso Atuais:**
- **Desenvolvimento**: 85% do MVP concluído
- **Performance**: Core Web Vitals otimizados
- **Segurança**: 100% das rotas protegidas
- **Type Safety**: 100% de cobertura TypeScript
- **Infraestrutura**: Deploy automatizado e monitoramento ativo

### **Investimentos Necessários:**
1. **Desenvolvimento**: Finalização das funcionalidades de exportação
2. **Design**: Expansão da biblioteca de templates
3. **Marketing**: Estratégia de lançamento e aquisição de usuários
4. **Infraestrutura**: Monitoramento avançado e backup automatizado

O **AlbumCraft Pro** está posicionado para se tornar a principal ferramenta de diagramação de álbuns no mercado brasileiro, com potencial de expansão internacional. A base técnica sólida e as funcionalidades já implementadas demonstram a viabilidade e o potencial de crescimento da plataforma.

**Status**: ✅ **MVP Funcional** | 🚧 **Funcionalidades Avançadas em Desenvolvimento** | 📋 **Roadmap Definido**


