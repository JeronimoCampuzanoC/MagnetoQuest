import 'reflect-metadata';
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { AppDataSource } from './db/data-source';
import { User } from './entities/User';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json()); // ← necesario para leer req.body

app.get('/api/hello', async (_req, res)=>{
  res.json({message:"Hola desde el back"})
  console.log("Mensaje enviado");
});


// LISTAR usuarios
app.get('/api/users', async (_req, res) => {
  try {
    const repo = AppDataSource.getRepository(User);
    const users = await repo.find({ order: { id: 'ASC' } });
    res.json(users);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'DB error' });
  }
});

// CREAR usuario
app.post('/api/users', async (req, res) => {
  try {
    const { name } = req.body ?? {};
    if (typeof name !== 'string' || !name.trim()) {
      return res.status(400).json({ error: 'name requerido' });
    }
    const repo = AppDataSource.getRepository(User);
    const user = repo.create({ name: name.trim() });
    await repo.save(user);
    res.status(201).json(user);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'DB error' });
  }
});

const PORT = process.env.PORT || 4000;

// Inicializa TypeORM y arranca el server
AppDataSource.initialize()
  .then(() => {
    console.log('✅ TypeORM conectado');
    app.listen(PORT, () => console.log(`API http://localhost:${PORT}`));
  })
  .catch((err) => {
    console.error('❌ Error al conectar TypeORM', err);
    process.exit(1);
  });

/* 👇 SI SIRVES FRONT ESTÁTICO, PONLO AL FINAL (después de las rutas /api)
import path from 'path'; import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url); const __dirname = path.dirname(__filename);
const clientDir = path.join(__dirname, '..', '..', 'client');
app.use(express.static(clientDir));
app.get('*', (_req, res) => res.sendFile(path.join(clientDir, 'index.html')));
*/
