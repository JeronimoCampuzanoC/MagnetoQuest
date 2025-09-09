import React, { useRef, useState, DragEvent, ChangeEvent } from "react";
import styles from "./cvUploader.module.css";

type Props = {
  onFileSelected?: (file: File | null) => void; // te paso un único archivo
  maxSizeMB?: number;                            // default 5
  className?: string;
};

const ACCEPT =
  ".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document";

const CvUploader: React.FC<Props> = ({ onFileSelected, maxSizeMB = 5, className }) => {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);

  const openPicker = () => inputRef.current?.click();

  const validate = (f?: File) => {
    if (!f) return { ok: false, msg: "No se seleccionó archivo." };
    const okType =
      f.type === "application/pdf" ||
      f.type === "application/msword" ||
      f.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
      /\.(pdf|docx?|PDF|DOCX?)$/.test(f.name);
    if (!okType) return { ok: false, msg: "Formato no permitido. Usa PDF, DOC o DOCX." };
    if (f.size > maxSizeMB * 1024 * 1024)
      return { ok: false, msg: `Archivo demasiado grande. Máximo ${maxSizeMB} MB.` };
    return { ok: true as const };
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files?.[0];
    const res = validate(f);
    if (!res.ok) { setError(res.msg); setFileName(null); onFileSelected?.(null); return; }
    setError(null); setFileName(f!.name); onFileSelected?.(f!);
  };

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    const res = validate(f);
    if (!res.ok) { setError(res.msg); setFileName(null); onFileSelected?.(null); return; }
    setError(null); setFileName(f!.name); onFileSelected?.(f!);
  };

  return (
    <div className={`${styles.card} ${className ?? ""}`}>
      <div
        className={`${styles.drop} ${dragOver ? styles.drag : ""}`}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={openPicker}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && openPicker()}
        aria-label="Arrastra tu hoja de vida o haz clic para elegir un archivo"
      >
        <div className={styles.title}>Arrastra tu hoja de vida aquí</div>

        <div className={styles.pill} onClick={(e) => e.stopPropagation()}>
          <span className={styles.icon} aria-hidden>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 7h4l2 3h12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
              <path d="M3 7V5a2 2 0 0 1 2-2h4l2 2h6a2 2 0 0 1 2 2v3" />
            </svg>
          </span>
          <button type="button" className={styles.pillBtn} onClick={openPicker}>
            Abre el explorador de archivos
          </button>
        </div>

        <input
          ref={inputRef}
          type="file"
          accept={ACCEPT}
          onChange={handleChange}
          className={styles.input}
        />
      </div>

      <div className={styles.meta}>
        Formatos permitidos: <strong>PDF, doc y docx</strong> | Peso máximo: <strong>{maxSizeMB}mb</strong>
      </div>

      {fileName && <div className={styles.fileName}>Seleccionado: {fileName}</div>}
      {error && <div className={styles.error}>{error}</div>}
    </div>
  );
};

export default CvUploader;
