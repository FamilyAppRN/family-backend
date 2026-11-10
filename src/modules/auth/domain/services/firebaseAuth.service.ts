import admin from 'firebase-admin';
import { OAuth2Client } from 'google-auth-library';
import jwksRsa from 'jwks-rsa';
import jwt from 'jsonwebtoken';
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

export interface GoogleTokenPayload {
  iss?: string;
  azp?: string;
  aud?: string;
  sub?: string;
  email?: string;
  email_verified?: boolean;
  name?: string;
  picture?: string;
  given_name?: string;
  family_name?: string;
  iat?: number;
  exp?: number;
  auth_time?: number;
  nonce?: string;
  hd?: string;
}

export interface AppleTokenPayload {
  iss: string;
  aud: string | string[];
  exp: number;
  iat: number;
  sub: string;
  c_hash?: string;
  email?: string;
  email_verified?: boolean;
  is_private_email?: boolean;
  auth_time?: number;
  nonce?: string;
  nonce_supported?: boolean;
  name?: {
    firstName?: string;
    lastName?: string;
  };
}

export class FirebaseAuthService {
  private static getApiKey(): string {
    return ENV.FIREBASE_API_KEY;
  }

  private static getGoogleClient(): OAuth2Client {
    return new OAuth2Client(ENV.GOOGLE_CLIENT_ID);
  }

  private static getAppleJwksClient() {
    return jwksRsa({
      jwksUri: 'https://appleid.apple.com/auth/keys',
      cache: true,
      rateLimit: true,
      jwksRequestsPerMinute: 10,
    });
  }

  /**
   * Verifica un ID token de Google y devuelve su payload.
   */
  static async verifyGoogleIdToken(idToken: string): Promise<GoogleTokenPayload> {
    try {
      const client = this.getGoogleClient();
      const ticket = await client.verifyIdToken({
        idToken,
        audience: ENV.GOOGLE_CLIENT_ID,
      });
      const payload = ticket.getPayload();
      if (!payload) {
        throw new ApplicationError(401, 'Invalid Google token: No payload', 'INVALID_GOOGLE_TOKEN', 'AUTHENTICATION');
      }
      return payload;
    } catch (error: any) {
      if (error instanceof ApplicationError) {
        throw error;
      }
      throw new ApplicationError(401, `Invalid Google token: ${error.message}`, 'INVALID_GOOGLE_TOKEN', 'AUTHENTICATION');
    }
  }

  /**
   * Verifica un identity token de Apple y devuelve su payload.
   */
  static async verifyAppleIdentityToken(identityToken: string): Promise<AppleTokenPayload> {
    try {
      const jwksClient = this.getAppleJwksClient();
      const decodedHeader = jwt.decode(identityToken, { complete: true }) as any;
      if (!decodedHeader || !decodedHeader.header) {
        throw new ApplicationError(401, 'Invalid Apple token: Unable to decode token', 'INVALID_APPLE_TOKEN', 'AUTHENTICATION');
      }

      const signingKey = await jwksClient.getSigningKey(decodedHeader.header.kid);
      const publicKey = signingKey.getPublicKey();

      const payload = jwt.verify(identityToken, publicKey, {
        algorithms: ['RS256'],
        audience: ENV.APPLE_SERVICE_ID,
        issuer: 'https://appleid.apple.com',
      }) as AppleTokenPayload;

      return payload;
    } catch (error: any) {
      if (error instanceof ApplicationError) {
        throw error;
      }
      if (error.name === 'JsonWebTokenError') {
        throw new ApplicationError(401, `Invalid Apple token: ${error.message}`, 'INVALID_APPLE_TOKEN', 'AUTHENTICATION');
      }
      if (error.name === 'TokenExpiredError' || error.name === 'NotBeforeError') {
        throw new ApplicationError(401, `Expired Apple token: ${error.message}`, 'EXPIRED_APPLE_TOKEN', 'AUTHENTICATION');
      }
      throw new ApplicationError(500, `Error verifying Apple token: ${error.message}`, 'APPLE_VERIFICATION_ERROR', 'INTERNAL');
    }
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
   * Inicia sesión usando un token personalizado de Firebase.
   * Similar a signIn pero usando un custom token en vez de email/password.
   */
  static async signInWithCustomToken(customToken: string): Promise<FirebaseSignInResult> {
    const apiKey = this.getApiKey();
    const url = `https://identitytoolkit.googleapis.com/v1/accounts:signInWithCustomToken?key=${apiKey}`;

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: customToken,
          returnSecureToken: true,
        }),
      });

      if (!response.ok) {
        const errorData = (await response.json().catch(() => ({}))) as any;
        const message = errorData.error?.message;
        if (message === 'INVALID_ID_TOKEN' || message === 'INVALID_CUSTOM_TOKEN') {
          throw new ApplicationError(401, 'Token personalizado inválido', 'INVALID_CUSTOM_TOKEN', 'AUTHENTICATION');
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