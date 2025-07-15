#!/bin/bash

# 🚀 Script de Configuração do GitHub para AlbumCraft Pro
# Execute este script após criar o repositório no GitHub

echo "🚀 Configurando repositório GitHub para AlbumCraft Pro..."
echo ""

# Verificar se git está inicializado
if [ ! -d ".git" ]; then
    echo "❌ Erro: Este não é um repositório git!"
    echo "Execute 'git init' primeiro."
    exit 1
fi

# Solicitar URL do repositório
echo "📝 Por favor, forneça a URL do seu repositório GitHub:"
echo "Exemplo: https://github.com/seuusuario/albumcraft-pro.git"
read -p "URL do repositório: " REPO_URL

if [ -z "$REPO_URL" ]; then
    echo "❌ URL do repositório é obrigatória!"
    exit 1
fi

# Verificar se já existe um remote origin
if git remote get-url origin >/dev/null 2>&1; then
    echo "⚠️  Remote 'origin' já existe. Removendo..."
    git remote remove origin
fi

# Adicionar remote origin
echo "🔗 Adicionando remote origin..."
git remote add origin "$REPO_URL"

# Verificar se foi adicionado corretamente
echo "✅ Verificando configuração..."
git remote -v

# Verificar status do repositório
echo ""
echo "📊 Status do repositório:"
git status

# Fazer push para o GitHub
echo ""
echo "🚀 Fazendo push para o GitHub..."
echo "Isso pode solicitar suas credenciais do GitHub."

if git push -u origin main; then
    echo ""
    echo "🎉 Sucesso! Seu projeto foi enviado para o GitHub!"
    echo "🌐 Acesse: ${REPO_URL%.git}"
    echo ""
    echo "📋 Próximos passos:"
    echo "1. Configure GitHub Pages (se desejar)"
    echo "2. Configure Actions para CI/CD"
    echo "3. Adicione colaboradores (se necessário)"
    echo "4. Configure branch protection rules"
else
    echo ""
    echo "❌ Erro ao fazer push!"
    echo "Possíveis soluções:"
    echo "1. Verifique suas credenciais do GitHub"
    echo "2. Use um token pessoal se necessário"
    echo "3. Verifique se o repositório existe e você tem permissões"
    echo ""
    echo "Para usar token pessoal:"
    echo "1. Vá em GitHub → Settings → Developer settings → Personal access tokens"
    echo "2. Gere um novo token com permissões de repositório"
    echo "3. Use o token como senha quando solicitado"
fi