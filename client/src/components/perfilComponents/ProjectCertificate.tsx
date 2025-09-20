import React, { useState } from "react";
import { Eye, Pencil, Trash2 } from "lucide-react";

// Reusable type for a project card
type ProjectItem = {
    id: number;
    name: string;
    description: string;
};

// Placeholder data (to be replaced with backend fetch later)
const dataFromDB: ProjectItem[] = [
    { id: 1, name: "E-commerce website", description: "Una tienda online completa desarrollada con Next.js y Stripe para pagos." },
    { id: 2, name: "E-commerce website", description: "Una tienda online completa desarrollada con Next.js y Stripe para pagos." },
    { id: 3, name: "E-commerce website", description: "Una tienda online completa desarrollada con Next.js y Stripe para pagos." },
];

type InnerTab = "projects" | "certificates";

const ProjectCertificate: React.FC = () => {
    const [tab, setTab] = useState<InnerTab>("projects");

    // Certificates placeholder data (to be replaced with backend later)
    type CertificateItem = {
        id: number;
        name: string;
        description: string;
    };
    const certificateData: CertificateItem[] = [
        { id: 1, name: "React", description: "Curso de platzi" },
        { id: 2, name: "React", description: "Curso de platzi" },
    ];

    return (
        <div>
            {/* Inner tabs */}
            <div style={{ display: "flex", gap: 12, marginBottom: 20 }}>
                <button
                    onClick={() => setTab("projects")}
                    style={buttonStyle(tab === "projects")}
                >
                    Proyectos
                </button>
                <button
                    onClick={() => setTab("certificates")}
                    style={buttonStyle(tab === "certificates")}
                >
                    Certificados
                </button>
            </div>

            {tab === "projects" && (
                <div style={gridStyle}>
                    {dataFromDB.map(p => (
                        <div key={p.id} style={cardStyle}>
                            <div style={imageWrapperStyle}>
                                <img
                                    src={"../static/cardBackground.png"}
                                    alt="Proyecto placeholder"
                                    style={imgStyle}
                                />
                            </div>
                            <h5 style={{ margin: "12px 0 4px", fontSize: 18 }}>{p.name}</h5>
                            <p style={{ marginTop: 0, marginBottom: 16, fontSize: 14, lineHeight: 1.4, flexGrow: 1 }}>{p.description}</p>
                            <div style={cardFooterStyle}>
                                <div>
                                    <button
                                        style={iconTextBtnStyle()}
                                        aria-label={`Ver proyecto ${p.name}`}
                                        title="Ver proyecto"
                                    >
                                        <Eye size={16} />
                                    </button>
                                </div>
                                <div style={{ display: "flex", gap: 8 }}>
                                    <button
                                        style={iconTextBtnStyle()}
                                        aria-label={`Editar proyecto ${p.name}`}
                                        title="Editar proyecto"
                                    >
                                        <Pencil size={16} />
                                    </button>
                                    <button
                                        style={iconTextBtnStyle()}
                                        aria-label={`Borrar proyecto ${p.name}`}
                                        title="Borrar proyecto"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {tab === "certificates" && (
                <div style={gridStyle}>
                    {certificateData.map(c => (
                        <div key={c.id} style={cardStyle}>
                            <div style={imageWrapperStyle}>
                                <img
                                    src={"../static/cardBackground.png"}
                                    alt="Certificado placeholder"
                                    style={imgStyle}
                                />
                            </div>
                            <h5 style={{ margin: "12px 0 4px", fontSize: 18 }}>{c.name}</h5>
                            <p style={{ marginTop: 0, marginBottom: 16, fontSize: 14, lineHeight: 1.4, flexGrow: 1 }}>{c.description}</p>
                            <div style={cardFooterStyle}>
                                <div>
                                    <button
                                        style={iconTextBtnStyle()}
                                        aria-label={`Ver certificado ${c.name}`}
                                        title="Ver certificado"
                                    >
                                        <Eye size={16} />
                                    </button>
                                </div>
                                <div style={{ display: "flex", gap: 8 }}>
                                    <button
                                        style={iconTextBtnStyle()}
                                        aria-label={`Editar certificado ${c.name}`}
                                        title="Editar certificado"
                                    >
                                        <Pencil size={16} />
                                    </button>
                                    <button
                                        style={iconTextBtnStyle()}
                                        aria-label={`Borrar certificado ${c.name}`}
                                        title="Borrar certificado"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

// Inline style helpers (kept simple for now; can migrate to CSS Module later)
const buttonStyle = (active: boolean): React.CSSProperties => ({
    padding: "8px 16px",
    borderRadius: 24,
    cursor: "pointer",
    fontSize: 14,
    border: "1px solid #cbd5e1",
    background: active ? "#22c55e" : "#ffffff",
    color: active ? "#ffffff" : "#334155",
    fontWeight: 600,
    boxShadow: active ? "0 2px 6px rgba(0,0,0,0.15)" : "none",
    transition: "all .2s",
});

const gridStyle: React.CSSProperties = {
    display: "grid",
    gap: 20,
    gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
};

const cardStyle: React.CSSProperties = {
    background: "#ffffff",
    border: "1px solid #e2e8f0",
    borderRadius: 16,
    padding: 20,
    display: "flex",
    flexDirection: "column",
    boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
};

const tinyBtnStyle = (color: string): React.CSSProperties => ({
    background: color,
    color: "#fff",
    border: "none",
    padding: "4px 10px",
    fontSize: 12,
    borderRadius: 6,
    cursor: "pointer",
    lineHeight: 1.2,
    fontWeight: 500,
});

// New helpers for image and icon buttons
const imageWrapperStyle: React.CSSProperties = {
    width: "100%",
    aspectRatio: "16 / 9",
    borderRadius: 12,
    overflow: "hidden",
    position: "relative",
    background: "#f1f5f9",
    border: "1px solid #e2e8f0",
};

const imgStyle: React.CSSProperties = {
    width: "100%",
    height: "100%",
    objectFit: "cover",
    display: "block",
};

const iconBtnStyle = (color: string): React.CSSProperties => ({
    background: color,
    color: "#ffffff",
    border: "none",
    width: 32,
    height: 32,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 8,
    cursor: "pointer",
    transition: "background .15s, transform .15s",
});

// Footer layout (pushes buttons to edges)
const cardFooterStyle: React.CSSProperties = {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: "auto",
};

// Slightly larger buttons for footer, uniform width/height
const iconTextBtnStyle = (): React.CSSProperties => ({
    background: "#ffffff",
    color: "#0f172a",
    border: "1px solid #e2e8f0",
    width: 38,
    height: 38,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 10,
    cursor: "pointer",
    transition: "background .15s, transform .15s, box-shadow .15s",
    boxShadow: "0 1px 2px rgba(0,0,0,0.04)",
});

export default ProjectCertificate;

