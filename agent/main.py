from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from agent import EstadoSesion, generar_pregunta, evaluar_respuesta

app = FastAPI(title="Agent Python (Ollama)")
# CORS solo para dev; ajusta el origen de tu front si es otro
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_methods=["*"], allow_headers=["*"]
)

SESSIONS = {}  # demo: en prod usa Redis/DB

class StartReq(BaseModel):
    session_id: str
    area: str = "coding"
    nivel: str = "facil"

class NextReq(BaseModel):
    session_id: str

class GradeReq(BaseModel):
    session_id: str
    pregunta: str
    respuesta: str

def _get(sid: str) -> EstadoSesion:
    est = SESSIONS.get(sid)
    if not est:
        raise HTTPException(404, "Sesión no encontrada. Usa /agent/start.")
    return est

@app.post("/agent/start")
def start(r: StartReq):
    SESSIONS[r.session_id] = EstadoSesion(area=r.area, nivel=r.nivel)
    q = generar_pregunta(SESSIONS[r.session_id])
    return {"pregunta": q, "nivel": SESSIONS[r.session_id].nivel}

@app.post("/agent/next")
def next_q(r: NextReq):
    est = _get(r.session_id)
    q = generar_pregunta(est)
    return {"pregunta": q, "nivel": est.nivel}

@app.post("/agent/grade")
def grade(r: GradeReq):
    est = _get(r.session_id)
    res = evaluar_respuesta(r.pregunta, r.respuesta, est)
    est.preguntas_hechas += 1
    if res.correcto: est.correctas += 1
    est.ajustar_nivel()
    return {"resultado": res.dict(), "nivel": est.nivel, "score": f"{est.correctas}/{est.preguntas_hechas}"}
