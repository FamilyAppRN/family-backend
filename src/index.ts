import { app } from './app.js';
import { connectDB } from './config/db.js';
import { connectRedis } from './config/redis.js';
import { initSocket } from './config/socket.js';
import { registerSocketEvents } from './sockets/index.js';
import { ENV } from './config/env.js';
import { createServer } from 'node:http';
import { initFirebase } from './config/firebase.js';

async function bootstrap() {
  try {
    // 1. Connect databases
    await connectDB();
    // connectRedis();

    // Initialize Firebase Admin
    initFirebase();

    // 2. Start Elysia on the primary port
    app.listen(ENV.PORT, () => {
      console.log(`🦊 Elysia API server running on http://localhost:${ENV.PORT}`);
    });

    // 3. Create a separate Node HTTP server for Socket.IO on port 5000
    // const socketPort = 5000;
    // const socketHttpServer = createServer();
    // const io = initSocket(socketHttpServer as any);
    // registerSocketEvents(io);

    // socketHttpServer.listen(socketPort, () => {
    //   console.log(`🔌 Socket.IO server running on http://localhost:${socketPort}`);
    // });

  } catch (error) {
    console.error('❌ Server bootstrap failed:', error);
    process.exit(1);
  }
}

bootstrap();
