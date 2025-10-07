from __future__ import annotations
import os, hashlib, json, re
from typing import List, Dict, Any

from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_community.embeddings import OllamaEmbeddings
from langchain_community.chat_models import ChatOllama
from langchain_community.vectorstores import Chroma
from langchain_community.docstore.document import Document
from langchain.prompts import ChatPromptTemplate
from langchain.schema import StrOutputParser

# --- Config ---
CHUNK_SIZE = int(os.getenv("CHUNK_SIZE", "1100"))
CHUNK_OVERLAP = int(os.getenv("CHUNK_OVERLAP", "120"))
MODEL_NAME = os.getenv("MODEL_NAME", "llama3.1:8b")
OLLAMA_BASE_URL = os.getenv("OLLAMA_BASE_URL", "http://host.docker.internal:11434")
EMBEDDINGS_MODEL = os.getenv("EMBEDDINGS_MODEL", "nomic-embed-text")

class RAGIndex:
    """Índice por topic_id en Chroma (persistente)."""
    def __init__(self, chroma_dir: str):
        self.chroma_dir = chroma_dir
        os.makedirs(chroma_dir, exist_ok=True)
        self.emb = OllamaEmbeddings(model=EMBEDDINGS_MODEL, base_url=OLLAMA_BASE_URL)
        self._collections: Dict[str, Chroma] = {}

    def _collection_name(self, topic_id: str) -> str:
        return f"rag_{topic_id}"

    def index_topic(self, topic_id: str, version: int, sources: List[dict]):
        """Split + embeddings → Chroma. Reemplaza la colección cuando sube versión."""
        splitter = RecursiveCharacterTextSplitter(
            chunk_size=CHUNK_SIZE,
            chunk_overlap=CHUNK_OVERLAP,
            separators=["\n\n", "\n", ". ", ", ", " "]
        )
        docs: List[Document] = []
        for s in sources:
            content = s["content"]
            title = s.get("title") or ""
            chunks = splitter.split_text(content)
            for idx, ch in enumerate(chunks):
                uid = hashlib.sha1(f"{topic_id}:{s['source_id']}:{version}:{idx}".encode()).hexdigest()
                meta = {"topic_id": topic_id, "source_id": s["source_id"], "title": title, "version": version, "chunk_idx": idx}
                docs.append(Document(page_content=ch, metadata=meta))

        # recrea la colección (MVP simple)
        cname = self._collection_name(topic_id)
        try:
            Chroma(persist_directory=self.chroma_dir, collection_name=cname)._client.delete_collection(cname)
        except Exception:
            pass

        vs = Chroma.from_documents(
            documents=docs,
            embedding=self.emb,
            persist_directory=self.chroma_dir,
            collection_name=cname
        )
        self._collections[topic_id] = vs

    def as_retriever(self, topic_id: str):
        """Retriever MMR (similar/diverso) para ese tópico."""
        vs = self._collections.get(topic_id) or Chroma(
            persist_directory=self.chroma_dir,
            collection_name=self._collection_name(topic_id),
            embedding_function=self.emb
        )
        self._collections[topic_id] = vs
        return vs.as_retriever(
            search_type="mmr",
            search_kwargs={"k": 5, "fetch_k": 20, "lambda_mult": 0.7}
        )

