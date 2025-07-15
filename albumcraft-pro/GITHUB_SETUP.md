# 🚀 Guia para Publicar o AlbumCraft Pro no GitHub

## 📋 Pré-requisitos
- Conta no GitHub criada
- Git configurado localmente

## 🔧 Passos para Configuração

### 1. Criar Repositório no GitHub
1. Acesse [github.com](https://github.com) e faça login
2. Clique em **"New"** ou **"+"** → **"New repository"**
3. Configure:
   - **Nome**: `albumcraft-pro`
   - **Descrição**: "Sistema profissional de criação de álbuns de fotos com Next.js"
   - **Visibilidade**: Public ou Private
   - **NÃO** adicione README, .gitignore ou licença (já temos)

### 2. Conectar Repositório Local ao GitHub

Após criar o repositório, execute os comandos abaixo substituindo `SEU_USUARIO` pelo seu username do GitHub:

```bash
# Adicionar repositório remoto
git remote add origin https://github.com/SEU_USUARIO/albumcraft-pro.git

# Verificar se foi adicionado corretamente
git remote -v

# Fazer push do código para o GitHub
git push -u origin main
```

### 3. Comandos Alternativos (se usar SSH)

Se você configurou chaves SSH no GitHub:

```bash
# Adicionar repositório remoto via SSH
git remote add origin git@github.com:SEU_USUARIO/albumcraft-pro.git

# Fazer push
git push -u origin main
```

## 📊 Status Atual do Projeto

✅ **Commits Realizados:**
- Sistema de autenticação completo
- Dashboard funcional
- Sistema de planos (Free, Pro, Enterprise)
- Layout padronizado
- Integração com Google OAuth
- Páginas de perfil e configurações

✅ **Funcionalidades Implementadas:**
- Login/Registro de usuários
- Dashboard com estatísticas
- Sistema de planos com upgrade
- Perfil do usuário
- Layout responsivo e consistente
- Middleware de autenticação

## 🔐 Configuração de Autenticação (Opcional)

Se você quiser usar autenticação via token pessoal:

1. Vá em GitHub → Settings → Developer settings → Personal access tokens
2. Gere um novo token com permissões de repositório
3. Use o token como senha quando solicitado

## 📝 Próximos Passos Após o Push

1. Configure GitHub Pages (se quiser deploy gratuito)
2. Configure Actions para CI/CD
3. Adicione badges ao README
4. Configure issues e pull request templates

## 🆘 Solução de Problemas

**Erro de autenticação:**
- Verifique suas credenciais do GitHub
- Use token pessoal se necessário

**Erro "repository not found":**
- Verifique se o repositório foi criado corretamente
- Confirme o nome do usuário e repositório na URL

**Erro de push:**
- Verifique se você tem permissões no repositório
- Tente fazer pull antes do push se houver conflitos