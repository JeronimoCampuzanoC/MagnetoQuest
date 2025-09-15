// client/src/api/trivia.ts
const API = "http://localhost:4000"; // tu API Node

async function post<T>(path: string, body: unknown): Promise<T> {
  const r = await fetch(`${API}${path}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!r.ok) throw new Error(await r.text());
  return r.json();
}

export type StartRes = { pregunta: string; nivel: string };
export const startTrivia = (session_id: string, area = "coding", nivel = "facil") =>
  post<StartRes>("/api/quiz/start", { session_id, area, nivel });

export const nextTriviaQuestion = (session_id: string) =>
  post<StartRes>("/api/quiz/next", { session_id });

export type GradeRes = {
  resultado: {
    correcto: boolean;
    score: number;
    modelo_referencia: string;
    puntos_clave_faltantes: string[];
    feedback_breve: string;
    sugerencia_siguiente_pregunta: string;
  };
  nivel: string;
  score: string;
};
export const gradeTrivia = (session_id: string, pregunta: string, respuesta: string) =>
  post<GradeRes>("/api/quiz/grade", { session_id, pregunta, respuesta });
