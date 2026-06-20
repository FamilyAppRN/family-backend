import { app } from './app.js';
import { connectDB } from './config/db.js';
import { connectRedis } from './config/redis.js';
import { initSocket } from './config/socket.js';
import { registerSocketEvents } from './sockets/index.js';
import { ENV } from './config/env.js';
import { Server as HttpServer } from 'http';

async function bootstrap() {
  try {
    // 1. Connect databases
    await connectDB();
    connectRedis();

    // 2. Start Elysia Server using the Node.js adapter
    app.listen(ENV.PORT, (server: any) => {
      console.log(`🦊 Elysia server running on Node.js at http://localhost:${ENV.PORT}`);

      const nodeServer = server?.node?.server;
      if (!nodeServer) {
        console.error('❌ Failed to retrieve the underlying Node HTTP Server.');
        process.exit(1);
      }

      // 3. Initialize Socket.IO, passing the underlying HTTP server instance
      const io = initSocket(nodeServer as unknown as HttpServer);
      registerSocketEvents(io);
      console.log('✅ Socket.IO events registered successfully.');
    });

  } catch (error) {
    console.error('❌ Server bootstrap failed:', error);
    process.exit(1);
  }
}

bootstrap();
