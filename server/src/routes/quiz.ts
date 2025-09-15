import { Router } from 'express';
import { agentStart, agentNext, agentGrade } from '../services/agent';

const router = Router();

router.post('/start', async (req, res) => {
  try { res.json(await agentStart(req.body)); }
  catch (e: any) { res.status(502).json({ error: e.message }); }
});

router.post('/next', async (req, res) => {
  try { res.json(await agentNext(req.body)); }
  catch (e: any) { res.status(502).json({ error: e.message }); }
});

router.post('/grade', async (req, res) => {
  try { res.json(await agentGrade(req.body)); }
  catch (e: any) { res.status(502).json({ error: e.message }); }
});

export default router;
