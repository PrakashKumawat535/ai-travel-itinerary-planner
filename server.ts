import express from 'express';
import path from 'path';
import cors from 'cors';
import helmet from 'helmet';
import { createServer as createViteServer } from 'vite';
import authRoutes from './backend/routes/authRoutes';
import tripRoutes from './backend/routes/tripRoutes';
import { apiRateLimiter } from './backend/middlewares/rateLimiter';
import { connectMongoDB, getDatabaseInfo } from './backend/config/db';
import { globalErrorHandler } from './backend/middlewares/errorMiddleware';

async function startServer() {
  const app = express();
  
  // Set Express 'trust proxy' so it works correctly under current Cloud Run sandboxed proxy routes
  app.set('trust proxy', 1);
  const PORT = 3000;

  // Initialize DB Connection (Attempts MongoDB if MONGODB_URI is provided, otherwise falls back gracefully to local db.json)
  await connectMongoDB();

  // Use Helmet middleware with dynamic relaxed CSP to let internal Vite HMR / sandboxed frames load
  app.use(helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false
  }));

  // CORS Config supporting secure CLIENT_URL configurations
  const clientUrl = process.env.CLIENT_URL;
  app.use(cors({
    origin: (origin, callback) => {
      if (!clientUrl || process.env.NODE_ENV !== 'production') {
        callback(null, true);
      } else {
        const allowedOrigins = clientUrl.split(',').map(url => url.trim());
        if (!origin || allowedOrigins.includes(origin)) {
          callback(null, true);
        } else {
          callback(new Error('Blocked by security policy (CORS)'), false);
        }
      }
    },
    credentials: true
  }));

  // Configure high-volume body parsing to accept base64 PDFs and Image document payloads
  app.use(express.json({ limit: '15mb' }));
  app.use(express.urlencoded({ limit: '15mb', extended: true }));

  // Set health API
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', datetime: new Date().toISOString() });
  });

  // DB connection status API
  app.get('/api/db-status', (req, res) => {
    res.json(getDatabaseInfo());
  });

  // Apply Rate limiter to all APIs
  app.use('/api', apiRateLimiter);

  // Link App Routers
  app.use('/api/auth', authRoutes);
  app.use('/api/trips', tripRoutes);

  // Global Error Handler Middleware
  app.use(globalErrorHandler);

  // Vite development middleware vs Static Production bundle
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server fully operative and listening on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((error) => {
  console.error('Critical Server Crash on Startup:', error);
});
