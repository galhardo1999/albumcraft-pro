# AlbumCraftPro - Deploy na Vercel

## 🚀 Guia de Deploy Completo

### Pré-requisitos
- Conta na [Vercel](https://vercel.com)
- Conta no [GitHub](https://github.com) (para conectar o repositório)
- Banco de dados PostgreSQL (recomendado: Vercel Postgres)

### Passo 1: Preparar o Repositório

1. **Inicializar Git** (se ainda não foi feito):
```bash
git init
git add .
git commit -m "Initial commit - AlbumCraftPro"
```

2. **Criar repositório no GitHub** e fazer push:
```bash
git remote add origin https://github.com/seu-usuario/albumcraftpro.git
git branch -M main
git push -u origin main
```

### Passo 2: Configurar Banco de Dados

#### Opção A: Vercel Postgres (Recomendado)
1. Acesse [Vercel Dashboard](https://vercel.com/dashboard)
2. Vá em "Storage" → "Create Database" → "Postgres"
3. Escolha um nome para o banco
4. Copie a `DATABASE_URL` gerada

#### Opção B: Outro Provedor PostgreSQL
- Neon, Supabase, Railway, ou qualquer PostgreSQL compatível
- Certifique-se de que a connection string inclui `?sslmode=require`

### Passo 3: Deploy na Vercel

#### Via Dashboard da Vercel:
1. Acesse [Vercel Dashboard](https://vercel.com/dashboard)
2. Clique em "New Project"
3. Conecte seu repositório GitHub
4. Configure as variáveis de ambiente:

```env
DATABASE_URL=sua_database_url_aqui
NEXTAUTH_SECRET=gere_uma_chave_secreta_de_32_caracteres
NEXTAUTH_URL=https://seu-app.vercel.app
NODE_ENV=production
```

#### Via Vercel CLI:
```bash
# Instalar Vercel CLI
npm i -g vercel

# Fazer login
vercel login

# Deploy
vercel --prod
```

### Passo 4: Configurar Variáveis de Ambiente

No dashboard da Vercel, vá em Settings → Environment Variables e adicione:

| Variável | Valor | Ambiente |
|----------|-------|----------|
| `DATABASE_URL` | Sua connection string PostgreSQL | Production |
| `NEXTAUTH_SECRET` | Chave secreta (32+ caracteres) | Production |
| `NEXTAUTH_URL` | https://seu-app.vercel.app | Production |
| `NODE_ENV` | production | Production |

### Passo 5: Executar Migrações

Após o primeiro deploy, execute as migrações do banco:

```bash
# Via Vercel CLI
vercel env pull .env.local
npx prisma db push
```

### Passo 6: Verificar Deploy

1. Acesse sua aplicação em `https://seu-app.vercel.app`
2. Teste o registro de usuário
3. Teste o login
4. Verifique se todas as funcionalidades estão funcionando

## 🔧 Configurações Avançadas

### Domínio Customizado
1. No dashboard da Vercel, vá em Settings → Domains
2. Adicione seu domínio personalizado
3. Configure os DNS conforme instruções da Vercel

### Monitoramento e Analytics
```env
# Adicione estas variáveis para monitoramento
VERCEL_ANALYTICS_ID=seu_analytics_id
SENTRY_DSN=seu_sentry_dsn
```

### Upload de Arquivos (Vercel Blob Storage)
```env
BLOB_READ_WRITE_TOKEN=seu_vercel_blob_token
```

## 🛠️ Troubleshooting

### Erro de Build
- Verifique se todas as dependências estão no `package.json`
- Confirme se o `prisma generate` está sendo executado no build

### Erro de Banco de Dados
- Verifique se a `DATABASE_URL` está correta
- Confirme se o banco está acessível publicamente
- Execute `npx prisma db push` após configurar as variáveis

### Erro de Autenticação
- Verifique se `NEXTAUTH_SECRET` tem pelo menos 32 caracteres
- Confirme se `NEXTAUTH_URL` aponta para o domínio correto

## 📊 Performance e Otimização

### Cache Headers
O `vercel.json` já inclui headers otimizados para cache e segurança.

### Monitoramento
- Use Vercel Analytics para métricas de performance
- Configure Sentry para tracking de erros
- Monitore uso do banco de dados

### Escalabilidade
- A aplicação está configurada para auto-scaling na Vercel
- O banco PostgreSQL suporta connection pooling
- Considere implementar Redis para cache em alta escala

## 🔒 Segurança

### Checklist de Segurança:
- ✅ HTTPS habilitado automaticamente
- ✅ Headers de segurança configurados
- ✅ Variáveis de ambiente protegidas
- ✅ Validação server-side implementada
- ✅ Senhas hasheadas com bcrypt
- ✅ Autenticação JWT stateless

### Recomendações Adicionais:
- Rotacione `NEXTAUTH_SECRET` regularmente
- Configure rate limiting se necessário
- Monitore logs de acesso
- Implemente backup automático do banco

## 📞 Suporte

Para dúvidas sobre deploy na Vercel:
- [Documentação Vercel](https://vercel.com/docs)
- [Vercel Community](https://github.com/vercel/vercel/discussions)
- [NextAuth.js Docs](https://next-auth.js.org/)
- [Prisma Docs](https://www.prisma.io/docs/)