import { app } from './app.js';
import { connectDB } from './config/db.js';
import { connectRedis } from './config/redis.js';
import { initSocket } from './config/socket.js';
import { registerSocketEvents } from './sockets/index.js';
import { ENV } from './config/env.js';
import { createServer } from 'node:http';

async function bootstrap() {
  try {
    // 1. Connect databases
    await connectDB();
    connectRedis();

    // 2. Create the Node HTTP server and pass Elysia's handle directly
    // (As suggested by the Elysia AI agent)
    const httpServer = createServer(app.handle as any);

    // 3. Attach socket.io
    const io = initSocket(httpServer as any);
    registerSocketEvents(io);

    // 4. Start listening
    httpServer.listen(ENV.PORT, () => {
      console.log(`🚀 Servidor HTTP + socket.io escuchando en http://localhost:${ENV.PORT}`);
    });

  } catch (error) {
    console.error('❌ Server bootstrap failed:', error);
    process.exit(1);
  }
}

bootstrap();
