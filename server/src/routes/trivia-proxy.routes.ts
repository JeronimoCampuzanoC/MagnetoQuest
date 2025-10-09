// server/src/routes/trivia-proxy.routes.ts

import { Router, Request, Response } from 'express';
import axios from 'axios';

const router = Router();

// URL del microservicio de trivia
const TRIVIA_SERVICE_URL = process.env.TRIVIA_SERVICE_URL || 'http://localhost:4001';

/**
 * POST /api/trivia/start
 * Proxy para iniciar una nueva trivia
 */
router.post('/start', async (req: Request, res: Response) => {
  try {
    const response = await axios.post(`${TRIVIA_SERVICE_URL}/api/trivia/start`, req.body, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    res.status(response.status).json(response.data);
  } catch (error) {
    if (axios.isAxiosError(error) && error.response) {
      res.status(error.response.status).json(error.response.data);
    } else {
      res.status(500).json({
        error: 'Error al comunicarse con el servicio de trivia',
        details: error instanceof Error ? error.message : 'Error desconocido'
      });
    }
  }
});

/**
 * POST /api/trivia/answer/:sessionId
 * Proxy para enviar una respuesta
 */
router.post('/answer/:sessionId', async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params;
    const response = await axios.post(
      `${TRIVIA_SERVICE_URL}/api/trivia/answer/${sessionId}`,
      req.body,
      {
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
    
    res.status(response.status).json(response.data);
  } catch (error) {
    if (axios.isAxiosError(error) && error.response) {
      res.status(error.response.status).json(error.response.data);
    } else {
      res.status(500).json({
        error: 'Error al comunicarse con el servicio de trivia',
        details: error instanceof Error ? error.message : 'Error desconocido'
      });
    }
  }
});

/**
 * GET /api/trivia/results/:sessionId
 * Proxy para obtener resultados finales
 */
router.get('/results/:sessionId', async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params;
    const response = await axios.get(`${TRIVIA_SERVICE_URL}/api/trivia/results/${sessionId}`);
    
    res.status(response.status).json(response.data);
  } catch (error) {
    if (axios.isAxiosError(error) && error.response) {
      res.status(error.response.status).json(error.response.data);
    } else {
      res.status(500).json({
        error: 'Error al comunicarse con el servicio de trivia',
        details: error instanceof Error ? error.message : 'Error desconocido'
      });
    }
  }
});

/**
 * GET /api/trivia/progress/:sessionId
 * Proxy para obtener el progreso actual
 */
router.get('/progress/:sessionId', async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params;
    const response = await axios.get(`${TRIVIA_SERVICE_URL}/api/trivia/progress/${sessionId}`);
    
    res.status(response.status).json(response.data);
  } catch (error) {
    if (axios.isAxiosError(error) && error.response) {
      res.status(error.response.status).json(error.response.data);
    } else {
      res.status(500).json({
        error: 'Error al comunicarse con el servicio de trivia',
        details: error instanceof Error ? error.message : 'Error desconocido'
      });
    }
  }
});

/**
 * DELETE /api/trivia/session/:sessionId
 * Proxy para cancelar una sesión
 */
router.delete('/session/:sessionId', async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params;
    const response = await axios.delete(`${TRIVIA_SERVICE_URL}/api/trivia/session/${sessionId}`);
    
    res.status(response.status).json(response.data);
  } catch (error) {
    if (axios.isAxiosError(error) && error.response) {
      res.status(error.response.status).json(error.response.data);
    } else {
      res.status(500).json({
        error: 'Error al comunicarse con el servicio de trivia',
        details: error instanceof Error ? error.message : 'Error desconocido'
      });
    }
  }
});

export default router;
