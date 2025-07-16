# 🚀 Configuração do Amazon S3 para AlbumCraftPro

Este guia te ajudará a configurar o Amazon S3 para armazenamento de fotos em produção.

## 📋 Pré-requisitos

1. **Conta AWS**: Você precisa de uma conta na AWS
2. **AWS CLI** (opcional): Para configuração via linha de comando
3. **Conhecimentos básicos**: Familiaridade com AWS Console

## 🔧 Passo 1: Criar Bucket S3

### Via AWS Console:

1. **Acesse o AWS Console**: https://console.aws.amazon.com/
2. **Navegue para S3**: Procure por "S3" na barra de pesquisa
3. **Criar Bucket**:
   - Clique em "Create bucket"
   - **Nome do bucket**: `albumcraft-pro-photos-[seu-nome]` (deve ser único globalmente)
   - **Região**: Escolha uma região próxima aos seus usuários (ex: `us-east-1`)
   - **Configurações de acesso público**: 
     - ✅ Desmarque "Block all public access"
     - ✅ Marque "I acknowledge that the current settings..."
   - Clique em "Create bucket"

### Via AWS CLI:
```bash
aws s3 mb s3://albumcraft-pro-photos-[seu-nome] --region us-east-1
```

## 🔧 Passo 2: Configurar Políticas do Bucket

### 2.1 Política de Bucket (Bucket Policy)

1. **Acesse seu bucket** no AWS Console
2. **Vá para a aba "Permissions"**
3. **Clique em "Bucket policy"**
4. **Cole a seguinte política** (substitua `SEU-BUCKET-NAME`):

```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Sid": "PublicReadGetObject",
            "Effect": "Allow",
            "Principal": "*",
            "Action": "s3:GetObject",
            "Resource": "arn:aws:s3:::SEU-BUCKET-NAME/*"
        }
    ]
}
```

### 2.2 CORS Configuration

1. **Na aba "Permissions"**, clique em **"Cross-origin resource sharing (CORS)"**
2. **Cole a seguinte configuração**:

```json
[
    {
        "AllowedHeaders": ["*"],
        "AllowedMethods": ["GET", "PUT", "POST", "DELETE"],
        "AllowedOrigins": ["*"],
        "ExposeHeaders": ["ETag"]
    }
]
```

## 🔧 Passo 3: Criar Usuário IAM

### 3.1 Criar Usuário

1. **Acesse IAM**: https://console.aws.amazon.com/iam/
2. **Clique em "Users"** → **"Add users"**
3. **Nome do usuário**: `albumcraft-s3-user`
4. **Tipo de acesso**: ✅ "Programmatic access"
5. **Clique em "Next"**

### 3.2 Criar Política Personalizada

1. **Clique em "Attach policies directly"**
2. **Clique em "Create policy"**
3. **Aba "JSON"**, cole a política:

