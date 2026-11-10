import { UseCase } from '../../../shared/application/useCase.js';
import { AuthRepository } from '../domain/repositories/auth.repository.js';
import { appleLoginRequestSchema, authResponseSchema } from './schemas/auth.schemas.js';
import { FirebaseAuthService } from '../domain/services/firebaseAuth.service.js';
import { ApplicationError } from '../../../shared/domain/error.js';
import admin from 'firebase-admin';

export class AppleLoginUseCase extends UseCase<any, any> {
  protected inputSchema = appleLoginRequestSchema;
  protected outputSchema = authResponseSchema;

  constructor(private authRepository: AuthRepository) {
    super();
  }

  protected async implementation(data: any): Promise<any> {
    const { identityToken } = data;

    // 1. Verify Apple identity token
    const payload = await FirebaseAuthService.verifyAppleIdentityToken(identityToken);

    // 2. Extract user info from token
    const { email, name, sub: appleUserId } = payload;

    if (!email) {
      throw new ApplicationError(400, 'Apple token does not contain email', 'MISSING_EMAIL', 'VALIDATION');
    }

    // Extract name from Apple's name object
    let displayName = '';
    if (name) {
      const { firstName, lastName } = name;
      const parts = [firstName, lastName].filter(Boolean);
      displayName = parts.join(' ');
    }

    // 3. Check if user exists by email
    let user = await this.authRepository.findByEmail(email);
    let firebaseUid: string;

    if (user) {
      // User exists, get Firebase UID from user document
      firebaseUid = user.firebase_uid;
    } else {
      // 4. User does not exist, create new user
      // Generate a random password for Firebase (not stored)
      const randomPassword = Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-8);

      // Create Firebase user
      firebaseUid = await FirebaseAuthService.createUser(email, randomPassword, displayName);

      // Create user in MongoDB
      user = await this.authRepository.create({
        firebase_uid: firebaseUid,
        email,
        name: displayName,
        plan: 'free',
        notifications_enabled: true,
      });
    }

    // 5. Create custom token for the Firebase UID
    const customToken = await admin.auth().createCustomToken(firebaseUid);

    // 6. Exchange custom token for ID token and refresh token
    const tokens = await FirebaseAuthService.signInWithCustomToken(customToken);

    // 7. Return response in the expected format
    return {
      accessToken: tokens.idToken,
      refreshToken: tokens.refreshToken,
      user: {
        id: user.id,
        firebase_uid: user.firebase_uid,
        email: user.email,
        name: user.name,
        plan: user.plan,
        plan_expires_at: user.plan_expires_at,
        push_tokens: user.push_tokens,
        notifications_enabled: user.notifications_enabled,
        created_at: user.created_at,
        updated_at: user.updated_at,
      }
    };
  }
}