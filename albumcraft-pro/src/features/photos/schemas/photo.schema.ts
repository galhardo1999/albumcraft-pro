import { z } from 'zod'

export const photoUploadSchema = z.object({
    filename: z.string().min(1, 'Nome do arquivo é obrigatório'),
    fileSize: z.number().positive('Tamanho do arquivo deve ser positivo'),
    width: z.number().positive('Largura deve ser positiva'),
    height: z.number().positive('Altura deve ser positiva'),
    mimeType: z.enum(['image/jpeg', 'image/png', 'image/webp']),
})

export const photoPlacementSchema = z.object({
    pageId: z.string().cuid('ID da página inválido'),
    photoId: z.string().cuid('ID da foto inválido'),
    x: z.number(),
    y: z.number(),
    width: z.number().positive('Largura deve ser positiva'),
    height: z.number().positive('Altura deve ser positiva'),
    rotation: z.number().default(0),
    zIndex: z.number().default(0),
    filters: z.record(z.string(), z.any()).optional(),
})

export type PhotoUploadInput = z.infer<typeof photoUploadSchema>
export type PhotoPlacementInput = z.infer<typeof photoPlacementSchema>
