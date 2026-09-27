import { defineConfig, Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);

function firebaseApiPlugin(): Plugin {
  return {
    name: 'firebase-api-plugin',
    configureServer(server) {
      const firebaseService = require('./server/firebaseService.cjs');

      server.middlewares.use(async (req, res, next) => {
        if (!req.url || !req.url.startsWith('/api/')) {
          return next();
        }

        const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
        const pathname = url.pathname;
        const method = req.method?.toUpperCase();

        const sendJson = (status: number, data: any) => {
          res.writeHead(status, {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          });
          res.end(JSON.stringify(data));
        };

        const readBody = (): Promise<any> => {
          return new Promise((resolve) => {
            let body = '';
            req.on('data', (chunk) => (body += chunk));
            req.on('end', () => {
              try {
                resolve(body ? JSON.parse(body) : {});
              } catch {
                resolve({});
              }
            });
          });
        };

        try {
          if (pathname === '/api/stats' && method === 'GET') {
            const date = url.searchParams.get('date') || undefined;
            const view = url.searchParams.get('view') || undefined;
            const stats = await firebaseService.getStats({ date, view });
            return sendJson(200, { success: true, stats });
          }

          if (pathname === '/api/dates' && method === 'GET') {
            const dates = await firebaseService.getAvailableDates();
            return sendJson(200, { success: true, dates });
          }

          if (pathname === '/api/members' && method === 'GET') {
            const members = await firebaseService.getMembers();
            return sendJson(200, { success: true, members });
          }

          if (pathname === '/api/members' && method === 'POST') {
            const body = await readBody();
            const member = await firebaseService.addMember(body.name);
            return sendJson(200, { success: true, member });
          }

          if (pathname.startsWith('/api/members/') && method === 'DELETE') {
            const memberId = pathname.replace('/api/members/', '');
            const result = await firebaseService.deleteMember(memberId);
            return sendJson(200, { success: true, ...result });
          }

          if (pathname === '/api/members/sync' && method === 'POST') {
            const body = await readBody();
            const members = await firebaseService.syncMembers(body.playerNames || []);
            return sendJson(200, { success: true, members });
          }

          if (pathname === '/api/matches' && method === 'POST') {
            const body = await readBody();
            const result = await firebaseService.recordMatch(body);
            return sendJson(200, { success: true, ...result });
          }

          return sendJson(404, { error: 'API endpoint not found' });
        } catch (err: any) {
          console.error('Firebase API Error:', err);
          return sendJson(500, { error: err.message || 'Internal Server Error' });
        }
      });
    }
  };
}

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), firebaseApiPlugin()],
  base: './', // Ensures relative asset paths work both on Vercel and in Android WebView
  server: {
    host: '0.0.0.0',
    port: 3000
  },
  build: {
    outDir: 'dist',
    sourcemap: false
  }
});

