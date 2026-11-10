import { createServer, type IncomingMessage, type ServerResponse } from 'node:http';
import { toNodeHandler } from 'srvx/node';
import { app } from './app.js';
import { connectDB } from './config/db.js';
import { initSocket } from './config/socket.js';
import { registerSocketEvents } from './sockets/index.js';
import { ENV } from './config/env.js';
import { initFirebase } from './config/firebase.js';
import { startTaskReminderCron } from './jobs/taskReminders.js';

/**
 * Un solo servidor HTTP para la API y el tiempo real (Render expone un único
 * puerto). Elysia atiende las peticiones normales vía srvx, igual que su
 * adaptador de Node; Socket.IO se cuelga del mismo servidor y solo toma
 * /socket.io/. No se usa app.listen() porque ese servidor (crossws) también
 * intercepta los upgrades de WebSocket y competiría con Socket.IO.
 */
async function bootstrap() {
  try {
    await connectDB();
    initFirebase();
    startTaskReminderCron();

    // srvx tipa la petición como HTTP/1 y HTTP/2 a la vez; este servidor es HTTP/1.
    const handleHttp = toNodeHandler(app.fetch as Parameters<typeof toNodeHandler>[0]) as unknown as (
      req: IncomingMessage,
      res: ServerResponse,
    ) => Promise<unknown>;
    const httpServer = createServer((req, res) => {
      void handleHttp(req, res);
    });

    const io = initSocket(httpServer);
    registerSocketEvents(io);

    httpServer.listen(ENV.PORT, '0.0.0.0', () => {
      console.log(`🦊 API y Socket.IO escuchando en http://0.0.0.0:${ENV.PORT}`);
    });
  } catch (error) {
    console.error('❌ Server bootstrap failed:', error);
    process.exit(1);
  }
}

bootstrap();
