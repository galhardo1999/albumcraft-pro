'use client';

import { Card } from '@/components/ui/card';
import { Album, FolderOpen } from 'lucide-react';

interface ProjectCreationTypeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectType: (type: 'single' | 'multiple') => void;
}

export default function ProjectCreationTypeModal({ 
  isOpen, 
  onClose, 
  onSelectType 
}: ProjectCreationTypeModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold">Criar Projeto</h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 text-xl font-bold"
            >
              ×
            </button>
          </div>

          <div className="space-y-4">
            <p className="text-gray-600 text-center mb-6">
              Escolha o tipo de projeto que deseja criar:
            </p>

            {/* Opção Álbum Único */}
            <button
              onClick={() => onSelectType('single')}
              className="w-full p-6 border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all duration-200 group"
            >
              <div className="flex flex-col items-center space-y-3">
                <div className="p-3 bg-blue-100 rounded-full group-hover:bg-blue-200 transition-colors">
                  <Album className="w-8 h-8 text-blue-600" />
                </div>
                <div className="text-center">
                  <h3 className="font-semibold text-lg text-gray-900">
                    Criar Álbum Único
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">
                    Criar um projeto individual para um usuário específico
                  </p>
                </div>
              </div>
            </button>

            {/* Opção Múltiplos Álbuns */}
            <button
              onClick={() => onSelectType('multiple')}
              className="w-full p-6 border-2 border-gray-200 rounded-lg hover:border-green-500 hover:bg-green-50 transition-all duration-200 group"
            >
              <div className="flex flex-col items-center space-y-3">
                <div className="p-3 bg-green-100 rounded-full group-hover:bg-green-200 transition-colors">
                  <FolderOpen className="w-8 h-8 text-green-600" />
                </div>
                <div className="text-center">
                  <h3 className="font-semibold text-lg text-gray-900">
                    Criar Múltiplos Álbuns
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">
                    Criar projetos em lote para múltiplos usuários
                  </p>
                </div>
              </div>
            </button>
          </div>

          <div className="mt-6 pt-4 border-t">
            <button
              onClick={onClose}
              className="w-full px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Cancelar
            </button>
          </div>
        </div>
      </Card>
    </div>
  );
}