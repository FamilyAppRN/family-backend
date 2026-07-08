import admin from 'firebase-admin';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

export const initFirebase = () => {
  try {
    if (!admin.apps.length) {
      // Use the credentials path from env or fallback to the file in the root
      const serviceAccountPath = process.env.GOOGLE_APPLICATION_CREDENTIALS || './gestia-530cc-firebase-adminsdk-fbsvc-469a38db8c.json';
      const serviceAccount = JSON.parse(
        readFileSync(resolve(process.cwd(), serviceAccountPath), 'utf-8')
      );

      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });
      console.log('✅ Firebase Admin initialized successfully');
    }
  } catch (error) {
    console.error('❌ Failed to initialize Firebase Admin:', error);
  }
};