```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Action": [
                "s3:PutObject",
                "s3:PutObjectAcl",
                "s3:GetObject",
                "s3:DeleteObject"
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

4. **Nome da política**: `AlbumCraftS3Policy`
5. **Clique em "Create policy"**

### 3.3 Anexar Política ao Usuário

1. **Volte para a criação do usuário**
2. **Procure e selecione** `AlbumCraftS3Policy`
3. **Clique em "Next"** → **"Create user"**
4. **⚠️ IMPORTANTE**: Salve as credenciais:
   - **Access Key ID**
   - **Secret Access Key**

## 🔧 Passo 4: Configurar Variáveis de Ambiente

Edite o arquivo `.env.local` no seu projeto:

```env
# AWS S3 Configuration
AWS_ACCESS_KEY_ID="YOUR_AWS_ACCESS_KEY_ID"
AWS_SECRET_ACCESS_KEY="YOUR_AWS_SECRET_ACCESS_KEY"
AWS_REGION="us-east-1"
AWS_S3_BUCKET="your-bucket-name"
```

## 🔧 Passo 5: Aplicar Migrações do Banco

Execute as migrações para adicionar os novos campos do S3:

```bash
cd albumcraft-pro
npx prisma db push
npx prisma generate
```

## 🔧 Passo 6: Testar a Configuração

1. **Reinicie o servidor**:
   ```bash
   npm run dev
   ```

2. **Acesse**: http://localhost:3001/test-diagramador

3. **Teste o upload**: Tente fazer upload de uma foto

4. **Verifique os logs**: Você deve ver:
   - ✅ `Upload S3 realizado: photos/1/timestamp-random.jpg`
   - ❌ `S3 não configurado, usando fallback Base64` (se algo estiver errado)

## 🔧 Passo 7: Configuração para Produção (Vercel)

### 7.1 Configurar Variáveis no Vercel

1. **Acesse**: https://vercel.com/dashboard
2. **Selecione seu projeto**
3. **Settings** → **Environment Variables**
4. **Adicione as variáveis**:
   - `AWS_ACCESS_KEY_ID`
   - `AWS_SECRET_ACCESS_KEY`
   - `AWS_REGION`
   - `AWS_S3_BUCKET`

### 7.2 Atualizar Domínios Permitidos

No `next.config.ts`, adicione seu bucket:

```typescript
images: {
  remotePatterns: [
    {
      protocol: 'https',
      hostname: 'SEU-BUCKET-NAME.s3.us-east-1.amazonaws.com',
    },
  ],
}
```

## 🛡️ Segurança e Boas Práticas

### ✅ Recomendações de Segurança:

1. **Rotação de Chaves**: Rotacione as chaves de acesso regularmente
2. **Princípio do Menor Privilégio**: O usuário IAM só tem acesso ao bucket específico
3. **Monitoramento**: Configure CloudTrail para auditoria
4. **Backup**: Configure versionamento no bucket
5. **Criptografia**: Habilite criptografia server-side

### 🔒 Configurações Adicionais de Segurança:

```json
// Política de bucket mais restritiva (opcional)
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Sid": "PublicReadGetObject",
            "Effect": "Allow",
            "Principal": "*",
            "Action": "s3:GetObject",
            "Resource": "arn:aws:s3:::SEU-BUCKET-NAME/*",
            "Condition": {
                "StringLike": {
                    "aws:Referer": [
                        "https://seudominio.com/*",
                        "http://localhost:*"
                    ]
                }
            }
        }
    ]
}
```

## 💰 Estimativa de Custos

### Custos Aproximados (região us-east-1):

- **Armazenamento**: $0.023 por GB/mês
- **Requests PUT**: $0.0005 por 1.000 requests
- **Requests GET**: $0.0004 por 1.000 requests
- **Transferência de dados**: Primeiros 100GB gratuitos/mês

### Exemplo para 10.000 fotos (5GB):
- **Armazenamento**: ~$0.12/mês
- **Uploads**: ~$0.005/mês
- **Downloads**: ~$0.004/mês
- **Total**: ~$0.13/mês

## 🚨 Troubleshooting

### Problema: "Access Denied"
- ✅ Verifique se as credenciais estão corretas
- ✅ Confirme se a política IAM está anexada
- ✅ Verifique se o bucket existe na região correta

### Problema: "Bucket not found"
- ✅ Confirme o nome do bucket no `.env.local`
- ✅ Verifique se a região está correta

### Problema: "CORS error"
- ✅ Configure CORS no bucket
- ✅ Verifique se o domínio está permitido

## 📞 Suporte

Se você encontrar problemas:

1. **Verifique os logs** do servidor
2. **Teste as credenciais** com AWS CLI
3. **Consulte a documentação** da AWS
4. **Abra uma issue** no repositório do projeto

---

**🎉 Parabéns!** Seu AlbumCraftPro agora está configurado com Amazon S3 para armazenamento profissional de fotos!