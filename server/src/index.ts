import 'reflect-metadata';
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { AppDataSource } from './db/data-source';
import { AppUser } from './entities/AppUser';
import { Project } from './entities/Project';
import { Certificate } from './entities/Certificate';
import { Mission } from './entities/Mission';
import { Badge } from './entities/Badge';
import { BadgeProgress } from './entities/BadgeProgress';
import { NotificationLog } from './entities/NotificationLog';
import { Resume } from './entities/Resume';
import { TriviaAttempt } from './entities/TriviaAttempt';
import { TriviaQuestion } from './entities/TriviaQuestion';
import { UserMissionProgress } from './entities/UserMissionProgress';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json()); // ← necesario para leer req.body


app.get('/api/hello', async (_req, res)=>{
  res.json({message:"Hola desde el back"})
  console.log("Mensaje enviado");
});


// LISTAR misiones
app.get('/users/:userId/missions-in-progress', async (req, res) => {
  const { userId } = req.params;

  const qb = AppDataSource.getRepository(UserMissionProgress)
    .createQueryBuilder('ump')
    .innerJoin('ump.mission', 'm')
    .select([
      'm.mission_id AS id',
      'm.title       AS text',
      "CASE WHEN ump.status = 'in_progress' THEN TRUE ELSE FALSE END AS active",
    ])
    .where('ump.user_id = :userId', { userId })
    .andWhere("ump.status = 'in_progress'")      // ← solo en progreso
    .orderBy('m.created_at', 'DESC');

  const result = await qb.getRawMany(); // ya sale con { id, text, active }
  res.json(result);
});

// LISTAR usuarios
app.get('/api/appusers', async (_req, res) => {
  try {
    const repo = AppDataSource.getRepository(AppUser);
    const users = await repo.find({ order: { id_app_user: 'ASC' } });
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
    const repo = AppDataSource.getRepository(AppUser);
    const user = repo.create({ name: name.trim() });
    await repo.save(user);
    res.status(201).json(user);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'DB error' });
  }
});

// CREAR proyecto
app.post('/api/projects', async (req, res) => {
  try {
    const { name, description, projectDate, url, userId } = req.body ?? {};
    
    // Validate required fields
    if (typeof name !== 'string' || !name.trim()) {
      return res.status(400).json({ error: 'name requerido' });
    }
    
    // For now, we'll use a default user ID if not provided
    // In a real app, you'd get this from authentication
    const defaultUserId = 'd6d6389b-783e-4a44-9e47-fbdaa0201e4d'; // Replace with actual user logic
    const projectUserId = userId || defaultUserId;
    
    const repo = AppDataSource.getRepository(Project);
    const project = repo.create({
      title: name.trim(),
      description: description?.trim() || '',
      url: url?.trim() || null,
      user_id: projectUserId
    });
    
    if (projectDate) {
      project.project_date = new Date(projectDate);
    }
    
    await repo.save(project);
    res.status(201).json(project);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'DB error' });
  }
});

// LISTAR proyectos
app.get('/api/projects', async (req, res) => {
  try {
    const { userId } = req.query;
    const repo = AppDataSource.getRepository(Project);
    
    let projects;
    if (userId) {
      projects = await repo.find({ 
        where: { user_id: userId as string },
        order: { project_id: 'ASC' }
      });
    } else {
      projects = await repo.find({ order: { project_id: 'ASC' } });
    }
    
    res.json(projects);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'DB error' });
  }
});

// ACTUALIZAR proyecto
app.put('/api/projects/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, projectDate, url } = req.body ?? {};
    
    if (!id) {
      return res.status(400).json({ error: 'ID de proyecto requerido' });
    }
    
    if (typeof name !== 'string' || !name.trim()) {
      return res.status(400).json({ error: 'name requerido' });
    }
    
    const repo = AppDataSource.getRepository(Project);
    const project = await repo.findOne({ where: { project_id: id } });
    
    if (!project) {
      return res.status(404).json({ error: 'Proyecto no encontrado' });
    }
    
    // Update project fields
    project.title = name.trim();
    project.description = description?.trim() || '';
    project.url = url?.trim() || null;
    
    if (projectDate) {
      project.project_date = new Date(projectDate);
    } else {
      project.project_date = null;
    }
    
    await repo.save(project);
    res.json(project);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'DB error' });
  }
});

// ELIMINAR proyecto
app.delete('/api/projects/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!id) {
      return res.status(400).json({ error: 'ID de proyecto requerido' });
    }
    
    const repo = AppDataSource.getRepository(Project);
    const project = await repo.findOne({ where: { project_id: id } });
    
    if (!project) {
      return res.status(404).json({ error: 'Proyecto no encontrado' });
    }
    
    await repo.remove(project);
    res.json({ message: 'Proyecto eliminado correctamente' });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'DB error' });
  }
});

// CREAR certificado
app.post('/api/certificates', async (req, res) => {
  try {
    const { name, description, userId } = req.body ?? {};
    
    // Validate required fields
    if (typeof name !== 'string' || !name.trim()) {
      return res.status(400).json({ error: 'name requerido' });
    }
    
    // For now, we'll use a default user ID if not provided
    // In a real app, you'd get this from authentication
    const defaultUserId = 'd6d6389b-783e-4a44-9e47-fbdaa0201e4d'; // Replace with actual user logic
    const certificateUserId = userId || defaultUserId;
    
    const repo = AppDataSource.getRepository(Certificate);
    const certificate = repo.create({
      title: name.trim(),
      description: description?.trim() || '',
      user_id: certificateUserId
    });
    
    await repo.save(certificate);
    res.status(201).json(certificate);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'DB error' });
  }
});

// LISTAR certificados
app.get('/api/certificates', async (req, res) => {
  try {
    const { userId } = req.query;
    const repo = AppDataSource.getRepository(Certificate);
    
    let certificates;
    if (userId) {
      certificates = await repo.find({ 
        where: { user_id: userId as string },
        order: { certificate_id: 'ASC' }
      });
    } else {
      certificates = await repo.find({ order: { certificate_id: 'ASC' } });
    }
    
    res.json(certificates);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'DB error' });
  }
});

// ACTUALIZAR certificado
app.put('/api/certificates/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description } = req.body ?? {};
    
    if (!id) {
      return res.status(400).json({ error: 'ID de certificado requerido' });
    }
    
    if (typeof name !== 'string' || !name.trim()) {
      return res.status(400).json({ error: 'name requerido' });
    }
    
    const repo = AppDataSource.getRepository(Certificate);
    const certificate = await repo.findOne({ where: { certificate_id: id } });
    
    if (!certificate) {
      return res.status(404).json({ error: 'Certificado no encontrado' });
    }
    
    // Update certificate fields
    certificate.title = name.trim();
    certificate.description = description?.trim() || '';
    
    await repo.save(certificate);
    res.json(certificate);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'DB error' });
  }
});

// ELIMINAR certificado
app.delete('/api/certificates/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!id) {
      return res.status(400).json({ error: 'ID de certificado requerido' });
    }
    
    const repo = AppDataSource.getRepository(Certificate);
    const certificate = await repo.findOne({ where: { certificate_id: id } });
    
    if (!certificate) {
      return res.status(404).json({ error: 'Certificado no encontrado' });
    }
    
    await repo.remove(certificate);
    res.json({ message: 'Certificado eliminado correctamente' });
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
