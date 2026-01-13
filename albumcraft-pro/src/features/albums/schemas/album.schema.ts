import { z } from 'zod'

export const createAlbumSchema = z.object({
    name: z.string().min(1, 'Nome é obrigatório').max(100, 'Nome muito longo'),
    description: z.string().max(500, 'Descrição muito longa').optional(),
    albumSize: z.enum([
        // Formatos Quadrados
        'SIZE_15X15', 'SIZE_20X20', 'SIZE_25X25', 'SIZE_30X30',
        // Formatos Paisagem  
        'SIZE_20X15', 'SIZE_30X20', 'SIZE_40X30',
        // Formatos Retrato
        'SIZE_15X20', 'SIZE_20X30', 'SIZE_30X40',
        // Compatibilidade (deprecated)
        'SMALL', 'MEDIUM', 'LARGE', 'EXTRA_LARGE', 'CUSTOM'
    ]),
    status: z.enum(['DRAFT', 'IN_PROGRESS', 'COMPLETED']).optional(),
    creationType: z.enum(['SINGLE', 'BATCH']).optional(),
    group: z.string().max(100, 'Nome do grupo muito longo').optional(),
    customWidth: z.number().positive().optional(),
    customHeight: z.number().positive().optional(),
})

export const updateAlbumSchema = createAlbumSchema.partial()

export const createAlbumAdminSchema = createAlbumSchema.extend({
    userId: z.string().cuid('ID do usuário inválido'),
})

export const batchAlbumRequestSchema = z.object({
    userId: z.string().cuid('ID do usuário inválido'),
    albums: z.array(createAlbumSchema.extend({
        files: z.array(z.object({
            filename: z.string(),
            buffer: z.string(), // Base64 encoded
        })).optional(),
        eventName: z.string().optional(),
    })).min(1, 'Pelo menos um álbum é obrigatório'),
    sessionId: z.string().optional(),
    useQueue: z.boolean().optional(),
})

export type CreateAlbumInput = z.infer<typeof createAlbumSchema>
export type UpdateAlbumInput = z.infer<typeof updateAlbumSchema>
export type CreateAlbumAdminInput = z.infer<typeof createAlbumAdminSchema>
export type BatchAlbumRequestInput = z.infer<typeof batchAlbumRequestSchema>
