# 🚀 **Guia Completo: Configuração S3 e Variáveis de Ambiente**

## 📋 **Pré-requisitos**
- Conta AWS ativa
- Cartão de crédito cadastrado na AWS (mesmo para tier gratuito)
- Acesso ao console AWS

---

## 🎯 **PASSO 1: Criar Bucket S3**

### 1.1 Acesse o Console AWS
- Vá para: https://console.aws.amazon.com/
- Faça login com suas credenciais

### 1.2 Navegue para S3
- No console, procure por "S3" na barra de pesquisa
- Clique em "S3" nos resultados

### 1.3 Criar Novo Bucket
```
1. Clique em "Create bucket" (Criar bucket)
2. Preencha os dados:
   - Bucket name: albumcraft-pro-photos-[SEU-NOME]
     Exemplo: albumcraft-pro-photos-joao123
   - AWS Region: us-east-1 (N. Virginia) - RECOMENDADO
3. Object Ownership: ACLs disabled (Recommended)
4. Block Public Access: MANTER TODAS MARCADAS ✅
5. Bucket Versioning: Disable (para economizar)
6. Default encryption: Server-side encryption with Amazon S3 managed keys (SSE-S3)
7. Clique em "Create bucket"
```

### 1.4 Anotar Informações
```
✅ Nome do Bucket: albumcraft-pro-photos-[SEU-NOME]
✅ Região: us-east-1
```

---

## 🔐 **PASSO 2: Configurar Políticas do Bucket**

### 2.1 Configurar CORS
```
1. Entre no bucket criado
2. Vá na aba "Permissions"
3. Role até "Cross-origin resource sharing (CORS)"
4. Clique em "Edit"
5. Cole o JSON abaixo:
```

```json
[
  {
    "AllowedHeaders": ["*"],
    "AllowedMethods": ["GET", "PUT", "POST", "DELETE", "HEAD"],
    "AllowedOrigins": [
      "http://localhost:3000",
      "http://localhost:3001",
      "https://seu-dominio.vercel.app"
    ],
    "ExposeHeaders": ["ETag"],
    "MaxAgeSeconds": 3000
  }
]
```

### 2.2 Configurar Bucket Policy
```
1. Na mesma aba "Permissions"
2. Role até "Bucket policy"
3. Clique em "Edit"
4. Cole o JSON abaixo (SUBSTITUA o nome do bucket):
```

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "AllowAlbumCraftAccess",
      "Effect": "Allow",
      "Principal": {
        "AWS": "arn:aws:iam::SUA-CONTA-ID:user/albumcraft-s3-user"
      },
      "Action": [
        "s3:GetObject",
        "s3:PutObject",
        "s3:DeleteObject"
      ],
      "Resource": "arn:aws:s3:::SEU-BUCKET-NAME/*"
    }
  ]
}
```

**⚠️ IMPORTANTE**: Você vai precisar voltar aqui depois de criar o usuário IAM!

---

## 👤 **PASSO 3: Criar Usuário IAM**

### 3.1 Acessar IAM
```
1. No console AWS, procure por "IAM"
2. Clique em "IAM" nos resultados
3. No menu lateral, clique em "Users"
4. Clique em "Create user"
```

### 3.2 Configurar Usuário
```
1. User name: albumcraft-s3-user
2. Provide user access to the AWS Management Console: NÃO MARCAR
3. Clique em "Next"
```

### 3.3 Configurar Permissões
```
1. Permissions options: "Attach policies directly"
2. NÃO selecione nenhuma política pronta
3. Clique em "Next"
4. Clique em "Create user"
```

### 3.4 Criar Política Personalizada
```
1. Após criar o usuário, clique nele
2. Vá na aba "Permissions"
3. Clique em "Add permissions" > "Create inline policy"
4. Clique na aba "JSON"
5. Cole a política abaixo (SUBSTITUA o nome do bucket):
```

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:GetObject",
        "s3:PutObject",
        "s3:DeleteObject",
        "s3:GetObjectVersion"
      ],
      "Resource": "arn:aws:s3:::SEU-BUCKET-NAME/*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "s3:ListBucket"
      ],
      "Resource": "arn:aws:s3:::SEU-BUCKET-NAME"
    }
  ]
}
```

```
6. Clique em "Next"
7. Policy name: AlbumCraftS3Policy
8. Clique em "Create policy"
```

---

## 🔑 **PASSO 4: Gerar Access Keys**

### 4.1 Criar Access Key
```
1. No usuário "albumcraft-s3-user"
2. Vá na aba "Security credentials"
3. Role até "Access keys"
4. Clique em "Create access key"
5. Use case: "Application running outside AWS"
6. Marque o checkbox de confirmação
7. Clique em "Next"
```

