import os, json, re
from dataclasses import dataclass, field
from typing import List, Dict
from pydantic import BaseModel, Field
from langchain_community.chat_models import ChatOllama
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import JsonOutputParser

# === Modo rápido (menos tokens / menos historial) ===
FAST_MODE = True
HIST_MAX_TURNS = 2 if FAST_MODE else 5
NUM_PREDICT_Q = 128 if FAST_MODE else 256
NUM_PREDICT_G = 196 if FAST_MODE else 320

# === Conexión a Ollama (en Docker: host "ollama") ===
OLLAMA_URL = os.getenv("OLLAMA_BASE_URL", "http://ollama:11434")
OLLAMA_MODEL = os.getenv("OLLAMA_MODEL", "llama3.1")

llm_q = ChatOllama(
    base_url=OLLAMA_URL,
    model=OLLAMA_MODEL,
    temperature=0.1,
    model_kwargs={"num_ctx": 2048, "num_predict": NUM_PREDICT_Q, "repeat_penalty": 1.05},
)
llm_g = ChatOllama(
    base_url=OLLAMA_URL,
    model=OLLAMA_MODEL,
    temperature=0.1,
    model_kwargs={"num_ctx": 2048, "num_predict": NUM_PREDICT_G, "repeat_penalty": 1.05},
)

# === Estado de la sesión ===
@dataclass
class EstadoSesion:
    area: str = "coding"         # coding | system_design | behavioral
    nivel: str = "facil"         # facil | medio | dificil
    historial: List[Dict[str, str]] = field(default_factory=list)
    preguntas_hechas: int = 0
    correctas: int = 0
    def aciertos_ratio(self) -> float:
        return (self.correctas / self.preguntas_hechas) if self.preguntas_hechas else 0.0
    def ajustar_nivel(self):
        r = self.aciertos_ratio()
        if r >= 0.8 and self.nivel != "dificil":
            self.nivel = "dificil" if self.nivel == "medio" else "medio"
        elif r <= 0.4 and self.nivel != "facil":
            self.nivel = "medio" if self.nivel == "dificil" else "facil"

# === Temario + rúbricas resumidas ===
TEMARIO = {
    "coding": ["arrays/strings", "hash maps", "stacks/queues", "árboles", "grafos", "backtracking", "DP básica"],
    "system_design": ["requisitos", "APIs", "datos SQL/NoSQL", "caché/particionado", "consistencia", "colas", "observabilidad"],
    "behavioral": ["STAR", "feedback", "ownership", "aprendizaje de fallos"],
}
RUBRICAS = {
    "coding": "Enfoque correcto; complejidad; casos borde; claridad y trade-offs. Score>=0.7 = correcto.",
    "system_design": "Requisitos; APIs/datos; escalabilidad; consistencia/fallos; trade-offs. Score>=0.7 = correcto.",
    "behavioral": "STAR claro; resultados; aprendizaje; comunicación. Score>=0.7 = correcto.",
}

class GradingResult(BaseModel):
    correcto: bool = Field(...)
    score: float = Field(..., ge=0, le=1)
    modelo_referencia: str = Field(...)
    puntos_clave_faltantes: List[str] = Field(default_factory=list)
    feedback_breve: str = Field(...)
    sugerencia_siguiente_pregunta: str = Field(default="")

grading_parser = JsonOutputParser(pydantic_object=GradingResult)

# === Prompts ===
prompt_generador = ChatPromptTemplate.from_messages([
    ("system", "Eres coach de entrevistas de SOFTWARE. Genera UNA pregunta breve y situacional. Máximo 25 palabras. No des la respuesta."),
    ("human", "Area: {area}\nNivel: {nivel}\nTemario: {temas}\nHistorial (últimos {hist_turns}):\n{resumen}\n\nGenera la siguiente pregunta.")
])
prompt_grader = ChatPromptTemplate.from_messages([
    ("system", "Eres evaluador. Usa la rúbrica del área. Score en [0,1]; >=0.7 es correcto. Devuelve SOLO JSON."),
    ("human", "AREA: {area}\nRUBRICA:\n{rubrica}\n\nPREGUNTA: {pregunta}\nRESPUESTA: {respuesta}\nNIVEL: {nivel}\n\nFormato JSON: {format_instructions}")
])

def _resumir(hist: List[Dict[str, str]], max_turnos=HIST_MAX_TURNS) -> str:
    ult = hist[-max_turnos:]; txt=[]
    for h in ult:
        rol = "U" if h["rol"]=="user" else "A"
        t = h["texto"][:180] + ("…" if len(h["texto"])>180 else "")
        txt.append(f"{rol}: {t}")
    return "\n".join(txt) if txt else "—"

def generar_pregunta(estado: EstadoSesion) -> str:
    temas = "; ".join(TEMARIO.get(estado.area, []))
    resumen = _resumir(estado.historial, max_turnos=HIST_MAX_TURNS)
    msg = prompt_generador.format_messages(area=estado.area, nivel=estado.nivel, temas=temas, resumen=resumen, hist_turns=HIST_MAX_TURNS)
    out = llm_q.invoke(msg)
    q = (out.content or "").strip()
    if not q.endswith("?"): q += "?"
    return q

def evaluar_respuesta(pregunta: str, respuesta: str, estado: EstadoSesion) -> GradingResult:
    msg = prompt_grader.format_messages(area=estado.area, rubrica=RUBRICAS.get(estado.area, ""), pregunta=pregunta,
                                        respuesta=respuesta, nivel=estado.nivel, format_instructions=grading_parser.get_format_instructions())
    out = llm_g.invoke(msg)
    txt = (out.content or "").strip()
    try:
        parsed = grading_parser.parse(txt)
    except Exception:
        m = re.search(r"\{.*\}", txt, flags=re.S)
        parsed = grading_parser.parse(m.group(0)) if m else {"correcto": False, "score": 0.0,
            "modelo_referencia":"", "puntos_clave_faltantes": [], "feedback_breve":"No se pudo evaluar.", "sugerencia_siguiente_pregunta":""}
    if isinstance(parsed, dict):
        parsed = GradingResult(**parsed)
    return parsed
