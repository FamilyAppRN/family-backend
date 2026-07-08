import admin from 'firebase-admin';
import { ENV } from '../../../../config/env.js';
import { ApplicationError } from '../../../../shared/domain/error.js';

export interface FirebaseSignInResult {
  idToken: string;
  refreshToken: string;
  uid: string;
}

export interface FirebaseRefreshResult {
  idToken: string;
  refreshToken: string;
}

export class FirebaseAuthService {
  private static getApiKey(): string {
    return ENV.FIREBASE_API_KEY;
  }

  /**
   * Crea un usuario en Firebase Authentication usando el Admin SDK.
   */
  static async createUser(email: string, password: string, name?: string): Promise<string> {
    try {
      const userRecord = await admin.auth().createUser({
        email,
        password,
        displayName: name,
      });
      return userRecord.uid;
    } catch (error: any) {
      // Firebase throws specific errors. E.g. email already exists.
      if (error.code === 'auth/email-already-exists') {
        throw new ApplicationError(409, 'El correo electrónico ya está registrado', 'EMAIL_ALREADY_EXISTS', 'CONFLICT');
      }
      if (error.code === 'auth/invalid-password') {
        throw new ApplicationError(400, 'La contraseña debe tener al menos 6 caracteres', 'INVALID_PASSWORD', 'VALIDATION');
      }
      throw new ApplicationError(500, `Error al crear usuario en Firebase: ${error.message}`, 'FIREBASE_ERROR', 'INTERNAL');
    }
  }

  /**
   * Inicia sesión usando la Firebase Auth REST API (signInWithPassword).
   */
  static async signIn(email: string, password: string): Promise<FirebaseSignInResult> {
    const apiKey = this.getApiKey();
    const url = `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${apiKey}`;

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          password,
          returnSecureToken: true,
        }),
      });

      if (!response.ok) {
        const errorData = (await response.json().catch(() => ({}))) as any;
        const message = errorData.error?.message;
        if (message === 'EMAIL_NOT_FOUND' || message === 'INVALID_PASSWORD') {
          throw new ApplicationError(401, 'Credenciales inválidas', 'INVALID_CREDENTIALS', 'AUTHENTICATION');
        }
        if (message === 'USER_DISABLED') {
          throw new ApplicationError(403, 'El usuario ha sido deshabilitado', 'USER_DISABLED', 'AUTHENTICATION');
        }
        throw new ApplicationError(401, `Error de autenticación: ${message || response.statusText}`, 'AUTH_ERROR', 'AUTHENTICATION');
      }

      const data = await response.json() as any;
      return {
        idToken: data.idToken,
        refreshToken: data.refreshToken,
        uid: data.localId,
      };
    } catch (error: any) {
      if (error instanceof ApplicationError) {
        throw error;
      }
      throw new ApplicationError(500, `Error de comunicación con el servicio de autenticación: ${error.message}`, 'AUTH_SERVICE_ERROR', 'INTERNAL');
    }
  }

  /**
   * Renueva el idToken de Firebase usando el refresh token.
   */
  static async refreshToken(refreshToken: string): Promise<FirebaseRefreshResult> {
    const apiKey = this.getApiKey();
    const url = `https://securetoken.googleapis.com/v1/token?key=${apiKey}`;

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          grant_type: 'refresh_token',
          refresh_token: refreshToken,
        }).toString(),
      });

      if (!response.ok) {
        const errorData = (await response.json().catch(() => ({}))) as any;
        const message = errorData.error?.message;
        throw new ApplicationError(401, `Token inválido o expirado: ${message || response.statusText}`, 'INVALID_TOKEN', 'AUTHENTICATION');
      }

      const data = await response.json() as any;
      return {
        idToken: data.id_token,
        refreshToken: data.refresh_token || refreshToken, // fallback al mismo token si no se regeneró
      };
    } catch (error: any) {
      if (error instanceof ApplicationError) {
        throw error;
      }
      throw new ApplicationError(500, `Error al renovar token: ${error.message}`, 'AUTH_SERVICE_ERROR', 'INTERNAL');
    }
  }

  /**
   * Revoca todos los refresh tokens de un usuario.
   */
  static async revokeTokens(uid: string): Promise<void> {
    try {
      await admin.auth().revokeRefreshTokens(uid);
    } catch (error: any) {
      throw new ApplicationError(500, `Error al cerrar sesión: ${error.message}`, 'FIREBASE_ERROR', 'INTERNAL');
    }
  }

  /**
   * Elimina un usuario de Firebase (útil para rollback).
   */
  static async deleteUser(uid: string): Promise<void> {
    try {
      await admin.auth().deleteUser(uid);
    } catch (error: any) {
      console.error(`[Rollback Failed] No se pudo eliminar el usuario de Firebase (${uid}):`, error);
    }
  }
}
