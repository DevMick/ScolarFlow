import { Response } from 'express';
import type { ApiResponse } from '@edustats/shared';

export class ApiResponseHelper {
  static success<T>(res: Response, data: T, message = 'Succès', statusCode = 200): Response {
    const response: ApiResponse<T> = {
      success: true,
      data,
      message,
    };
    return res.status(statusCode).json(response);
  }

  static error(res: Response, message: string, statusCode = 400, errors?: string[]): Response {
    const response: ApiResponse = {
      success: false,
      message,
      errors,
    };
    return res.status(statusCode).json(response);
  }

  static badRequest(res: Response, message = 'Requête invalide'): Response {
    return this.error(res, message, 400);
  }

  static unauthorized(res: Response, message = 'Non autorisé'): Response {
    return this.error(res, message, 401);
  }

  static forbidden(res: Response, message = 'Accès interdit'): Response {
    return this.error(res, message, 403);
  }

  static notFound(res: Response, message = 'Ressource non trouvée'): Response {
    return this.error(res, message, 404);
  }

  static validationError(res: Response, errors: string[], message = 'Données invalides'): Response {
    return this.error(res, message, 400, errors);
  }

  static serverError(res: Response, message = 'Erreur serveur interne'): Response {
    return this.error(res, message, 500);
  }
}
