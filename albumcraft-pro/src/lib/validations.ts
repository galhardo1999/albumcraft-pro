import { z } from 'zod'

// User Schemas
export const CreateUserSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(8, 'Senha deve ter pelo menos 8 caracteres'),
  name: z.string().min(1, 'Nome é obrigatório').max(100, 'Nome muito longo'),
})

export const LoginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(1, 'Senha é obrigatória'),
})

export const ForgotPasswordSchema = z.object({
  email: z.string().email('Email inválido'),
})

export const ResetPasswordSchema = z.object({
  token: z.string().min(1, 'Token é obrigatório'),
  password: z.string().min(8, 'A senha deve ter pelo menos 8 caracteres'),
})

export const VerifyResetTokenSchema = z.object({
  token: z.string().min(1, 'Token é obrigatório'),
})

// Project Schemas
export const CreateProjectSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório').max(100, 'Nome muito longo'),
  description: z.string().max(500, 'Descrição muito longa').optional(),
  albumSize: z.enum(['SMALL', 'MEDIUM', 'LARGE', 'EXTRA_LARGE', 'SIZE_30X30', 'SIZE_20X30', 'CUSTOM']),
  template: z.enum(['classic', 'modern', 'artistic', 'minimal']).optional(),
  status: z.enum(['DRAFT', 'IN_PROGRESS', 'COMPLETED']).optional(),
  creationType: z.enum(['SINGLE', 'BATCH']).optional(),
  customWidth: z.number().positive().optional(),
  customHeight: z.number().positive().optional(),
})

export const UpdateProjectSchema = CreateProjectSchema.partial()

// Photo Schemas
export const PhotoUploadSchema = z.object({
  filename: z.string().min(1, 'Nome do arquivo é obrigatório'),
  fileSize: z.number().positive('Tamanho do arquivo deve ser positivo'),
  width: z.number().positive('Largura deve ser positiva'),
  height: z.number().positive('Altura deve ser positiva'),
  mimeType: z.enum(['image/jpeg', 'image/png', 'image/webp']),
})

// Page Schemas
export const CreatePageSchema = z.object({
  projectId: z.string().cuid('ID do projeto inválido'),
  pageNumber: z.number().positive('Número da página deve ser positivo'),
  layoutId: z.string().cuid().optional(),
  backgroundColor: z.string().optional(),
  backgroundImageUrl: z.string().url().optional(),
})

// Photo Placement Schemas
export const PhotoPlacementSchema = z.object({
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

// Layout Schemas
export const CreateLayoutSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório').max(100, 'Nome muito longo'),
  category: z.string().min(1, 'Categoria é obrigatória'),
  isPublic: z.boolean().default(true),
  templateData: z.record(z.string(), z.any()),
  previewUrl: z.string().url('URL de preview inválida'),
})

// API Response Schemas
export const ApiSuccessSchema = z.object({
  success: z.literal(true),
  data: z.any(),
  meta: z.object({
    pagination: z.object({
      page: z.number(),
      limit: z.number(),
      total: z.number(),
    }).optional(),
  }).optional(),
})

export const ApiErrorSchema = z.object({
  success: z.literal(false),
  error: z.object({
    code: z.string(),
    message: z.string(),
    details: z.any().optional(),
  }),
})

// Type exports
export type CreateUser = z.infer<typeof CreateUserSchema>
export type Login = z.infer<typeof LoginSchema>
export type ForgotPassword = z.infer<typeof ForgotPasswordSchema>
export type ResetPassword = z.infer<typeof ResetPasswordSchema>
export type VerifyResetToken = z.infer<typeof VerifyResetTokenSchema>
export type CreateProject = z.infer<typeof CreateProjectSchema>
export type UpdateProject = z.infer<typeof UpdateProjectSchema>
export type PhotoUpload = z.infer<typeof PhotoUploadSchema>
export type CreatePage = z.infer<typeof CreatePageSchema>
export type PhotoPlacement = z.infer<typeof PhotoPlacementSchema>
export type CreateLayout = z.infer<typeof CreateLayoutSchema>
export type ApiSuccess<T = Record<string, unknown>> = z.infer<typeof ApiSuccessSchema> & { data: T }
export type ApiError = z.infer<typeof ApiErrorSchema>