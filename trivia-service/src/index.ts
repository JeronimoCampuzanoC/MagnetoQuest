// trivia-service/src/index.ts

import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import triviaRoutes from './routes/trivia.routes';

// Cargar variables de entorno
dotenv.config();

const app: Application = express();
const PORT = process.env.PORT || 4001;

// ==================== MIDDLEWARES ====================

// CORS - Permitir peticiones desde el server principal y el cliente
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:4000'],
  credentials: true
}));

// Body parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Logger simple
app.use((req: Request, _res: Response, next: NextFunction) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// ==================== RUTAS ====================

// Health check
app.get('/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    service: 'trivia-service',
    timestamp: new Date().toISOString(),
    openaiConfigured: !!process.env.OPENAI_API_KEY
  });
});

// Rutas del agente de trivia
app.use('/api/trivia', triviaRoutes);

// Ruta 404
app.use((req: Request, res: Response) => {
  res.status(404).json({
    error: 'Endpoint no encontrado',
    path: req.path,
    method: req.method
  });
});

// ==================== ERROR HANDLER ====================

app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error('Error:', err);
  res.status(500).json({
    error: 'Error interno del servidor',
    message: err.message,
    service: 'trivia-service'
  });
});

// ==================== INICIAR SERVIDOR ====================

app.listen(PORT, () => {
  console.log('\n🚀 ========================================');
  console.log(`   TRIVIA SERVICE iniciado correctamente`);
  console.log(`   Puerto: ${PORT}`);
  console.log(`   Entorno: ${process.env.NODE_ENV || 'development'}`);
  console.log(`   OpenAI configurado: ${process.env.OPENAI_API_KEY ? '✅ Sí' : '❌ No'}`);
  console.log('========================================\n');
  console.log(`📡 Health check: http://localhost:${PORT}/health`);
  console.log(`🎯 API Trivia: http://localhost:${PORT}/api/trivia`);
  console.log('\n✨ Listo para recibir peticiones...\n');
});

export default app;