import 'dotenv/config';   // <- carga .env
const AGENT_URL = process.env.AGENT_URL || 'http://localhost:8010';

async function post<T>(path: string, body: unknown, signal?: AbortSignal): Promise<T> {
  const res = await fetch(`${AGENT_URL}${path}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
    signal,
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Agent ${path} ${res.status}: ${text || res.statusText}`);
  }
  return res.json() as Promise<T>;
}

export type StartReq = { session_id: string; area?: 'coding'|'system_design'|'behavioral'; nivel?: 'facil'|'medio'|'dificil' };
export type StartRes = { pregunta: string; nivel: string };
export const agentStart = (b: StartReq, s?: AbortSignal) => post<StartRes>('/agent/start', b, s);

export type NextReq = { session_id: string };
export type NextRes = { pregunta: string; nivel: string };
export const agentNext = (b: NextReq, s?: AbortSignal) => post<NextRes>('/agent/next', b, s);

export type GradeReq = { session_id: string; pregunta: string; respuesta: string };
export type GradeRes = { resultado: {
  correcto: boolean; score: number; modelo_referencia: string;
  puntos_clave_faltantes: string[]; feedback_breve: string; sugerencia_siguiente_pregunta: string;
}, nivel: string, score: string };
export const agentGrade = (b: GradeReq, s?: AbortSignal) => post<GradeRes>('/agent/grade', b, s);
