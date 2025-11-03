// ========================================
// HOOK DRAFT SAVE - SAUVEGARDE BROUILLONS
// ========================================

import { useCallback, useRef, useEffect } from 'react';
import type { CreateEvaluationData, EvaluationTemplate } from '../../../../types';

/**
 * Interface pour un brouillon sauvegardé
 */
interface EvaluationDraft {
  id: string;
  classId: number;
  data: Partial<CreateEvaluationData>;
  currentStep: number;
  selectedTemplate: EvaluationTemplate | null;
  createdAt: Date;
  updatedAt: Date;
  title?: string; // Titre pour affichage
}

/**
 * Interface pour sauvegarder un brouillon
 */
interface SaveDraftParams {
  classId: number;
  data: Partial<CreateEvaluationData>;
  currentStep: number;
  selectedTemplate: EvaluationTemplate | null;
}

/**
 * Clé localStorage pour les brouillons
 */
const DRAFTS_STORAGE_KEY = 'edustats_evaluation_drafts';

/**
 * Nombre maximum de brouillons à conserver
 */
const MAX_DRAFTS = 10;

/**
 * Hook pour la gestion des brouillons d'évaluations
 */
export function useDraftSave() {
  const saveTimeoutRef = useRef<number | null>(null);

  // ========================================
  // GESTION DU STOCKAGE LOCAL
  // ========================================

  const getAllDrafts = useCallback((): EvaluationDraft[] => {
    try {
      const stored = localStorage.getItem(DRAFTS_STORAGE_KEY);
      if (!stored) return [];
      
      const drafts = JSON.parse(stored);
      
      // Convertir les dates
      return drafts.map((draft: any) => ({
        ...draft,
        createdAt: new Date(draft.createdAt),
        updatedAt: new Date(draft.updatedAt)
      }));
    } catch (error) {
      console.error('Erreur lors de la lecture des brouillons:', error);
      return [];
    }
  }, []);

  const saveDraftsToStorage = useCallback((drafts: EvaluationDraft[]) => {
    try {
      // Limiter le nombre de brouillons
      const limitedDrafts = drafts
        .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())
        .slice(0, MAX_DRAFTS);

      localStorage.setItem(DRAFTS_STORAGE_KEY, JSON.stringify(limitedDrafts));
    } catch (error) {
      console.error('Erreur lors de la sauvegarde des brouillons:', error);
      
      // Si erreur (quota dépassé), essayer de nettoyer les anciens brouillons
      try {
        const oldDrafts = drafts.slice(0, Math.floor(MAX_DRAFTS / 2));
        localStorage.setItem(DRAFTS_STORAGE_KEY, JSON.stringify(oldDrafts));
      } catch (secondError) {
        console.error('Impossible de sauvegarder les brouillons:', secondError);
      }
    }
  }, []);

  // ========================================
  // SAUVEGARDE DE BROUILLON
  // ========================================

  const saveDraft = useCallback(async (params: SaveDraftParams): Promise<string> => {
    return new Promise((resolve) => {
      // Annuler la sauvegarde précédente si elle est en attente
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }

      // Différer légèrement pour éviter les sauvegardes excessives
      saveTimeoutRef.current = window.setTimeout(() => {
        try {
          const drafts = getAllDrafts();
          const now = new Date();
          
          // Générer un ID unique ou réutiliser existant
          const existingDraftIndex = drafts.findIndex(d => d.classId === params.classId);
          
          let draftId: string;
          
          if (existingDraftIndex >= 0) {
            // Mettre à jour le brouillon existant
            draftId = drafts[existingDraftIndex].id;
            drafts[existingDraftIndex] = {
              id: draftId,
              classId: params.classId,
              data: params.data,
              currentStep: params.currentStep,
              selectedTemplate: params.selectedTemplate,
              createdAt: drafts[existingDraftIndex].createdAt,
              updatedAt: now,
              title: params.data.title || 'Évaluation sans titre'
            };
          } else {
            // Créer un nouveau brouillon
            draftId = `draft_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            const newDraft: EvaluationDraft = {
              id: draftId,
              classId: params.classId,
              data: params.data,
              currentStep: params.currentStep,
              selectedTemplate: params.selectedTemplate,
              createdAt: now,
              updatedAt: now,
              title: params.data.title || 'Évaluation sans titre'
            };
            
            drafts.push(newDraft);
          }

          saveDraftsToStorage(drafts);
          resolve(draftId);
        } catch (error) {
          console.error('Erreur lors de la sauvegarde du brouillon:', error);
          resolve(''); // Résoudre quand même pour ne pas bloquer l'interface
        }
      }, 100);
    });
  }, [getAllDrafts, saveDraftsToStorage]);

  // ========================================
  // CHARGEMENT DE BROUILLON
  // ========================================

  const loadDraft = useCallback(async (draftId: string): Promise<{
    data: Partial<CreateEvaluationData>;
    currentStep: number;
    selectedTemplate: EvaluationTemplate | null;
  } | null> => {
    try {
      const drafts = getAllDrafts();
      const draft = drafts.find(d => d.id === draftId);
      
      if (!draft) {
        console.warn(`Brouillon ${draftId} non trouvé`);
        return null;
      }

      return {
        data: draft.data,
        currentStep: draft.currentStep,
        selectedTemplate: draft.selectedTemplate
      };
    } catch (error) {
      console.error('Erreur lors du chargement du brouillon:', error);
      return null;
    }
  }, [getAllDrafts]);

  // ========================================
  // SUPPRESSION DE BROUILLON
  // ========================================

  const deleteDraft = useCallback(async (draftId: string): Promise<void> => {
    try {
      const drafts = getAllDrafts();
      const filteredDrafts = drafts.filter(d => d.id !== draftId);
      saveDraftsToStorage(filteredDrafts);
    } catch (error) {
      console.error('Erreur lors de la suppression du brouillon:', error);
    }
  }, [getAllDrafts, saveDraftsToStorage]);

  // ========================================
  // LISTE DES BROUILLONS
  // ========================================

  const getDraftsForClass = useCallback((classId: number): EvaluationDraft[] => {
    try {
      const drafts = getAllDrafts();
      return drafts
        .filter(d => d.classId === classId)
        .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
    } catch (error) {
      console.error('Erreur lors de la récupération des brouillons:', error);
      return [];
    }
  }, [getAllDrafts]);

  const getAllDraftsWithDetails = useCallback((): EvaluationDraft[] => {
    return getAllDrafts();
  }, [getAllDrafts]);

  // ========================================
  // NETTOYAGE
  // ========================================

  const cleanupOldDrafts = useCallback((olderThanDays: number = 30): number => {
    try {
      const drafts = getAllDrafts();
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);
      
      const validDrafts = drafts.filter(d => d.updatedAt > cutoffDate);
      const removedCount = drafts.length - validDrafts.length;
      
      if (removedCount > 0) {
        saveDraftsToStorage(validDrafts);
      }
      
      return removedCount;
    } catch (error) {
      console.error('Erreur lors du nettoyage des brouillons:', error);
      return 0;
    }
  }, [getAllDrafts, saveDraftsToStorage]);

  // ========================================
  // UTILITAIRES
  // ========================================

  const getDraftSummary = useCallback((draft: EvaluationDraft): string => {
    const parts: string[] = [];
    
    if (draft.title && draft.title !== 'Évaluation sans titre') {
      parts.push(draft.title);
    }
    
    if (draft.data.subject) {
      parts.push(draft.data.subject);
    }
    
    if (draft.data.type) {
      parts.push(draft.data.type);
    }
    
    if (draft.selectedTemplate) {
      parts.push(`(${draft.selectedTemplate.name})`);
    }
    
    return parts.length > 0 ? parts.join(' - ') : 'Brouillon sans titre';
  }, []);

  const getProgressPercentage = useCallback((currentStep: number): number => {
    // 5 étapes au total (0-4)
    return Math.round((currentStep / 4) * 100);
  }, []);

  // ========================================
  // NETTOYAGE À LA FERMETURE
  // ========================================

  const cleanup = useCallback(() => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = null;
    }
  }, []);

  // Nettoyage automatique à l'initialisation
  useEffect(() => {
    // Nettoyer les brouillons de plus de 30 jours au démarrage
    const removed = cleanupOldDrafts(30);
    if (removed > 0) {
      console.log(`${removed} brouillon(s) obsolète(s) supprimé(s)`);
    }

    return cleanup;
  }, [cleanupOldDrafts, cleanup]);

  // ========================================
  // RÉSULTAT
  // ========================================

  return {
    // Actions principales
    saveDraft,
    loadDraft,
    deleteDraft,
    
    // Récupération
    getDraftsForClass,
    getAllDraftsWithDetails,
    
    // Utilitaires
    getDraftSummary,
    getProgressPercentage,
    cleanupOldDrafts,
    
    // Nettoyage
    cleanup
  };
}

export default useDraftSave;
