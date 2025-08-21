// Exportações centralizadas de tipos

// Tipos de Álbum (nomenclatura padronizada)
export * from './album'

// Tipos de compatibilidade para migração gradual
// Estes aliases permitem migração sem quebrar o código existente
export type {
  Album as Project,
  AlbumDetails as ProjectDetails,
  AlbumStats as ProjectStats,
  AlbumCreationData as ProjectCreationData,
  BatchAlbumCreation as BatchProjectCreation
} from './album'