### 4.2 Configurar Descrição
```
1. Description tag: AlbumCraft Production Keys
2. Clique em "Create access key"
```

### 4.3 **COPIAR E SALVAR AS CHAVES** 🚨
```
✅ Access key ID: AKIA... (copie e salve)
✅ Secret access key: ... (copie e salve)

⚠️ ATENÇÃO: A Secret Key só aparece UMA VEZ!
   Salve em local seguro AGORA!
```

---

## 🔧 **PASSO 5: Configurar Variáveis de Ambiente**

### 5.1 Atualizar .env.local
Abra o arquivo `.env.local` e preencha:

```env
# AWS S3 Configuration
AWS_ACCESS_KEY_ID=AKIA...sua-access-key-aqui
AWS_SECRET_ACCESS_KEY=sua-secret-key-aqui
AWS_REGION=us-east-1
AWS_S3_BUCKET=albumcraft-pro-photos-seu-nome
```

### 5.2 Exemplo Preenchido
```env
# AWS S3 Configuration
AWS_ACCESS_KEY_ID=AKIAIOSFODNN7EXAMPLE
AWS_SECRET_ACCESS_KEY=wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY
AWS_REGION=us-east-1
AWS_S3_BUCKET=albumcraft-pro-photos-joao123
```

---

## ✅ **PASSO 6: Testar Configuração**

### 6.1 Reiniciar Servidor
```bash
# Pare o servidor (Ctrl+C)
# Inicie novamente
npm run dev
```

### 6.2 Testar Upload
```
1. Acesse: http://localhost:3001/test-diagramador
2. Clique em "Upload de Fotos"
3. Selecione uma imagem
4. Verifique se o upload funciona
5. Verifique no console AWS S3 se o arquivo apareceu
```

---

## 🎯 **PASSO 7: Finalizar Bucket Policy**

### 7.1 Obter Account ID
```
1. No console AWS, clique no seu nome (canto superior direito)
2. Copie o "Account ID" (12 dígitos)
```

### 7.2 Atualizar Bucket Policy
```
1. Volte ao S3 > Seu bucket > Permissions > Bucket policy
2. Substitua "SUA-CONTA-ID" pelo Account ID real
3. Substitua "SEU-BUCKET-NAME" pelo nome real do bucket
4. Salve a política
```

---

## 🚀 **PASSO 8: Deploy para Produção (Vercel)**

### 8.1 Configurar Variáveis no Vercel
```
1. Acesse: https://vercel.com/dashboard
2. Selecione seu projeto
3. Vá em "Settings" > "Environment Variables"
4. Adicione as 4 variáveis:
   - AWS_ACCESS_KEY_ID
   - AWS_SECRET_ACCESS_KEY
   - AWS_REGION
   - AWS_S3_BUCKET
```

### 8.2 Atualizar CORS para Produção
```
1. No bucket S3, edite o CORS
2. Substitua "https://seu-dominio.vercel.app" pela URL real
3. Salve as alterações
```

---

## 💰 **Estimativa de Custos**

### Tier Gratuito AWS (12 meses)
- **S3**: 5GB de armazenamento
- **Requests**: 20.000 GET, 2.000 PUT
- **Transfer**: 15GB de saída

### Após Tier Gratuito
- **Armazenamento**: ~$0.023/GB/mês
- **Requests**: ~$0.0004/1000 requests
- **Transfer**: ~$0.09/GB

**Exemplo**: 1000 fotos (2GB) = ~$0.05/mês

---

## 🛡️ **Checklist de Segurança**

- ✅ Bucket com acesso público bloqueado
- ✅ Usuário IAM com permissões mínimas
- ✅ Access Keys seguras (não commitadas)
- ✅ CORS configurado apenas para domínios necessários
- ✅ Política de bucket restritiva

---

## 🔧 **Solução de Problemas**

### Erro: "Access Denied"
```
1. Verifique se as Access Keys estão corretas
2. Confirme se a política IAM está aplicada
3. Verifique se o bucket policy está correto
```

### Erro: "CORS"
```
1. Confirme se o CORS está configurado
2. Verifique se a URL está na lista de origens permitidas
3. Limpe o cache do navegador
```

### Erro: "Bucket not found"
```
1. Confirme o nome do bucket no .env.local
2. Verifique se a região está correta
3. Confirme se o bucket existe no console AWS
```

---

## 📞 **Suporte**

Se encontrar problemas:
1. Verifique os logs do console do navegador
2. Verifique os logs do servidor Next.js
3. Confirme todas as configurações acima
4. Teste com uma imagem pequena primeiro

**🎉 Parabéns! Seu S3 está configurado e pronto para produção!**