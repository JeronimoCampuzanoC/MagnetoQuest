import { useMemo, useState } from "react";
import { startTrivia, nextTriviaQuestion, gradeTrivia, type StartRes, type GradeRes } from "../api/trivia";

type Area = "coding" | "system_design" | "behavioral";
type Nivel = "facil" | "medio" | "dificil";

export default function TriviaPage() {
  const [area, setArea] = useState<Area>("coding");
  const [nivel, setNivel] = useState<Nivel>("facil");

  const [pregunta, setPregunta] = useState("");
  const [nivelActual, setNivelActual] = useState<Nivel>("facil");
  const [respuesta, setRespuesta] = useState("");
  const [resultado, setResultado] = useState<GradeRes | null>(null);

  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  // id único por pestaña
  const sessionId = useMemo(
    () => (crypto?.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2)),
    []
  );

  async function handleStart() {
    try {
      setErr(null); setLoading(true); setResultado(null); setRespuesta("");
      const r: StartRes = await startTrivia(sessionId, area, nivel);
      setPregunta(r.pregunta); setNivelActual(r.nivel as Nivel);
    } catch (e: any) { setErr(e.message || "Error al iniciar"); }
    finally { setLoading(false); }
  }

  async function handleGrade() {
    if (!pregunta || !respuesta.trim()) { setErr("Escribe tu respuesta."); return; }
    try {
      setErr(null); setLoading(true);
      const r = await gradeTrivia(sessionId, pregunta, respuesta);
      setResultado(r);
    } catch (e: any) { setErr(e.message || "Error al evaluar"); }
    finally { setLoading(false); }
  }

  async function handleNext() {
    try {
      setErr(null); setLoading(true); setResultado(null); setRespuesta("");
      const r = await nextTriviaQuestion(sessionId);
      setPregunta(r.pregunta); setNivelActual(r.nivel as Nivel);
    } catch (e: any) { setErr(e.message || "Error al pedir la siguiente pregunta"); }
    finally { setLoading(false); }
  }

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <h1 style={{ marginTop: 0 }}>Trivia de Entrevistas</h1>
        <p style={{ opacity: 0.7 }}>Sesión: <code>{sessionId}</code></p>

        {!pregunta ? (
          <>
            <div style={styles.row}>
              <label>Área:&nbsp;</label>
              <select value={area} onChange={(e) => setArea(e.target.value as Area)}>
                <option value="coding">coding</option>
                <option value="system_design">system_design</option>
                <option value="behavioral">behavioral</option>
              </select>
              <span style={{ width: 12 }} />
              <label>Nivel:&nbsp;</label>
              <select value={nivel} onChange={(e) => setNivel(e.target.value as Nivel)}>
                <option value="facil">facil</option>
                <option value="medio">medio</option>
                <option value="dificil">dificil</option>
              </select>
            </div>
            <button onClick={handleStart} disabled={loading} style={styles.btnPrimary}>
              {loading ? "Cargando…" : "Comenzar"}
            </button>
          </>
        ) : (
          <>
            <div style={{ fontSize: 12, opacity: 0.7 }}>Nivel actual: {nivelActual}</div>
            <h2 style={{ margin: "8px 0" }}>{pregunta}</h2>

            <textarea
              placeholder="Escribe tu respuesta…"
              value={respuesta}
              onChange={(e) => setRespuesta(e.target.value)}
              rows={6}
              style={styles.textarea}
            />
            <div style={styles.row}>
              <button onClick={handleGrade} disabled={loading || !respuesta.trim()} style={styles.btnPrimary}>
                {loading ? "Enviando…" : "Enviar respuesta"}
              </button>
              <button onClick={handleNext} disabled={loading} style={styles.btnGhost}>
                Siguiente pregunta
              </button>
            </div>
          </>
        )}

        {resultado && (
          <div style={styles.feedback}>
            <div style={{ fontWeight: 600, marginBottom: 8 }}>
              {resultado.resultado.correcto ? "✅ Correcto" : "❌ Incorrecto"} ·
              Score: {resultado.resultado.score.toFixed(2)} · Progreso: {resultado.score}
            </div>
            <div><strong>Feedback:</strong> {resultado.resultado.feedback_breve}</div>
            <div style={{ marginTop: 8 }}>
              <strong>Referencia:</strong>
              <div style={styles.ref}>{resultado.resultado.modelo_referencia}</div>
            </div>
            {!!resultado.resultado.puntos_clave_faltantes?.length && (
              <ul style={{ marginTop: 8 }}>
                {resultado.resultado.puntos_clave_faltantes.map((p, i) => <li key={i}>{p}</li>)}
              </ul>
            )}
          </div>
        )}

        {err && <div style={styles.error}>⚠️ {err}</div>}
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: { minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#0f172a", color: "#e2e8f0", padding: 16 },
  card: { width: "min(900px, 95vw)", background: "#111827", border: "1px solid #1f2937", borderRadius: 16, padding: 20 },
  row: { display: "flex", alignItems: "center", gap: 12, margin: "8px 0 12px" },
  textarea: { width: "100%", borderRadius: 12, border: "1px solid #334155", background: "#0b1220", color: "#e2e8f0", padding: 12, outline: "none", resize: "vertical" },
  btnPrimary: { background: "#2563eb", color: "white", border: "none", padding: "10px 16px", borderRadius: 10, cursor: "pointer" },
  btnGhost: { background: "transparent", color: "#93c5fd", border: "1px solid #1f2937", padding: "10px 16px", borderRadius: 10, cursor: "pointer" },
  feedback: { marginTop: 16, background: "#0b1220", border: "1px solid #1f2937", borderRadius: 12, padding: 12 },
  ref: { marginTop: 4, background: "#0a0f1c", border: "1px dashed #334155", borderRadius: 8, padding: 10, whiteSpace: "pre-wrap" },
  error: { marginTop: 12, color: "#fecaca", background: "#7f1d1d", border: "1px solid #b91c1c", padding: 10, borderRadius: 8 },
};
