import api from './api';
import type { 
  SchoolYear, 
  CreateSchoolYearData, 
  UpdateSchoolYearData,
  SchoolYearResponse,
  SchoolYearsResponse
} from '@edustats/shared';
import { addSchoolYearName, addSchoolYearNames } from '@edustats/shared';

export const schoolYearService = {
  /**
   * Créer une nouvelle année scolaire
   */
  async create(data: CreateSchoolYearData): Promise<SchoolYear> {
    // api.post retourne directement response.data, pas l'objet response complet
    const responseData = await api.post<SchoolYearResponse>('/school-years', data);
    
    // Vérifier que la réponse contient bien les données
    if (!responseData || !responseData.schoolYear) {
      console.error('Structure de réponse inattendue:', responseData);
      throw new Error('Structure de réponse invalide du serveur');
    }
    
    return addSchoolYearName(responseData.schoolYear);
  },

  /**
   * Récupérer toutes les années scolaires
   */
  async getAll(): Promise<{ schoolYears: SchoolYear[]; activeSchoolYear?: SchoolYear }> {
    // api.get retourne directement response.data
    const responseData = await api.get<SchoolYearsResponse>('/school-years');
    
    // Vérifier que responseData existe
    if (!responseData) {
      console.error('Response data is undefined:', responseData);
      return {
        schoolYears: [],
        activeSchoolYear: undefined,
      };
    }
    
    return {
      schoolYears: addSchoolYearNames(responseData.schoolYears || []),
      activeSchoolYear: responseData.activeSchoolYear 
        ? addSchoolYearName(responseData.activeSchoolYear) 
        : undefined,
    };
  },

  /**
   * Récupérer l'année scolaire active
   */
  async getActive(): Promise<SchoolYear | null> {
    try {
      const responseData = await api.get<SchoolYearResponse>('/school-years/active');
      return addSchoolYearName(responseData.schoolYear);
    } catch (error: any) {
      if (error.response?.status === 404) {
        return null;
      }
      throw error;
    }
  },

  /**
   * Récupérer une année scolaire par ID
   */
  async getById(id: number): Promise<SchoolYear> {
    const responseData = await api.get<SchoolYearResponse>(`/school-years/${id}`);
    return addSchoolYearName(responseData.schoolYear);
  },

  /**
   * Mettre à jour une année scolaire
   */
  async update(id: number, data: UpdateSchoolYearData): Promise<SchoolYear> {
    const responseData = await api.put<SchoolYearResponse>(`/school-years/${id}`, data);
    return addSchoolYearName(responseData.schoolYear);
  },

  /**
   * Activer une année scolaire
   */
  async activate(id: number): Promise<SchoolYear> {
    const responseData = await api.post<SchoolYearResponse>(`/school-years/${id}/activate`);
    return addSchoolYearName(responseData.schoolYear);
  },

  /**
   * Supprimer une année scolaire
   */
  async delete(id: number): Promise<void> {
    await api.delete(`/school-years/${id}`);
  },
};

