import 'server-only'
import { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand, DeleteObjectsCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'

// Configuração do cliente S3
const s3Client = new S3Client({
    region: process.env.AWS_REGION || 'us-east-1',
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
    },
})

const BUCKET_NAME = process.env.AWS_S3_BUCKET || ''

// Verificar se as configurações estão definidas
export function isS3Configured(): boolean {
    return !!(
        process.env.AWS_ACCESS_KEY_ID &&
        process.env.AWS_SECRET_ACCESS_KEY &&
        process.env.AWS_REGION &&
        process.env.AWS_S3_BUCKET
    )
}

// Upload de arquivo para S3
export async function uploadToS3(
    file: Buffer,
    key: string,
    contentType: string
): Promise<string> {
    if (!isS3Configured()) {
        throw new Error('S3 não está configurado. Verifique as variáveis de ambiente.')
    }

    const command = new PutObjectCommand({
        Bucket: BUCKET_NAME,
        Key: key,
        Body: file,
        ContentType: contentType,
    })

    try {
        await s3Client.send(command)

        // Retornar a URL pública do arquivo
        return `https://${BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`
    } catch (error) {
        console.error('Erro ao fazer upload para S3:', error)
        throw new Error('Falha no upload para S3')
    }
}

// Deletar arquivo do S3
export async function deleteFromS3(key: string): Promise<void> {
    if (!isS3Configured()) {
        throw new Error('S3 não está configurado. Verifique as variáveis de ambiente.')
    }

    const command = new DeleteObjectCommand({
        Bucket: BUCKET_NAME,
        Key: key,
    })

    try {
        await s3Client.send(command)
    } catch (error) {
        console.error('Erro ao deletar arquivo do S3:', error)
        throw new Error('Falha ao deletar arquivo do S3')
    }
}

// Gerar URL assinada para acesso temporário (opcional)
export async function getSignedDownloadUrl(
    key: string,
    expiresIn: number = 3600
): Promise<string> {
    if (!isS3Configured()) {
        throw new Error('S3 não está configurado. Verifique as variáveis de ambiente.')
    }

    const command = new GetObjectCommand({
        Bucket: BUCKET_NAME,
        Key: key,
    })

    try {
        return await getSignedUrl(s3Client, command, { expiresIn })
    } catch (error) {
        console.error('Erro ao gerar URL assinada:', error)
        throw new Error('Falha ao gerar URL assinada')
    }
}

// Gerar chave única para o arquivo
export function generateS3Key(userId: string, filename: string, albumId?: string): string {
    const timestamp = Date.now()
    const randomString = Math.random().toString(36).substring(2, 15)
    const extension = filename.split('.').pop()

    if (albumId) {
        // Estrutura organizada por álbum: users/{userId}/albums/{albumId}/photos/
        return `users/${userId}/albums/${albumId}/photos/${timestamp}-${randomString}.${extension}`
    } else {
        // Fotos gerais do usuário (sem projeto específico)
        return `users/${userId}/photos/${timestamp}-${randomString}.${extension}`
    }
}

// Gerar chave para thumbnail
export function generateThumbnailKey(originalKey: string): string {
    const parts = originalKey.split('.')
    const extension = parts.pop()
    const baseName = parts.join('.')

    return `${baseName}-thumb.${extension}`
}

// Gerar chave para versão média
export function generateMediumKey(originalKey: string): string {
    const parts = originalKey.split('.')
    const extension = parts.pop()
    const baseName = parts.join('.')

    return `${baseName}-medium.${extension}`
}

