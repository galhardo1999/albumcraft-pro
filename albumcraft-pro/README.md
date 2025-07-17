# 📸 AlbumCraft Pro

<div align="center">

![AlbumCraft Pro](https://img.shields.io/badge/AlbumCraft-Pro-blue?style=for-the-badge&logo=camera)
![Next.js](https://img.shields.io/badge/Next.js-15-black?style=for-the-badge&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=for-the-badge&logo=typescript)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-blue?style=for-the-badge&logo=postgresql)
![AWS S3](https://img.shields.io/badge/AWS-S3-orange?style=for-the-badge&logo=amazon-aws)

**Plataforma profissional para criação de álbuns fotográficos personalizados**

*Transforme suas memórias em álbuns únicos com nossa interface drag-and-drop intuitiva*

[🚀 Demo ao Vivo](https://albumcraft-dcnjn8loc-galhardo1999s-projects.vercel.app) • [📖 Documentação](#-documentação) • [🛠️ Instalação](#️-instalação) • [🤝 Contribuir](#-contribuição)

</div>

---

## 🌟 **Visão Geral**

O **AlbumCraft Pro** é uma aplicação web moderna e escalável para criação de álbuns fotográficos personalizados. Desenvolvida com as mais recentes tecnologias web, oferece uma experiência profissional tanto para usuários individuais quanto para empresas que precisam criar álbuns em lote.

### ✨ **Principais Funcionalidades**

- 🎨 **Diagramador Visual**: Interface drag-and-drop para criação de layouts
- 📱 **Design Responsivo**: Funciona perfeitamente em desktop, tablet e mobile
- ☁️ **Armazenamento S3**: Integração completa com Amazon S3 para escalabilidade
- 🗑️ **Exclusão Inteligente**: Remove automaticamente arquivos do S3 ao deletar álbuns
- 👥 **Criação em Lote**: Suporte para múltiplos álbuns simultaneamente
- 🔒 **Autenticação Segura**: Sistema robusto com NextAuth.js e JWT
- 📊 **Dashboard Analítico**: Métricas e estatísticas detalhadas
- 🎯 **Templates Profissionais**: Layouts pré-definidos para diferentes ocasiões
- 🔄 **Sincronização Real-time**: Atualizações instantâneas entre dispositivos

---

## 🛠️ **Stack Tecnológica**

### **Frontend**
- **[Next.js 15](https://nextjs.org/)** - Framework React com App Router
- **[React 19](https://react.dev/)** - Biblioteca de interface de usuário
- **[TypeScript 5](https://www.typescriptlang.org/)** - Tipagem estática
- **[Tailwind CSS 4](https://tailwindcss.com/)** - Framework CSS utilitário
- **[Framer Motion](https://www.framer.com/motion/)** - Animações fluidas
- **[React DnD](https://react-dnd.github.io/react-dnd/)** - Drag and drop

### **Backend & Database**
- **[Next.js API Routes](https://nextjs.org/docs/api-routes/introduction)** - API serverless
- **[Prisma ORM](https://www.prisma.io/)** - ORM type-safe
- **[PostgreSQL](https://www.postgresql.org/)** - Banco de dados relacional
- **[Amazon S3](https://aws.amazon.com/s3/)** - Armazenamento de arquivos

### **Autenticação & Validação**
- **[NextAuth.js](https://next-auth.js.org/)** - Autenticação completa
- **[Zod](https://zod.dev/)** - Validação de schemas
- **[bcryptjs](https://github.com/dcodeIO/bcrypt.js)** - Hash de senhas
- **[JOSE](https://github.com/panva/jose)** - JWT handling

### **Estado & Formulários**
- **[Zustand](https://zustand-demo.pmnd.rs/)** - Gerenciamento de estado
- **[React Hook Form](https://react-hook-form.com/)** - Formulários performáticos
- **[TanStack Query](https://tanstack.com/query)** - Cache e sincronização

### **UI & Componentes**
- **[Radix UI](https://www.radix-ui.com/)** - Componentes acessíveis
- **[Lucide React](https://lucide.dev/)** - Ícones modernos
- **[Class Variance Authority](https://cva.style/)** - Variantes de componentes

---

## 🚀 **Instalação**

### **Pré-requisitos**

- **Node.js** 18+ 
- **npm** ou **yarn**
- **PostgreSQL** 14+
- **Conta AWS** (para S3)

### **1. Clone o Repositório**

```bash
git clone https://github.com/galhardo1999/albumcraft-pro.git
cd albumcraft-pro
```

### **2. Instale as Dependências**

```bash
npm install
# ou
yarn install
```

### **3. Configure as Variáveis de Ambiente**

Crie o arquivo `.env.local` na raiz do projeto:

```env
# 🗄️ Database
DATABASE_URL="postgresql://usuario:senha@localhost:5432/albumcraft_pro"

# 🔐 NextAuth.js
NEXTAUTH_SECRET="sua-chave-secreta-super-segura"
NEXTAUTH_URL="http://localhost:3000"

# ☁️ AWS S3 Configuration
AWS_ACCESS_KEY_ID="sua-access-key"
AWS_SECRET_ACCESS_KEY="sua-secret-key"
AWS_REGION="us-east-1"
AWS_S3_BUCKET="seu-bucket-name"

# 🌐 Google OAuth (Opcional)
GOOGLE_CLIENT_ID="seu-google-client-id"
GOOGLE_CLIENT_SECRET="seu-google-client-secret"

# 🔧 Outras Configurações
NODE_ENV="development"
```

### **4. Configure o Banco de Dados**

```bash
# Gere o cliente Prisma
npx prisma generate

# Execute as migrações
npx prisma db push

# (Opcional) Popule com dados de exemplo
npx prisma db seed
```

### **5. Configure o Amazon S3**

Siga o guia detalhado em [`AWS_S3_SETUP.md`](./AWS_S3_SETUP.md) para:
- Criar bucket S3
- Configurar políticas IAM
- Definir CORS
- Configurar credenciais

### **6. Inicie o Servidor**

```bash
npm run dev
# ou
yarn dev
```

🎉 **Acesse**: [http://localhost:3000](http://localhost:3000)

---

## 📁 **Estrutura do Projeto**

```
albumcraft-pro/
├── 📁 prisma/                    # Schema e migrações do banco
│   └── schema.prisma
├── 📁 src/
│   ├── 📁 app/                   # App Router do Next.js
│   │   ├── 📁 api/              # API Routes
│   │   │   ├── 📁 auth/         # Endpoints de autenticação
│   │   │   ├── 📁 photos/       # Gerenciamento de fotos
│   │   │   ├── 📁 projects/     # CRUD de projetos
│   │   │   └── 📁 users/        # Gerenciamento de usuários
│   │   ├── 📁 auth/             # Páginas de autenticação
│   │   ├── 📁 dashboard/        # Dashboard principal
│   │   ├── 📁 projects/         # Páginas de projetos
│   │   │   ├── 📁 [id]/         # Visualização de projeto
│   │   │   └── 📁 new/          # Criação de projetos
│   │   ├── 📁 profile/          # Perfil do usuário
│   │   ├── 📁 plans/            # Planos e assinaturas
│   │   └── 📁 test-diagramador/ # Página de teste do diagramador
│   ├── 📁 components/           # Componentes React
│   │   ├── 📁 diagramador/      # Componentes do diagramador
│   │   │   ├── DiagramCanvas.tsx
│   │   │   ├── DiagramadorWorkspace.tsx
│   │   │   ├── PhotoGallery.tsx
│   │   │   ├── SpreadTimeline.tsx
│   │   │   └── ToolsPanel.tsx
│   │   └── 📁 ui/               # Componentes de UI
│   │       ├── card.tsx
│   │       ├── label.tsx
│   │       ├── select.tsx
│   │       ├── slider.tsx
│   │       └── tabs.tsx
│   ├── 📁 data/                 # Dados estáticos e exemplos
│   │   └── sampleData.ts
│   ├── 📁 hooks/                # Hooks customizados
│   │   └── useAuth.ts
│   ├── 📁 lib/                  # Utilitários e configurações
│   │   ├── auth.ts              # Configuração NextAuth
│   │   ├── image-processing.ts  # Processamento de imagens
│   │   ├── prisma.ts            # Cliente Prisma
│   │   ├── s3.ts                # Utilitários AWS S3
│   │   └── validations.ts       # Schemas Zod
│   └── 📁 styles/               # Estilos customizados
│       └── diagramador.css
├── 📄 AWS_S3_SETUP.md           # Guia de configuração S3
├── 📄 GUIA_S3_VARIAVEIS.md      # Guia de variáveis S3
├── 📄 S3_BUCKET_POLICY.json     # Política do bucket S3
└── 📄 README.md                 # Este arquivo
```

---

## 🎯 **Funcionalidades Detalhadas**

### **🎨 Diagramador de Álbuns**

O coração do AlbumCraft Pro é seu diagramador visual avançado:

- **Interface Drag-and-Drop**: Arraste fotos diretamente para o canvas
- **Layouts Responsivos**: Templates que se adaptam a diferentes tamanhos
- **Ferramentas de Edição**: Redimensionar, rotacionar, aplicar filtros
- **Timeline de Páginas**: Navegação visual entre páginas do álbum
- **Preview em Tempo Real**: Visualização instantânea das alterações

### **☁️ Integração Amazon S3**

Sistema completo de armazenamento em nuvem:

- **Upload Automático**: Fotos são enviadas automaticamente para S3
- **Múltiplas Versões**: Original, thumbnail e versão média
- **Exclusão Inteligente**: Remove arquivos órfãos automaticamente
- **CDN Ready**: URLs otimizadas para distribuição global
- **Backup Seguro**: Dados protegidos na infraestrutura AWS

### **👥 Criação em Lote**

Ideal para fotógrafos e empresas:

- **Múltiplos Álbuns**: Crie vários álbuns simultaneamente
- **Templates Consistentes**: Aplique o mesmo design a todos
- **Processamento Assíncrono**: Não trava a interface durante criação
- **Progresso Visual**: Acompanhe o status de cada álbum

### **🔒 Sistema de Autenticação**

Segurança robusta e flexível:

- **Login Local**: Email e senha com hash bcrypt
- **OAuth Google**: Login social integrado
- **JWT Tokens**: Sessões seguras e escaláveis
- **Recuperação de Senha**: Sistema completo de reset
- **Middleware de Proteção**: Rotas protegidas automaticamente

### **📊 Dashboard Analítico**

Métricas e insights detalhados:

- **Estatísticas de Uso**: Projetos, fotos, armazenamento
- **Gráficos Interativos**: Visualização de dados em tempo real
- **Histórico de Atividades**: Timeline de ações do usuário
- **Relatórios Exportáveis**: Dados em PDF e Excel

---

## 🔧 **Scripts Disponíveis**

```bash
# 🚀 Desenvolvimento
npm run dev              # Servidor de desenvolvimento com Turbopack
npm run build            # Build de produção
npm run start            # Servidor de produção
npm run lint             # Linting com ESLint

# 🗄️ Banco de Dados
npx prisma generate      # Gerar cliente Prisma
npx prisma db push       # Aplicar mudanças no schema
npx prisma studio        # Interface visual do banco
npx prisma db seed       # Popular com dados de exemplo

# ☁️ Deploy
npm run vercel-build     # Build otimizado para Vercel
vercel --prod            # Deploy para produção
```

---

## 🌐 **Deploy em Produção**

### **Vercel (Recomendado)**

1. **Conecte o repositório** no [Vercel Dashboard](https://vercel.com)
2. **Configure as variáveis de ambiente** no painel
3. **Deploy automático** a cada push na branch main

### **Variáveis de Ambiente para Produção**

```env
# Banco de dados (use um serviço como Neon, Supabase ou Railway)
DATABASE_URL="postgresql://..."

# NextAuth (gere uma nova chave para produção)
NEXTAUTH_SECRET="chave-super-segura-para-producao"
NEXTAUTH_URL="https://seu-dominio.com"

# AWS S3 (use credenciais específicas para produção)
AWS_ACCESS_KEY_ID="..."
AWS_SECRET_ACCESS_KEY="..."
AWS_REGION="us-east-1"
AWS_S3_BUCKET="albumcraft-prod"

# Google OAuth (configure URLs de produção)
GOOGLE_CLIENT_ID="..."
GOOGLE_CLIENT_SECRET="..."
```

### **Configurações Adicionais**

- **Domínio Customizado**: Configure no painel da Vercel
- **SSL Automático**: Habilitado por padrão
- **CDN Global**: Distribuição automática
- **Analytics**: Monitore performance e uso

---

## 🛡️ **Segurança**

### **Práticas Implementadas**

- ✅ **Validação Server-Side**: Todos os inputs validados com Zod
- ✅ **Sanitização**: Prevenção contra XSS e injection
- ✅ **CORS Configurado**: Apenas origens autorizadas
- ✅ **Rate Limiting**: Proteção contra ataques de força bruta
- ✅ **Secrets Management**: Variáveis de ambiente protegidas
- ✅ **SQL Injection**: Prevenido pelo Prisma ORM
- ✅ **CSRF Protection**: Tokens de proteção automáticos

### **Recomendações de Segurança**

1. **Rotacione chaves** AWS regularmente
2. **Use HTTPS** sempre em produção
3. **Configure WAF** para proteção adicional
4. **Monitore logs** de acesso e erro
5. **Backup regular** do banco de dados

---

## 📈 **Performance**

### **Otimizações Implementadas**

- ⚡ **Server Components**: Renderização no servidor
- 🖼️ **Next.js Image**: Otimização automática de imagens
- 📦 **Code Splitting**: Carregamento sob demanda
- 🗄️ **Database Indexing**: Queries otimizadas
- 🔄 **React Query**: Cache inteligente de dados
- 🚀 **Turbopack**: Build ultra-rápido em desenvolvimento

### **Métricas de Performance**

- **First Contentful Paint**: < 1.5s
- **Largest Contentful Paint**: < 2.5s
- **Cumulative Layout Shift**: < 0.1
- **Time to Interactive**: < 3.5s

---

## 🧪 **Testes**

### **Scripts de Teste Incluídos**

```bash
# Teste de API com FormData
node test-api-formdata.js

# Teste de status da API
node test-api-status.js

# Teste de correções
node test-fix.js

# Verificação de fotos
node check-photos.js
```

### **Tipos de Teste**

- **Testes de Unidade**: Funções utilitárias
- **Testes de Integração**: APIs e banco de dados
- **Testes E2E**: Fluxos completos de usuário
- **Testes de Performance**: Carga e stress

---

## 🐛 **Troubleshooting**

### **Problemas Comuns**

#### **❌ Erro: "Module not found"**
```bash
# Limpe o cache e reinstale
rm -rf .next node_modules package-lock.json
npm install
npm run dev
```

#### **❌ Erro de conexão com banco**
```bash
# Verifique a DATABASE_URL
npx prisma db push
npx prisma generate
```

#### **❌ Erro de upload S3**
```bash
# Verifique as credenciais AWS
aws configure list
# Teste a conectividade
aws s3 ls s3://seu-bucket
```

#### **❌ Erro de autenticação**
```bash
# Verifique o NEXTAUTH_SECRET
# Limpe os cookies do navegador
# Reinicie o servidor
```

### **Logs e Debug**

```bash
# Habilite logs detalhados
DEBUG=* npm run dev

# Logs do Prisma
DEBUG="prisma:*" npm run dev

# Logs do NextAuth
NEXTAUTH_DEBUG=true npm run dev
```

---

## 📚 **Documentação**

### **Guias Específicos**

- 📖 [**Configuração AWS S3**](./AWS_S3_SETUP.md) - Setup completo do S3
- 🔧 [**Variáveis de Ambiente**](./GUIA_S3_VARIAVEIS.md) - Configurações detalhadas
- 🛡️ [**Política S3**](./S3_BUCKET_POLICY.json) - Configurações de segurança

### **APIs Disponíveis**

#### **Autenticação**
- `POST /api/auth/register` - Registro de usuário
- `POST /api/auth/login` - Login
- `POST /api/auth/logout` - Logout
- `POST /api/auth/reset-password` - Reset de senha

#### **Projetos**
- `GET /api/projects` - Listar projetos
- `POST /api/projects` - Criar projeto
- `GET /api/projects/[id]` - Obter projeto
- `PUT /api/projects/[id]` - Atualizar projeto
- `DELETE /api/projects/[id]` - Deletar projeto (com exclusão S3)

#### **Fotos**
- `GET /api/photos` - Listar fotos
- `POST /api/photos` - Upload de foto
- `GET /api/photos/[id]` - Obter foto
- `DELETE /api/photos/[id]` - Deletar foto

---

## 🤝 **Contribuição**

Contribuições são muito bem-vindas! Siga estes passos:

### **1. Fork e Clone**
```bash
git clone https://github.com/seu-usuario/albumcraft-pro.git
cd albumcraft-pro
```

### **2. Crie uma Branch**
```bash
git checkout -b feature/nova-funcionalidade
```

### **3. Desenvolva e Teste**
```bash
npm run dev
npm run lint
npm run test
```

### **4. Commit e Push**
```bash
git add .
git commit -m "feat: adiciona nova funcionalidade"
git push origin feature/nova-funcionalidade
```

### **5. Abra um Pull Request**

### **Diretrizes de Contribuição**

- ✅ Siga os padrões de código existentes
- ✅ Adicione testes para novas funcionalidades
- ✅ Atualize a documentação quando necessário
- ✅ Use commits semânticos (feat, fix, docs, etc.)
- ✅ Mantenha PRs focados e pequenos

---

## 📄 **Licença**

Este projeto está licenciado sob a **MIT License** - veja o arquivo [LICENSE](LICENSE) para detalhes.

---

## 👥 **Equipe**

<div align="center">

**Desenvolvido com ❤️ por [Galhardo](https://github.com/galhardo1999)**

[![GitHub](https://img.shields.io/badge/GitHub-galhardo1999-black?style=for-the-badge&logo=github)](https://github.com/galhardo1999)
[![LinkedIn](https://img.shields.io/badge/LinkedIn-Connect-blue?style=for-the-badge&logo=linkedin)](https://linkedin.com/in/galhardo1999)

</div>

---

## 🙏 **Agradecimentos**

- **Next.js Team** - Framework incrível
- **Vercel** - Plataforma de deploy
- **Prisma** - ORM type-safe
- **AWS** - Infraestrutura confiável
- **Comunidade Open Source** - Inspiração e suporte

---

<div align="center">

**⭐ Se este projeto te ajudou, considere dar uma estrela!**

[![GitHub stars](https://img.shields.io/github/stars/galhardo1999/albumcraft-pro?style=social)](https://github.com/galhardo1999/albumcraft-pro/stargazers)

</div>
