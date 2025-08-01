# Ferramentas Utilizadas - Stack Tecnológico Padrão

**Versão:** 1.0  
**Data:** 16 de Janeiro de 2025  
**Baseado em:** PRD Padrão Template  

## 📋 Índice

1. [Frontend Framework](#1-frontend-framework)
2. [Linguagem e Tipagem](#2-linguagem-e-tipagem)
3. [Styling e UI](#3-styling-e-ui)
4. [Backend e API](#4-backend-e-api)
5. [Banco de Dados](#5-banco-de-dados)
6. [Autenticação e Segurança](#6-autenticação-e-segurança)
7. [Armazenamento](#7-armazenamento)
8. [Deploy e Infraestrutura](#8-deploy-e-infraestrutura)
9. [Validação e Formulários](#9-validação-e-formulários)
10. [Estado e Queries](#10-estado-e-queries)
11. [Desenvolvimento e Ferramentas](#11-desenvolvimento-e-ferramentas)
12. [Monitoramento e Analytics](#12-monitoramento-e-analytics)

---

## 1. Frontend Framework

### **Next.js 15+**
- **Descrição**: Framework React full-stack com App Router
- **Versão**: 15.4.1+
- **Por que usar**: 
  - Server Components nativos
  - Roteamento baseado em arquivos
  - Otimizações automáticas (Image, Font, Script)
  - Suporte nativo a TypeScript
  - Streaming e Suspense
- **Documentação**: [nextjs.org](https://nextjs.org)
- **Instalação**: `npx create-next-app@latest`

### **React 19+**
- **Descrição**: Biblioteca para interfaces de usuário
- **Versão**: 19.1.0+
- **Recursos utilizados**:
  - Server Components
  - Concurrent Features
  - Suspense
  - Error Boundaries
- **Documentação**: [react.dev](https://react.dev)

---

## 2. Linguagem e Tipagem

### **TypeScript**
- **Descrição**: Superset tipado do JavaScript
- **Versão**: 5.0+
- **Configuração**: `tsconfig.json` otimizado
- **Benefícios**:
  - Type safety em tempo de desenvolvimento
  - IntelliSense aprimorado
  - Refatoração segura
  - Detecção precoce de erros
- **Documentação**: [typescriptlang.org](https://www.typescriptlang.org)

```json
// tsconfig.json exemplo
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["dom", "dom.iterable", "ES6"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [{ "name": "next" }],
    "paths": { "@/*": ["./src/*"] }
  }
}
```

---

## 3. Styling e UI

### **Tailwind CSS 4+**
- **Descrição**: Framework CSS utility-first
- **Versão**: 4.0+
- **Configuração**: `tailwind.config.js` customizado
- **Benefícios**:
  - Desenvolvimento rápido
  - Bundle size otimizado
  - Design system consistente
  - Responsividade nativa
- **Documentação**: [tailwindcss.com](https://tailwindcss.com)

### **Radix UI**
- **Descrição**: Componentes primitivos acessíveis
- **Pacotes principais**:
  - `@radix-ui/react-dialog`
  - `@radix-ui/react-dropdown-menu`
  - `@radix-ui/react-form`
  - `@radix-ui/react-toast`
- **Benefícios**:
  - Acessibilidade WCAG 2.1 AA
  - Unstyled (compatível com Tailwind)
  - Keyboard navigation
  - Screen reader support
- **Documentação**: [radix-ui.com](https://www.radix-ui.com)

### **Framer Motion**
- **Descrição**: Biblioteca de animações para React
- **Versão**: 11.0+
- **Recursos utilizados**:
  - Page transitions
  - Component animations
  - Gesture handling
  - Layout animations
- **Documentação**: [framer.com/motion](https://www.framer.com/motion)

### **Lucide React**
- **Descrição**: Biblioteca de ícones SVG
- **Versão**: 0.400+
- **Benefícios**:
  - Ícones consistentes
  - Tree-shaking friendly
  - Customizáveis
  - Leves e escaláveis
- **Documentação**: [lucide.dev](https://lucide.dev)

---

## 4. Backend e API

### **Next.js API Routes**
- **Descrição**: Endpoints serverless integrados
- **Estrutura**: `app/api/` com App Router
- **Benefícios**:
  - Integração nativa com frontend
  - TypeScript end-to-end
  - Middleware support
  - Edge Runtime support
- **Exemplo**:
```typescript
// app/api/users/route.ts
export async function GET() {
  const users = await prisma.user.findMany();
  return Response.json({ success: true, data: users });
}
```

### **Prisma ORM**
- **Descrição**: ORM type-safe para TypeScript
- **Versão**: 6.11.1+
- **Componentes**:
  - Prisma Client
  - Prisma Migrate
  - Prisma Studio
- **Benefícios**:
  - Type safety
  - Auto-completion
  - Migration system
  - Database introspection
- **Documentação**: [prisma.io](https://www.prisma.io)

---

## 5. Banco de Dados

### **PostgreSQL 15+**
- **Descrição**: Banco de dados relacional avançado
- **Hosting**: Vercel Postgres
- **Benefícios**:
  - ACID compliance
  - JSON support
  - Full-text search
  - Extensibilidade
- **Documentação**: [postgresql.org](https://www.postgresql.org)

### **Vercel Postgres**
- **Descrição**: PostgreSQL serverless da Vercel
- **Benefícios**:
  - Auto-scaling
  - Backup automático
  - Integração nativa com Vercel
  - Connection pooling
- **Documentação**: [vercel.com/docs/storage/vercel-postgres](https://vercel.com/docs/storage/vercel-postgres)

---

## 6. Autenticação e Segurança

### **JWT (JSON Web Tokens)**
- **Descrição**: Padrão para tokens de autenticação
- **Biblioteca**: `jose` (recomendada para Next.js)
- **Implementação**:
  - Access tokens (15 minutos)
  - Refresh tokens (7 dias)
  - Middleware de verificação
- **Documentação**: [jwt.io](https://jwt.io)

### **Google OAuth 2.0**
- **Descrição**: Autenticação social com Google
- **Biblioteca**: `google-auth-library`
- **Fluxo**: Authorization Code Flow
- **Benefícios**:
  - UX simplificada
  - Segurança robusta
  - Dados de perfil automáticos
- **Documentação**: [developers.google.com/identity](https://developers.google.com/identity)

### **bcryptjs**
- **Descrição**: Hashing de senhas
- **Versão**: 2.4.3+
- **Configuração**: Salt rounds = 12
- **Uso**: Criptografia de senhas locais
- **Documentação**: [npmjs.com/package/bcryptjs](https://www.npmjs.com/package/bcryptjs)

---

## 7. Armazenamento

### **AWS S3**
- **Descrição**: Object storage da Amazon
- **SDK**: `@aws-sdk/client-s3` v3.846.0+
- **Recursos utilizados**:
  - Presigned URLs
  - Multipart uploads
  - Lifecycle policies
  - CloudFront integration
- **Documentação**: [aws.amazon.com/s3](https://aws.amazon.com/s3)

### **Sharp**
- **Descrição**: Processamento de imagens high-performance
- **Versão**: 0.34.3+
- **Funcionalidades**:
  - Resize automático
  - Geração de thumbnails
  - Conversão de formatos
  - Otimização de qualidade
- **Documentação**: [sharp.pixelplumbing.com](https://sharp.pixelplumbing.com)

---

## 8. Deploy e Infraestrutura

### **Vercel**
- **Descrição**: Plataforma de deploy para Next.js
- **Plano**: Pro (recomendado para produção)
- **Benefícios**:
  - Deploy automático
  - Edge Functions
  - Analytics integrado
  - Preview deployments
- **Documentação**: [vercel.com/docs](https://vercel.com/docs)

### **Vercel Analytics**
- **Descrição**: Analytics de performance e uso
- **Métricas**:
  - Core Web Vitals
  - Page views
  - User sessions
  - Conversion tracking
- **Documentação**: [vercel.com/analytics](https://vercel.com/analytics)

---

## 9. Validação e Formulários

### **Zod**
- **Descrição**: Schema validation library
- **Versão**: 3.22+
- **Benefícios**:
  - Type inference
  - Runtime validation
  - Error handling
  - Composable schemas
- **Documentação**: [zod.dev](https://zod.dev)

```typescript
// Exemplo de schema
const userSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  age: z.number().min(18).optional()
});
```

### **React Hook Form**
- **Descrição**: Biblioteca de formulários performática
- **Versão**: 7.48+
- **Benefícios**:
  - Minimal re-renders
  - Built-in validation
  - TypeScript support
  - Easy integration com Zod
- **Documentação**: [react-hook-form.com](https://react-hook-form.com)

---

## 10. Estado e Queries

### **Zustand**
- **Descrição**: Gerenciamento de estado simples
- **Versão**: 4.4+
- **Benefícios**:
  - Bundle size pequeno
  - TypeScript nativo
  - DevTools support
  - Middleware ecosystem
- **Documentação**: [zustand-demo.pmnd.rs](https://zustand-demo.pmnd.rs)

### **TanStack Query (React Query)**
- **Descrição**: Data fetching e caching
- **Versão**: 5.0+
- **Recursos**:
  - Automatic caching
  - Background updates
  - Optimistic updates
  - Infinite queries
- **Documentação**: [tanstack.com/query](https://tanstack.com/query)

---

## 11. Desenvolvimento e Ferramentas

### **ESLint**
- **Descrição**: Linter para JavaScript/TypeScript
- **Configuração**: `eslint.config.mjs`
- **Rules**: Next.js + TypeScript recommended
- **Documentação**: [eslint.org](https://eslint.org)

### **Prettier**
- **Descrição**: Code formatter
- **Configuração**: `.prettierrc`
- **Integração**: ESLint + VS Code
- **Documentação**: [prettier.io](https://prettier.io)

### **Husky**
- **Descrição**: Git hooks
- **Uso**: Pre-commit linting
- **Configuração**: `.husky/pre-commit`
- **Documentação**: [typicode.github.io/husky](https://typicode.github.io/husky)

---

## 12. Monitoramento e Analytics

### **Vercel Speed Insights**
- **Descrição**: Monitoramento de performance
- **Métricas**: Core Web Vitals em tempo real
- **Integração**: `@vercel/speed-insights`

### **Sentry** (Opcional)
- **Descrição**: Error tracking e performance monitoring
- **Benefícios**:
  - Error reporting
  - Performance monitoring
  - Release tracking
  - User feedback
- **Documentação**: [sentry.io](https://sentry.io)

---

## 📦 Package.json Exemplo

```json
{
  "dependencies": {
    "next": "^15.4.1",
    "react": "^19.1.0",
    "react-dom": "^19.1.0",
    "typescript": "^5.0.0",
    "@prisma/client": "^6.11.1",
    "prisma": "^6.11.1",
    "tailwindcss": "^4.0.0",
    "@radix-ui/react-dialog": "^1.0.5",
    "@radix-ui/react-form": "^0.0.3",
    "framer-motion": "^11.0.0",
    "lucide-react": "^0.400.0",
    "zod": "^3.22.0",
    "react-hook-form": "^7.48.0",
    "@hookform/resolvers": "^3.3.0",
    "zustand": "^4.4.0",
    "@tanstack/react-query": "^5.0.0",
    "jose": "^5.0.0",
    "bcryptjs": "^2.4.3",
    "google-auth-library": "^9.0.0",
    "@aws-sdk/client-s3": "^3.846.0",
    "sharp": "^0.34.3"
  },
  "devDependencies": {
    "@types/node": "^20.0.0",
    "@types/react": "^18.0.0",
    "@types/bcryptjs": "^2.4.0",
    "eslint": "^8.0.0",
    "eslint-config-next": "^15.4.1",
    "prettier": "^3.0.0",
    "husky": "^8.0.0"
  }
}
```

---

## 🚀 Scripts de Desenvolvimento

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "lint:fix": "next lint --fix",
    "type-check": "tsc --noEmit",
    "db:generate": "prisma generate",
    "db:push": "prisma db push",
    "db:migrate": "prisma migrate dev",
    "db:studio": "prisma studio",
    "db:seed": "tsx prisma/seed.ts"
  }
}
```

---

## 📚 Recursos Adicionais

### **Documentações Oficiais**
- [Next.js Documentation](https://nextjs.org/docs)
- [React Documentation](https://react.dev)
- [TypeScript Handbook](https://www.typescriptlang.org/docs)
- [Tailwind CSS Docs](https://tailwindcss.com/docs)
- [Prisma Documentation](https://www.prisma.io/docs)

### **Tutoriais e Guias**
- [Next.js Learn](https://nextjs.org/learn)
- [React Query Tutorial](https://tanstack.com/query/latest/docs/react/quick-start)
- [Prisma Getting Started](https://www.prisma.io/docs/getting-started)
- [Tailwind CSS Tutorial](https://tailwindcss.com/docs/installation)

### **Comunidades**
- [Next.js Discord](https://discord.gg/nextjs)
- [React Discord](https://discord.gg/react)
- [Prisma Discord](https://discord.gg/prisma)
- [Tailwind CSS Discord](https://discord.gg/tailwindcss)

---

**Este documento serve como referência completa das ferramentas utilizadas no stack tecnológico padrão, facilitando a configuração e desenvolvimento de novos projetos.**