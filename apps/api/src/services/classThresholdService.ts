import { PrismaClient } from '@prisma/client';

export interface ClassThresholdData {
  classId: number;
  userId: number;
  moyenneAdmission: number;
  moyenneRedoublement: number;
  maxNote: number;
}

export class ClassThresholdService {
  constructor(private prisma: PrismaClient) {}

  /**
   * Récupère les seuils d'une classe
   */
  async getByClassId(classId: number) {
    const threshold = await (this.prisma as any).class_thresholds.findUnique({
      where: { class_id: classId },
      include: {
        classes: {
          select: {
            id: true,
            name: true,
          }
        },
        users: {
          select: {
            id: true,
            email: true,
            first_name: true,
            last_name: true
          }
        }
      }
    });
    
    if (!threshold) return null;
    
    // Transformer en camelCase pour le frontend
    return {
      id: threshold.id,
      classId: threshold.class_id,
      userId: threshold.user_id,
      moyenneAdmission: parseFloat(threshold.moyenne_admission.toString()),
      moyenneRedoublement: parseFloat(threshold.moyenne_redoublement.toString()),
      maxNote: threshold.max_note,
      createdAt: threshold.created_at,
      updatedAt: threshold.updated_at,
      class: threshold.classes ? {
        id: threshold.classes.id,
        name: threshold.classes.name,
      } : null,
      user: threshold.users ? {
        id: threshold.users.id,
        email: threshold.users.email,
        firstName: threshold.users.first_name,
        lastName: threshold.users.last_name
      } : null
    };
  }

  /**
   * Crée les seuils pour une classe
   */
  async create(data: ClassThresholdData) {
    // Vérifier que la classe existe
    const classExists = await (this.prisma as any).classes.findUnique({
      where: { id: data.classId }
    });

    if (!classExists) {
      throw new Error('Classe non trouvée');
    }

    // Vérifier qu'il n'existe pas déjà des seuils pour cette classe
    const existingThreshold = await (this.prisma as any).class_thresholds.findUnique({
      where: { class_id: data.classId }
    });

    if (existingThreshold) {
      throw new Error('Des seuils existent déjà pour cette classe');
    }

    const threshold = await (this.prisma as any).class_thresholds.create({
      data: {
        class_id: data.classId,
        user_id: data.userId,
        moyenne_admission: data.moyenneAdmission,
        moyenne_redoublement: data.moyenneRedoublement,
        max_note: data.maxNote
      },
      include: {
        classes: {
          select: {
            id: true,
            name: true,
          }
        },
        users: {
          select: {
            id: true,
            email: true,
            first_name: true,
            last_name: true
          }
        }
      }
    });
    
    // Transformer en camelCase pour le frontend
    return {
      id: threshold.id,
      classId: threshold.class_id,
      userId: threshold.user_id,
      moyenneAdmission: parseFloat(threshold.moyenne_admission.toString()),
      moyenneRedoublement: parseFloat(threshold.moyenne_redoublement.toString()),
      maxNote: threshold.max_note,
      createdAt: threshold.created_at,
      updatedAt: threshold.updated_at,
      class: threshold.classes ? {
        id: threshold.classes.id,
        name: threshold.classes.name,
      } : null,
      user: threshold.users ? {
        id: threshold.users.id,
        email: threshold.users.email,
        firstName: threshold.users.first_name,
        lastName: threshold.users.last_name
      } : null
    };
  }

  /**
   * Met à jour les seuils d'une classe
   */
  async update(classId: number, data: ClassThresholdData) {
    // Vérifier que les seuils existent
    const existingThreshold = await (this.prisma as any).class_thresholds.findUnique({
      where: { class_id: classId }
    });

    if (!existingThreshold) {
      throw new Error('Seuils non trouvés pour cette classe');
    }

    const threshold = await (this.prisma as any).class_thresholds.update({
      where: { class_id: classId },
      data: {
        moyenne_admission: data.moyenneAdmission,
        moyenne_redoublement: data.moyenneRedoublement,
        max_note: data.maxNote
      },
      include: {
        classes: {
          select: {
            id: true,
            name: true,
          }
        },
        users: {
          select: {
            id: true,
            email: true,
            first_name: true,
            last_name: true
          }
        }
      }
    });
    
    // Transformer en camelCase pour le frontend
    return {
      id: threshold.id,
      classId: threshold.class_id,
      userId: threshold.user_id,
      moyenneAdmission: parseFloat(threshold.moyenne_admission.toString()),
      moyenneRedoublement: parseFloat(threshold.moyenne_redoublement.toString()),
      maxNote: threshold.max_note,
      createdAt: threshold.created_at,
      updatedAt: threshold.updated_at,
      class: threshold.classes ? {
        id: threshold.classes.id,
        name: threshold.classes.name,
      } : null,
      user: threshold.users ? {
        id: threshold.users.id,
        email: threshold.users.email,
        firstName: threshold.users.first_name,
        lastName: threshold.users.last_name
      } : null
    };
  }

  /**
   * Supprime les seuils d'une classe
   */
  async delete(classId: number) {
    return await (this.prisma as any).class_thresholds.delete({
      where: { class_id: classId }
    });
  }

  /**
   * Récupère tous les seuils
   */
  async getAll() {
    const thresholds = await (this.prisma as any).class_thresholds.findMany({
      include: {
        classes: {
          select: {
            id: true,
            name: true,
          }
        },
        users: {
          select: {
            id: true,
            email: true,
            first_name: true,
            last_name: true
          }
        }
      }
    });
    
    // Transformer en camelCase pour le frontend
    return thresholds.map((threshold: any) => ({
      id: threshold.id,
      classId: threshold.class_id,
      userId: threshold.user_id,
      moyenneAdmission: parseFloat(threshold.moyenne_admission.toString()),
      moyenneRedoublement: parseFloat(threshold.moyenne_redoublement.toString()),
      maxNote: threshold.max_note,
      createdAt: threshold.created_at,
      updatedAt: threshold.updated_at,
      class: threshold.classes ? {
        id: threshold.classes.id,
        name: threshold.classes.name,
      } : null,
      user: threshold.users ? {
        id: threshold.users.id,
        email: threshold.users.email,
        firstName: threshold.users.first_name,
        lastName: threshold.users.last_name
      } : null
    }));
  }
}

