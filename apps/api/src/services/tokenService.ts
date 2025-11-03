import jwt from 'jsonwebtoken';
import { JWT_CONFIG, TOKEN_TYPES } from '../config/jwt';
import type { TokenPayload, RefreshTokenPayload } from '@edustats/shared';
import { Logger } from '../utils/logger';

export class TokenService {
  static generateAccessToken(payload: { userId: number; email: string }): string {
    try {
      const tokenPayload: TokenPayload = {
        userId: payload.userId,
        email: payload.email,
      };

      return jwt.sign(tokenPayload, JWT_CONFIG.secret, {
        expiresIn: JWT_CONFIG.expiresIn as string,
        algorithm: JWT_CONFIG.algorithm,
        issuer: JWT_CONFIG.issuer,
        audience: JWT_CONFIG.audience,
      } as any);
    } catch (error) {
      Logger.error('Error generating access token', error);
      throw new Error('Erreur lors de la génération du token');
    }
  }

  static generateRefreshToken(payload: { userId: number }): string {
    try {
      const tokenPayload: RefreshTokenPayload = {
        userId: payload.userId,
        tokenVersion: Date.now(), // Simple version system
      };

      return jwt.sign(tokenPayload, JWT_CONFIG.refreshSecret, {
        expiresIn: JWT_CONFIG.refreshExpiresIn as string,
        algorithm: JWT_CONFIG.algorithm,
        issuer: JWT_CONFIG.issuer,
        audience: JWT_CONFIG.audience,
      } as any);
    } catch (error) {
      Logger.error('Error generating refresh token', error);
      throw new Error('Erreur lors de la génération du token de rafraîchissement');
    }
  }

  static verifyAccessToken(token: string): TokenPayload {
    try {
      return jwt.verify(token, JWT_CONFIG.secret, {
        algorithms: [JWT_CONFIG.algorithm],
        issuer: JWT_CONFIG.issuer,
        audience: JWT_CONFIG.audience,
      }) as TokenPayload;
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        throw new Error('Token expiré');
      }
      if (error instanceof jwt.JsonWebTokenError) {
        throw new Error('Token invalide');
      }
      Logger.error('Error verifying access token', error);
      throw new Error('Erreur lors de la vérification du token');
    }
  }

  static verifyRefreshToken(token: string): RefreshTokenPayload {
    try {
      return jwt.verify(token, JWT_CONFIG.refreshSecret, {
        algorithms: [JWT_CONFIG.algorithm],
        issuer: JWT_CONFIG.issuer,
        audience: JWT_CONFIG.audience,
      }) as RefreshTokenPayload;
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        throw new Error('Token de rafraîchissement expiré');
      }
      if (error instanceof jwt.JsonWebTokenError) {
        throw new Error('Token de rafraîchissement invalide');
      }
      Logger.error('Error verifying refresh token', error);
      throw new Error('Erreur lors de la vérification du token de rafraîchissement');
    }
  }

  static getTokenExpiryTime(): number {
    // Return expiry time in seconds (24h = 86400s)
    return 24 * 60 * 60;
  }

  static extractTokenFromHeader(authHeader?: string): string | null {
    if (!authHeader) return null;
    
    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      return null;
    }
    
    return parts[1];
  }
}
