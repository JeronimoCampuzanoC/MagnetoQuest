// server/src/index.ts
import express, { Request, Response } from 'express'; // ← TS: import con tipos
import cors from 'cors';
import path from 'path';

const app = express();
app.use(express.json());
app.use(cors());

// TS: define un tipo para la respuesta del endpoint
interface HelloResponse {
  message: string;
  timestamp: number;
}

// TS: tipa explícitamente Request y Response
app.get('/api/hello', (_req: Request, res: Response<HelloResponse>) => {
  res.json({ message: '¡Hola desde el backend con Express + TS!', timestamp: Date.now() });
  console.log("Mensaje enviado")
});

const PORT = Number(process.env.PORT) || 4000; // TS: conversión a number

app.listen(PORT, () => {
  console.log(`✅ API escuchando en http://localhost:${PORT}`);
});
