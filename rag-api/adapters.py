from __future__ import annotations
from typing import Dict, List
from dataclasses import dataclass, field
import uuid

@dataclass
class Source:
    source_id: str
    title: str
    content: str

@dataclass
class TopicData:
    topic_id: str
    name: str
    lang: str = "es"
    version: int = 1
    sources: List[Source] = field(default_factory=list)

class DocAdapter:
    """Mantiene en memoria los tópicos y sus fuentes (Doc RAG)."""
    def __init__(self):
        self.topics: Dict[str, TopicData] = {}
        # Preparamos dos tópicos base (puedes cambiarlos)
        self.ensure_topic("codigo", "Código y buenas prácticas")
        self.ensure_topic("habilidades_blandas", "Habilidades blandas para equipos")

    def ensure_topic(self, topic_id: str, name: str, lang: str = "es"):
        if topic_id not in self.topics:
            self.topics[topic_id] = TopicData(topic_id=topic_id, name=name, lang=lang)

    def list_topics(self) -> List[TopicData]:
        return list(self.topics.values())

    def add_sources(self, topic_id: str, texts: List[dict], bump_version: bool = True) -> TopicData:
        if topic_id not in self.topics:
            raise KeyError("topic_id no existe")
        td = self.topics[topic_id]
        for t in texts:
            s = Source(source_id=str(uuid.uuid4()), title=t.get("title") or "", content=t["content"])
            td.sources.append(s)
        if bump_version:
            td.version += 1
        return td

