from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
import os

from schemas import (
    HealthResponse, TopicsResponse, GenerateRequest, GenerateResponse,
    ScoreRequest, ScoreResponse, IngestRequest, Topic,
    ScoreOneRequest, ScoreOneResponse   
)

from adapters import DocAdapter
from rag_core import RAGIndex, RAGRuntime

load_dotenv()

api = FastAPI(title="RAG Trivia API (Ollama)", version="mvp-1")

# CORS: en prod limita a tu dominio (server/cliente)
api.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # ajusta en prod
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Singletons (MVP)
adapter = DocAdapter()
index = RAGIndex(chroma_dir=os.getenv("CHROMA_DIR", "/data/chroma"))
runtime = RAGRuntime()

@api.get("/health", response_model=HealthResponse)
def health():
    return HealthResponse()

@api.get("/topics", response_model=TopicsResponse)
def topics():
    t = [Topic(id=t.topic_id, name=t.name, lang=t.lang, version=t.version) for t in adapter.list_topics()]
    return TopicsResponse(topics=t)

@api.post("/ingest")
def ingest(req: IngestRequest):
    # agrega fuentes de texto y reindexa el tópico
    try:
        td = adapter.add_sources(req.topic_id, [s.model_dump() for s in req.sources], bump_version=req.bump_version)
    except KeyError:
        raise HTTPException(404, "topic_id no existe")
    sources = [s.__dict__ for s in td.sources]
    if not sources:
        raise HTTPException(400, "No hay fuentes para indexar")
    index.index_topic(td.topic_id, td.version, sources)
    return {"status": "ok", "topic_id": td.topic_id, "version": td.version, "sources_count": len(td.sources)}

@api.post("/trivia/generate", response_model=GenerateResponse)
def generate(req: GenerateRequest):
    td = next((t for t in adapter.list_topics() if t.topic_id == req.topic_id), None)
    if not td:
        raise HTTPException(404, "topic_id no existe")
    # Garantizar índice
    if req.topic_id not in index._collections:
        sources = [s.__dict__ for s in td.sources]
        if not sources:
            raise HTTPException(404, "El tópico no tiene fuentes cargadas aún. Usa /ingest.")
        index.index_topic(td.topic_id, td.version, sources)
    retriever = index.as_retriever(req.topic_id)
    items = runtime.generate_5(retriever, req.topic_id, count=req.count)
    if len(items) < req.count:  # intenta completar
        items += runtime.generate_5(retriever, req.topic_id, count=req.count - len(items))
        items = items[:req.count]
    return GenerateResponse(topic_id=req.topic_id, version=td.version, items=items)

@api.post("/trivia/score", response_model=ScoreResponse)
def score(req: ScoreRequest):
    if len(req.answers) != 5 or len(req.items) != 5:
        raise HTTPException(400, "Se requieren exactamente 5 respuestas y 5 items.")
    if req.topic_id not in index._collections:
        td = next((t for t in adapter.list_topics() if t.topic_id == req.topic_id), None)
        if not td or not td.sources:
            raise HTTPException(404, "No hay índice ni fuentes para este topic.")
        index.index_topic(td.topic_id, td.version, [s.__dict__ for s in td.sources])
    retriever = index.as_retriever(req.topic_id)
    final = runtime.score_open_answers([i.model_dump() for i in req.items], req.answers, retriever)
    return ScoreResponse(score=final)

@api.post("/trivia/score-one", response_model=ScoreOneResponse)
def score_one(req: ScoreOneRequest):
    # Asegurar que exista índice para el topic (igual que en /trivia/score)
    if req.topic_id not in index._collections:
        td = next((t for t in adapter.list_topics() if t.topic_id == req.topic_id), None)
        if not td or not td.sources:
            raise HTTPException(404, "No hay índice ni fuentes para este topic.")
        index.index_topic(td.topic_id, td.version, [s.__dict__ for s in td.sources])

    retriever = index.as_retriever(req.topic_id)
    # Ejecutar evaluación de UNA respuesta con feedback
    result = runtime.score_one(
        item=req.item.model_dump(),
        answer=req.answer,
        retriever=retriever,
        show_solution=req.show_solution
    )
    return result
