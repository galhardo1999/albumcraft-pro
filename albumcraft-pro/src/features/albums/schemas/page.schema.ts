import { z } from 'zod'

export const createPageSchema = z.object({
    albumId: z.string().cuid('ID do álbum inválido'),
    pageNumber: z.number().positive('Número da página deve ser positivo'),
    layoutId: z.string().cuid().optional(),
    backgroundColor: z.string().optional(),
    backgroundImageUrl: z.string().url().optional(),
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

export type CreatePageInput = z.infer<typeof createPageSchema>
export type PhotoPlacementInput = z.infer<typeof photoPlacementSchema>
