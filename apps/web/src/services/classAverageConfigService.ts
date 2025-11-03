import { apiService } from './api';

export interface ClassAverageConfig {
  id: number;
  classId: number;
  userId: number;
  divisor: number;
  formula: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateClassAverageConfigData {
  classId: number;
  divisor: number;
  formula: string;
}

export interface UpdateClassAverageConfigData {
  divisor?: number;
  formula?: string;
  isActive?: boolean;
}

export const classAverageConfigService = {
  // Récupérer toutes les configurations de l'utilisateur
  async getConfigs(): Promise<ClassAverageConfig[]> {
    const response = await apiService.get('/class-average-configs');
    return response.data.configs;
  },

  // Récupérer la configuration d'une classe spécifique
  async getClassConfig(classId: number): Promise<ClassAverageConfig | null> {
    const response = await apiService.get(`/class-average-configs/class/${classId}`);
    return response.data;
  },

  // Créer ou mettre à jour une configuration
  async createOrUpdateConfig(data: CreateClassAverageConfigData): Promise<ClassAverageConfig> {
    const response = await apiService.post('/class-average-configs', data);
    return response.data;
  },

  // Supprimer une configuration par ID
  async deleteConfig(id: number): Promise<void> {
    await apiService.delete(`/class-average-configs/${id}`);
  },

  // Supprimer une configuration par classe
  async deleteConfigByClass(classId: number): Promise<void> {
    await apiService.delete(`/class-average-configs/class/${classId}`);
  },
};
