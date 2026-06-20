import mongoose from 'mongoose';
import { ENV } from './env.js';
import '../models/index.js';

const MAX_RETRIES = 5;
const RETRY_INTERVAL_MS = 5000;

export async function connectDB(): Promise<void> {
  let attempt = 1;

  while (attempt <= MAX_RETRIES) {
    try {
      console.log(`Connecting to MongoDB (Attempt ${attempt}/${MAX_RETRIES})...`);
      await mongoose.connect(ENV.MONGODB_URI);
      console.log('✅ MongoDB connected successfully.');
      return;
    } catch (error) {
      console.error(`❌ MongoDB connection failed (Attempt ${attempt}/${MAX_RETRIES}):`, error);
      attempt++;
      if (attempt <= MAX_RETRIES) {
        console.log(`Retrying in ${RETRY_INTERVAL_MS / 1000}s...`);
        await new Promise((resolve) => setTimeout(resolve, RETRY_INTERVAL_MS));
      }
    }
  }

  console.error('❌ Failed to connect to MongoDB after maximum retry attempts. Exiting...');
  process.exit(1);
}

export async function disconnectDB(): Promise<void> {
  await mongoose.disconnect();
  console.log('🔌 MongoDB disconnected.');
}