class RAGRuntime:
    """Generar 5 preguntas y evaluar 5 respuestas abiertas (LLM-as-judge)."""
    def __init__(self):
        # más determinista
        self.llm = ChatOllama(model=MODEL_NAME, temperature=0.0, base_url=OLLAMA_BASE_URL)

    def _extract_json(self, text: str) -> dict:
        import json, re
        fence = re.search(r"```json\s*(\{.*?\})\s*```", text, re.DOTALL)
        if fence:
            try:
                return json.loads(fence.group(1))
            except Exception:
                pass
        brace = re.search(r"\{.*\}", text, re.DOTALL)
        if brace:
            try:
                return json.loads(brace.group(0))
            except Exception:
                pass
        from langchain.prompts import ChatPromptTemplate
        from langchain.schema import StrOutputParser
        repair_prompt = ChatPromptTemplate.from_messages([
            ("system", "Devuelve SOLO JSON válido estrictamente parseable por json.loads en Python."),
            ("user", "{raw}")
        ])
        repaired = (repair_prompt | self.llm | StrOutputParser()).invoke({"raw": text})
        try:
            return json.loads(repaired)
        except Exception:
            return {"items": []}

    # ---- Generación de 5 preguntas con grounding (ESCAPAR LLAVES) ----
    def generate_5(self, retriever, topic_id: str, count: int = 5):
        docs = retriever.get_relevant_documents(f"Temas clave del tópico {topic_id}")
        context = "\n\n".join([d.page_content[:1200] for d in docs])

        from langchain.prompts import ChatPromptTemplate
        from langchain.schema import StrOutputParser

        system_text = (
            "Eres autor de trivias rigurosas. Devuelve SOLO JSON válido (sin markdown) con esta forma exacta:\n"
            "{{ \"items\": [ {{\"question\":\"...\",\"answer_gold\":\"...\","
            "\"key_points\":[\"...\"],\"explanation\":\"...\",\"difficulty\":\"facil|media|dificil\"}} ] }}\n"
            "No incluyas texto adicional fuera del JSON."
        )
        prompt = ChatPromptTemplate.from_messages([
            ("system", system_text),
            ("user", "CONTEXTO:\n{ctx}\n\nGenera exactamente {n} preguntas ahora.")
        ])
        chain = prompt | self.llm | StrOutputParser()
        raw = chain.invoke({"ctx": context, "n": count})

        data = self._extract_json(raw)
        items = data.get("items", [])
        if len(items) < count:
            items = items[:count] + [{"question":"", "answer_gold":"", "key_points":[], "explanation":"", "difficulty":"media"}] * (count - len(items))
        return items[:count]

    # ---- Scoring de 5 respuestas abiertas → entero 0–100 (ESCAPAR LLAVES) ----
    def score_open_answers(self, items, answers, retriever) -> int:
        packed = []
        for i, it in enumerate(items):
            q = it["question"]; gold = it["answer_gold"]; keys = it.get("key_points", [])
            docs = retriever.get_relevant_documents(q)[:3]
            ctx = "\n\n".join(d.page_content[:600] for d in docs)
            packed.append({
                "q": q, "gold": gold, "keys": keys,
                "ctx": ctx, "user": (answers[i] if i < len(answers) else "")
            })

        from langchain.prompts import ChatPromptTemplate
        from langchain.schema import StrOutputParser

        system_text = (
            "Eres un evaluador con rúbrica: exactitud 40, cobertura de puntos clave 40, claridad 20. "
            "Para CADA ítem devuelve un score ∈ [0,1] (número, máx 2 decimales). "
            "Responde SOLO JSON: {{\"scores\":[n1,n2,n3,n4,n5]}}"
        )
        prompt = ChatPromptTemplate.from_messages([
            ("system", system_text),
            ("user", "{bundle}")
        ])
        chain = prompt | self.llm | StrOutputParser()
        import json
        raw = chain.invoke({"bundle": json.dumps(packed, ensure_ascii=False)})
        try:
            scores = json.loads(raw).get("scores", [])
        except Exception:
            scores = []
        scores = [float(s) if isinstance(s, (int, float, str)) else 0.0 for s in scores][:5]
        scores += [0.0] * (5 - len(scores))
        final = int(round(sum(scores) / 5 * 100))
        return max(0, min(100, final))
    
    def score_one(self, item, answer: str, retriever, show_solution: bool = True):
        """
        item: dict con question, answer_gold, key_points, explanation, difficulty
        answer: respuesta libre del usuario
        """
        # 1) Contexto específico para la pregunta
        q = item.get("question", "")
        gold = item.get("answer_gold", "")
        keys = item.get("key_points", []) or []
        docs = retriever.invoke(q)[:3]  # MMR, top-3
        ctx = "\n\n".join(d.page_content[:600] for d in docs)

        # 2) Prompt con JSON estrictamente escapado
        from langchain.prompts import ChatPromptTemplate
        from langchain.schema import StrOutputParser
        import json

        system_text = (
            "Eres un evaluador de respuestas cortas. Devuelve SOLO JSON válido con esta forma exacta:\n"
            "{{"
            "  \"score_item\": 0.0, "
            "  \"rubric\": {{\"exactitud\": 0.0, \"cobertura\": 0.0, \"claridad\": 0.0}}, "
            "  \"feedback\": {{\"fortalezas\": [], \"faltantes\": [], \"sugerencias\": []}}, "
            "  \"solution\": {{\"show_solution\": true, \"answer_gold\": \"\", \"explanation\": \"\"}}"
            "}}\n"
            "Reglas: 'score_item' ∈ [0,1]. Rúbrica: exactitud 40%, cobertura de key_points 40%, claridad 20%."
            " Usa SOLO el CONTEXTO y los key_points dados. No inventes datos fuera del contexto."
        )
        user_text = (
            "CONTEXTO:\n{ctx}\n\n"
            "PREGUNTA:\n{q}\n\n"
            "GOLD (resumen correcto):\n{gold}\n\n"
            "KEY_POINTS (deben estar cubiertos):\n{keys}\n\n"
            "RESPUESTA_USUARIO:\n{ans}\n\n"
            "show_solution={show_sol}"
        )

        prompt = ChatPromptTemplate.from_messages([
            ("system", system_text),
            ("user", user_text)
        ])
        chain = prompt | self.llm | StrOutputParser()
        raw = chain.invoke({
            "ctx": ctx,
            "q": q,
            "gold": gold,
            "keys": json.dumps(keys, ensure_ascii=False),
            "ans": answer,
            "show_sol": "true" if show_solution else "false"
        })

        # 3) Parseo robusto (reutiliza _extract_json si lo tienes)
        try:
            data = self._extract_json(raw)
        except Exception:
            data = {}
        # Normalización y defaults seguros
        rubric = data.get("rubric", {}) or {}
        feedback = data.get("feedback", {}) or {}
        solution = data.get("solution", {}) or {}

        score_item = data.get("score_item", 0.0)
        try:
            score_item = float(score_item)
        except Exception:
            score_item = 0.0
        score_item = max(0.0, min(1.0, score_item))
        score_percent = int(round(score_item * 100))

        # Honrar show_solution del request (forzar ocultar si false)
        if not show_solution:
            solution = {"show_solution": False, "answer_gold": None, "explanation": None}
        else:
            solution = {
                "show_solution": True,
                "answer_gold": solution.get("answer_gold", gold),
                "explanation": solution.get("explanation", item.get("explanation", "")),
            }

        # Completar estructuras
        rubric = {
            "exactitud": float(rubric.get("exactitud", 0.0)),
            "cobertura": float(rubric.get("cobertura", 0.0)),
            "claridad": float(rubric.get("claridad", 0.0)),
        }
        feedback = {
            "fortalezas": feedback.get("fortalezas", []) or [],
            "faltantes": feedback.get("faltantes", []) or [],
            "sugerencias": feedback.get("sugerencias", []) or [],
        }

        return {
            "score_item": score_item,
            "score_item_percent": score_percent,
            "rubric": rubric,
            "feedback": feedback,
            "solution": solution
        }