// Deletar múltiplos arquivos do S3 (mais eficiente para muitos arquivos)
export async function deleteMultipleFromS3(keys: string[]): Promise<{
    deleted: string[]
    errors: Array<{ key: string; error: string }>
}> {
    console.log(`🔍 deleteMultipleFromS3 chamada com ${keys.length} chaves`)

    if (!isS3Configured()) {
        console.log(`❌ S3 não configurado, lançando erro`)
        throw new Error('S3 não está configurado. Verifique as variáveis de ambiente.')
    }

    if (keys.length === 0) {
        console.log(`⚠️ Nenhuma chave fornecida, retornando resultado vazio`)
        return { deleted: [], errors: [] }
    }

    console.log(`🔧 Configuração do S3:`, {
        bucket: BUCKET_NAME,
        region: process.env.AWS_REGION,
        hasAccessKey: !!process.env.AWS_ACCESS_KEY_ID,
        hasSecretKey: !!process.env.AWS_SECRET_ACCESS_KEY
    })

    const deleted: string[] = []
    const errors: Array<{ key: string; error: string }> = []

    // AWS S3 permite deletar até 1000 objetos por vez
    const batchSize = 1000

    for (let i = 0; i < keys.length; i += batchSize) {
        const batch = keys.slice(i, i + batchSize)

        console.log(`🗑️ Processando lote ${Math.floor(i / batchSize) + 1} com ${batch.length} arquivos:`, batch)

        const command = new DeleteObjectsCommand({
            Bucket: BUCKET_NAME,
            Delete: {
                Objects: batch.map(key => ({ Key: key })),
                Quiet: false // Para receber confirmação de cada exclusão
            }
        })

        try {
            console.log(`📡 Enviando comando de exclusão para o S3...`)
            const result = await s3Client.send(command)

            console.log(`📥 Resposta do S3 recebida:`, {
                deleted: result.Deleted?.length || 0,
                errors: result.Errors?.length || 0
            })

            if (result.Deleted) {
                result.Deleted.forEach(deleted_obj => {
                    if (deleted_obj.Key) {
                        deleted.push(deleted_obj.Key)
                        console.log(`✅ Arquivo deletado: ${deleted_obj.Key}`)
                    }
                })
            }

            if (result.Errors) {
                result.Errors.forEach(error => {
                    if (error.Key && error.Message) {
                        errors.push({
                            key: error.Key,
                            error: error.Message
                        })
                        console.log(`❌ Erro ao deletar ${error.Key}: ${error.Message}`)
                    }
                })
            }

        } catch (error) {
            console.error(`❌ Erro ao executar comando de exclusão:`, error)
            batch.forEach(key => {
                errors.push({
                    key,
                    error: error instanceof Error ? error.message : 'Erro desconhecido'
                })
            })
        }
    }

    console.log(`🏁 Resultado final da exclusão:`, {
        totalDeleted: deleted.length,
        totalErrors: errors.length,
        deleted,
        errors
    })

    return { deleted, errors }
}

// Deletar todos os arquivos relacionados a uma foto (original, thumbnail, medium)
export async function deletePhotoVariants(s3Key: string): Promise<{
    deleted: string[]
    errors: Array<{ key: string; error: string }>
}> {
    console.log(`🔍 deletePhotoVariants chamada com s3Key: ${s3Key}`)

    if (!s3Key) {
        console.log(`⚠️ s3Key vazio, retornando resultado vazio`)
        return { deleted: [], errors: [] }
    }

    const keys = [
        s3Key, // Original
        generateThumbnailKey(s3Key), // Thumbnail
        generateMediumKey(s3Key) // Medium
    ]

    console.log(`🗑️ Tentando deletar as seguintes chaves:`, keys)

    const result = await deleteMultipleFromS3(keys)

    console.log(`✅ Resultado da exclusão:`, {
        deleted: result.deleted,
        errors: result.errors
    })

    return result
}

// Interface para resultado de exclusão de projeto
export interface ProjectDeletionResult {
    totalPhotos: number
    deletedFiles: string[]
    errors: Array<{ key: string; error: string }>
    summary: {
        successCount: number
        errorCount: number
        skippedCount: number
    }
}

// Deletar todos os arquivos de um projeto no S3
export async function deleteProjectFiles(photos: Array<{ s3Key: string | null; isS3Stored: boolean }>): Promise<ProjectDeletionResult> {
    const result: ProjectDeletionResult = {
        totalPhotos: photos.length,
        deletedFiles: [],
        errors: [],
        summary: {
            successCount: 0,
            errorCount: 0,
            skippedCount: 0
        }
    }

    if (!isS3Configured()) {
        console.log('S3 não configurado, pulando exclusão de arquivos')
        result.summary.skippedCount = photos.length
        return result
    }

    const s3Photos = photos.filter(photo => photo.isS3Stored && photo.s3Key)

    if (s3Photos.length === 0) {
        console.log('Nenhuma foto no S3 encontrada para exclusão')
        result.summary.skippedCount = photos.length
        return result
    }

    console.log(`Iniciando exclusão de ${s3Photos.length} fotos do S3`)

    const allKeys: string[] = []

    for (const photo of s3Photos) {
        if (photo.s3Key) {
            allKeys.push(
                photo.s3Key,
                generateThumbnailKey(photo.s3Key),
                generateMediumKey(photo.s3Key)
            )
        }
    }

    const deletionResult = await deleteMultipleFromS3(allKeys)

    result.deletedFiles = deletionResult.deleted
    result.errors = deletionResult.errors
    result.summary.successCount = deletionResult.deleted.length
    result.summary.errorCount = deletionResult.errors.length

    console.log(`Exclusão concluída: ${result.summary.successCount} arquivos deletados, ${result.summary.errorCount} erros`)

    return result
}
