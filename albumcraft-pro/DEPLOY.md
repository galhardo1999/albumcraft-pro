# 🚀 Deploy AlbumCraft Pro na Vercel

Este guia te ajudará a fazer o deploy do AlbumCraft Pro na Vercel de forma otimizada e segura.

## 📋 Pré-requisitos

- [ ] Conta na [Vercel](https://vercel.com)
- [ ] Repositório Git (GitHub, GitLab ou Bitbucket)
- [ ] Banco de dados PostgreSQL (recomendado: [Neon](https://neon.tech) ou [Supabase](https://supabase.com))
- [ ] Conta no [Prisma Data Platform](https://cloud.prisma.io) (para Accelerate)

## 🛠️ Configuração do Banco de Dados

### 1. PostgreSQL na Neon (Recomendado)
```bash
# 1. Crie uma conta em https://neon.tech
# 2. Crie um novo projeto
# 3. Copie a connection string
```

### 2. Prisma Accelerate
```bash
# 1. Acesse https://cloud.prisma.io
# 2. Conecte seu banco PostgreSQL
# 3. Ative o Prisma Accelerate
# 4. Copie a connection string do Accelerate
```

## 🔧 Configuração das Variáveis de Ambiente

### 1. Na Vercel Dashboard
Acesse seu projeto na Vercel e vá em **Settings > Environment Variables**:

#### 🗄️ Database
```
DATABASE_URL=postgresql://user:password@host:5432/database?sslmode=require
PRISMA_DATABASE_URL=prisma+postgres://accelerate.prisma-data.net/?api_key=your_api_key
```

#### 🔐 Authentication
```
NEXTAUTH_SECRET=your_super_secret_key_here
NEXTAUTH_URL=https://your-app.vercel.app
```

#### 📁 File Storage (Escolha uma opção)

**Opção A: Vercel Blob (Recomendado)**
```
BLOB_READ_WRITE_TOKEN=your_vercel_blob_token
```

**Opção B: AWS S3**
```
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
AWS_REGION=us-east-1
AWS_S3_BUCKET=your-bucket-name
```

#### ⚙️ App Configuration
```
NEXT_PUBLIC_APP_NAME=AlbumCraftPro
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
NEXT_PUBLIC_MAX_FILE_SIZE=52428800
NEXT_PUBLIC_ALLOWED_FILE_TYPES=image/jpeg,image/png,image/webp
RATE_LIMIT_MAX_REQUESTS=100
RATE_LIMIT_WINDOW_MS=900000
```

## 🚀 Deploy Steps

### 1. Preparar o Repositório
```bash
# Certifique-se de que todos os arquivos estão commitados
git add .
git commit -m "feat: prepare for Vercel deployment"
git push origin main
```

### 2. Conectar à Vercel
1. Acesse [vercel.com](https://vercel.com)
2. Clique em **"New Project"**
3. Importe seu repositório
4. Configure as variáveis de ambiente
5. Clique em **"Deploy"**

### 3. Configuração Automática
O arquivo `vercel.json` já está configurado com:
- ✅ Build command otimizado
- ✅ Prisma generation automática
- ✅ Headers de segurança
- ✅ Timeout de 30s para APIs
- ✅ CORS configurado

## 🔍 Verificações Pós-Deploy

### 1. Teste as Funcionalidades
- [ ] Login/Registro funcionando
- [ ] Dashboard carregando
- [ ] Criação de projetos
- [ ] Upload de imagens
- [ ] APIs respondendo

### 2. Performance Check
```bash
# Use o Lighthouse ou GTmetrix para verificar:
# - Core Web Vitals
# - Performance Score
# - Acessibilidade
```

### 3. Monitoramento
- [ ] Configure alertas na Vercel
- [ ] Monitore logs de erro
- [ ] Verifique métricas de performance

## 🛡️ Segurança em Produção

### Headers de Segurança (Já configurados)
- ✅ X-Content-Type-Options: nosniff
- ✅ X-Frame-Options: DENY
- ✅ X-XSS-Protection: 1; mode=block
- ✅ Referrer-Policy: origin-when-cross-origin

### Variáveis Sensíveis
- ✅ Nunca commite arquivos .env
- ✅ Use secrets da Vercel
- ✅ Rotacione chaves regularmente

## 🚨 Troubleshooting

### Build Errors
```bash
# Se o build falhar, verifique:
1. Todas as variáveis de ambiente estão configuradas
2. DATABASE_URL está acessível
3. Prisma schema está válido
```

### Runtime Errors
```bash
# Verifique os logs na Vercel:
1. Functions > View Function Logs
2. Procure por erros de conexão com DB
3. Verifique timeouts de API
```

### Performance Issues
```bash
# Otimizações implementadas:
1. Prisma Accelerate para cache de queries
2. Next.js Image Optimization
3. Static Generation onde possível
4. API Routes otimizadas
```

## 📊 Monitoramento e Analytics

### Vercel Analytics
```bash
# Ative no dashboard da Vercel:
1. Analytics > Enable
2. Speed Insights > Enable
3. Web Vitals monitoring
```

### Custom Monitoring
```bash
# Considere adicionar:
1. Sentry para error tracking
2. LogRocket para session replay
3. Prisma Pulse para DB monitoring
```

## 🔄 CI/CD Pipeline

O deploy automático está configurado para:
- ✅ Deploy automático no push para main
- ✅ Preview deployments para PRs
- ✅ Rollback automático em caso de erro
- ✅ Environment-specific configs

## 📞 Suporte

Se encontrar problemas:
1. Verifique os logs da Vercel
2. Consulte a [documentação oficial](https://vercel.com/docs)
3. Verifique o status do Prisma Accelerate
4. Teste localmente primeiro

---

**🎉 Parabéns! Seu AlbumCraft Pro está agora rodando na Vercel com performance e segurança otimizadas!**