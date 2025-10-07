from pydantic import BaseModel, Field
from typing import List, Optional

class Topic(BaseModel):
    id: str
    name: str
    lang: str = "es"
    version: int = 1

class TopicsResponse(BaseModel):
    topics: List[Topic]

class Citation(BaseModel):
    source_id: str
    title: Optional[str] = None
    loc: Optional[str] = None
    snippet: Optional[str] = None

class TriviaItem(BaseModel):
    question: str
    answer_gold: str
    key_points: List[str] = []
    explanation: Optional[str] = None
    difficulty: str = "media"
    citations: List[Citation] = []

class GenerateRequest(BaseModel):
    topic_id: str
    count: int = Field(default=5, ge=1, le=10)
    difficulty_mix: str = "auto"

class GenerateResponse(BaseModel):
    topic_id: str
    version: int
    items: List[TriviaItem]

class ScoreRequest(BaseModel):
    topic_id: str
    answers: List[str]
    items: List[TriviaItem]

class ScoreResponse(BaseModel):
    score: int

class IngestSource(BaseModel):
    title: Optional[str] = None
    content: str

class IngestRequest(BaseModel):
    topic_id: str
    sources: List[IngestSource]
    bump_version: bool = True

class HealthResponse(BaseModel):
    status: str = "ok"
    version: str = "mvp-1"
    vector_backend: str = "chroma"


class Rubric(BaseModel):
    exactitud: float
    cobertura: float
    claridad: float

class Feedback(BaseModel):
    fortalezas: List[str] = []
    faltantes: List[str] = []
    sugerencias: List[str] = []

class Solution(BaseModel):
    show_solution: bool = True
    answer_gold: Optional[str] = None
    explanation: Optional[str] = None

class ScoreOneRequest(BaseModel):
    topic_id: str
    item: TriviaItem
    answer: str
    show_solution: bool = True

class ScoreOneResponse(BaseModel):
    score_item: float                # 0..1
    score_item_percent: int          # 0..100
    rubric: Rubric
    feedback: Feedback
    solution: Solution