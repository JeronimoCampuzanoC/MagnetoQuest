import React, { useState, useEffect } from "react";
import { Eye, Pencil, Trash2 } from "lucide-react";
import Modal from "react-modal";

// Reusable type for a project card
type ProjectItem = {
    projectId: string;
    title: string;
    description: string;
    userId: string;
    url?: string;
    previewImage?: string;
    document?: string;
    projectDate?: string;
};

type InnerTab = "projects" | "certificates";

const ProjectCertificate: React.FC = () => {
    const [tab, setTab] = useState<InnerTab>("projects");
    const [projects, setProjects] = useState<ProjectItem[]>([]);
    const [loading, setLoading] = useState(true);

    // Certificates type and state management
    type CertificateItem = {
        certificateId: string;
        title: string;
        description: string;
        userId: string;
        image?: string;
        validationLink?: string;
    };
    const [certificates, setCertificates] = useState<CertificateItem[]>([]);
    const [certificateLoading, setCertificateLoading] = useState(true);

    const [modalIsOpen, setModalIsOpen] = useState(false);
    const [editModalIsOpen, setEditModalIsOpen] = useState(false);
    const [certificateModalIsOpen, setCertificateModalIsOpen] = useState(false);
    const [certificateEditModalIsOpen, setCertificateEditModalIsOpen] = useState(false);
    const [formData, setFormData] = useState({ name: '', description: '', projectDate: '', url: '' });
    const [editFormData, setEditFormData] = useState({ name: '', description: '', projectDate: '', url: '' });
    const [editingProject, setEditingProject] = useState<ProjectItem | null>(null);
    const [certificateFormData, setCertificateFormData] = useState({ name: '', description: '' });
    const [certificateEditFormData, setCertificateEditFormData] = useState({ name: '', description: '' });
    const [editingCertificate, setEditingCertificate] = useState<CertificateItem | null>(null);

    // Fetch projects from backend
    const fetchProjects = async () => {
        try {
            setLoading(true);
            const response = await fetch('/api/projects');
            if (response.ok) {
                const projectsData = await response.json();
                setProjects(projectsData);
            } else {
                console.error('Failed to fetch projects');
            }
        } catch (error) {
            console.error('Error fetching projects:', error);
        } finally {
            setLoading(false);
        }
    };

    // Fetch certificates from backend
    const fetchCertificates = async () => {
        try {
            setCertificateLoading(true);
            const response = await fetch('/api/certificates');
            if (response.ok) {
                const certificatesData = await response.json();
                setCertificates(certificatesData);
            } else {
                console.error('Failed to fetch certificates');
            }
        } catch (error) {
            console.error('Error fetching certificates:', error);
        } finally {
            setCertificateLoading(false);
        }
    };

    // Fetch projects and certificates on component mount
    useEffect(() => {
        fetchProjects();
        fetchCertificates();
    }, []);

    const openModal = () => setModalIsOpen(true);
    const closeModal = () => setModalIsOpen(false);

    const openEditModal = (project: ProjectItem) => {
        setEditingProject(project);
        setEditFormData({
            name: project.title,
            description: project.description,
            projectDate: project.projectDate ? project.projectDate.split('T')[0] : '',
            url: project.url || ''
        });
        setEditModalIsOpen(true);
    };
    const closeEditModal = () => {
        setEditModalIsOpen(false);
        setEditingProject(null);
        setEditFormData({ name: '', description: '', projectDate: '', url: '' });
    };

    const openCertificateModal = () => setCertificateModalIsOpen(true);
    const closeCertificateModal = () => setCertificateModalIsOpen(false);

    const openCertificateEditModal = (certificate: CertificateItem) => {
        setEditingCertificate(certificate);
        setCertificateEditFormData({
            name: certificate.title,
            description: certificate.description
        });
        setCertificateEditModalIsOpen(true);
    };
    const closeCertificateEditModal = () => {
        setCertificateEditModalIsOpen(false);
        setEditingCertificate(null);
        setCertificateEditFormData({ name: '', description: '' });
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
    };

    const handleEditChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setEditFormData({ ...editFormData, [name]: value });
    };

    const handleCertificateChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setCertificateFormData({ ...certificateFormData, [name]: value });
    };

    const handleCertificateEditChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setCertificateEditFormData({ ...certificateEditFormData, [name]: value });
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        try {
            // Send data to backend
            const response = await fetch('/api/projects', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });
            if (response.ok) {
                // Handle success - refresh projects list and close modal
                await fetchProjects();
                setFormData({ name: '', description: '', projectDate: '', url: '' }); // Reset form
                closeModal();
            } else {
                // Handle error
                console.error('Failed to submit data');
                alert('Error al crear el proyecto');
            }
        } catch (error) {
            console.error('Error submitting project:', error);
            alert('Error al crear el proyecto');
        }
    };

    const handleCertificateSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        try {
            // Send data to backend
            const response = await fetch('/api/certificates', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(certificateFormData),
            });
            if (response.ok) {
                // Handle success - refresh certificates list and close modal
                await fetchCertificates();
                setCertificateFormData({ name: '', description: '' }); // Reset form
                closeCertificateModal();
            } else {
                // Handle error
                console.error('Failed to submit certificate');
                alert('Error al crear el certificado');
            }
        } catch (error) {
            console.error('Error submitting certificate:', error);
            alert('Error al crear el certificado');
        }
    };

    const handleDeleteProject = async (projectId: string, projectTitle: string) => {
        const confirmDelete = window.confirm(
            `¿Estás seguro de que quieres eliminar el proyecto "${projectTitle}"?\n\nEsta acción no se puede deshacer.`
        );

        if (!confirmDelete) {
            return;
        }

        try {
            const response = await fetch(`/api/projects/${projectId}`, {
                method: 'DELETE',
            });

            if (response.ok) {
                // Refresh projects list
                await fetchProjects();
                alert('Proyecto eliminado correctamente');
            } else {
                console.error('Failed to delete project');
                alert('Error al eliminar el proyecto');
            }
        } catch (error) {
            console.error('Error deleting project:', error);
            alert('Error al eliminar el proyecto');
        }
    };

    const handleEditSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        if (!editingProject) {
            return;
        }

        try {
            const response = await fetch(`/api/projects/${editingProject.projectId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(editFormData),
            });

            if (response.ok) {
                // Handle success - refresh projects list and close modal
                await fetchProjects();
                closeEditModal();
                alert('Proyecto actualizado correctamente');
            } else {
                console.error('Failed to update project');
                alert('Error al actualizar el proyecto');
            }
        } catch (error) {
            console.error('Error updating project:', error);
            alert('Error al actualizar el proyecto');
        }
    };

    const handleViewProject = (project: ProjectItem) => {
        if (project.url) {
            // Add protocol if not present
            let url = project.url;
            if (!url.startsWith('http://') && !url.startsWith('https://')) {
                url = 'https://' + url;
            }
            window.open(url, '_blank', 'noopener,noreferrer');
        } else {
            alert('Este proyecto no tiene una URL configurada');
        }
    };

    const handleDeleteCertificate = async (certificateId: string, certificateTitle: string) => {
        const confirmDelete = window.confirm(
            `¿Estás seguro de que quieres eliminar el certificado "${certificateTitle}"?\n\nEsta acción no se puede deshacer.`
        );

        if (!confirmDelete) {
            return;
        }

        try {
            const response = await fetch(`/api/certificates/${certificateId}`, {
                method: 'DELETE',
            });

            if (response.ok) {
                // Refresh certificates list
                await fetchCertificates();
                alert('Certificado eliminado correctamente');
            } else {
                console.error('Failed to delete certificate');
                alert('Error al eliminar el certificado');
            }
        } catch (error) {
            console.error('Error deleting certificate:', error);
            alert('Error al eliminar el certificado');
        }
    };

    const handleCertificateEditSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        if (!editingCertificate) {
            return;
        }

        try {
            const response = await fetch(`/api/certificates/${editingCertificate.certificateId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(certificateEditFormData),
            });

            if (response.ok) {
                // Handle success - refresh certificates list and close modal
                await fetchCertificates();
                closeCertificateEditModal();
                alert('Certificado actualizado correctamente');
            } else {
                console.error('Failed to update certificate');
                alert('Error al actualizar el certificado');
            }
        } catch (error) {
            console.error('Error updating certificate:', error);
            alert('Error al actualizar el certificado');
        }
    };

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
                    {loading ? (
                        <div style={{ textAlign: 'center', padding: 20 }}>Cargando proyectos...</div>
                    ) : projects.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: 20, color: '#64748b' }}>No hay proyectos aún. ¡Agrega tu primer proyecto!</div>
                    ) : (
                        projects.map(p => (
                            <div key={p.projectId} style={cardStyle}>
                                <div style={imageWrapperStyle}>
                                    <img
                                        src={p.previewImage || "../static/cardBackground.png"}
                                        alt="Proyecto placeholder"
                                        style={imgStyle}
                                    />
                                </div>
                                <h5 style={{ margin: "12px 0 4px", fontSize: 18 }}>{p.title}</h5>
                                {p.projectDate && (
                                    <p style={{ margin: "0 0 8px", fontSize: 12, color: '#64748b' }}>
                                        📅 {new Date(p.projectDate).toLocaleDateString('es-ES', {
                                            year: 'numeric',
                                            month: 'long',
                                            day: 'numeric'
                                        })}
                                    </p>
                                )}
                                <p style={{ marginTop: 0, marginBottom: 16, fontSize: 14, lineHeight: 1.4, flexGrow: 1 }}>{p.description}</p>
                                <div style={cardFooterStyle}>
                                    <div>
                                        <button
                                            style={iconTextBtnStyle()}
                                            aria-label={`Ver proyecto ${p.title}`}
                                            title="Ver proyecto"
                                            onClick={() => handleViewProject(p)}
                                        >
                                            <Eye size={16} />
                                        </button>
                                    </div>
                                    <div style={{ display: "flex", gap: 8 }}>
                                        <button
                                            style={iconTextBtnStyle()}
                                            aria-label={`Editar proyecto ${p.title}`}
                                            title="Editar proyecto"
                                            onClick={() => openEditModal(p)}
                                        >
                                            <Pencil size={16} />
                                        </button>
                                        <button
                                            style={iconTextBtnStyle()}
                                            aria-label={`Borrar proyecto ${p.title}`}
                                            title="Borrar proyecto"
                                            onClick={() => handleDeleteProject(p.projectId, p.title)}
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            )}

            {tab === "certificates" && (
                <div style={gridStyle}>
                    {certificateLoading ? (
                        <div style={{ textAlign: 'center', padding: 20 }}>Cargando certificados...</div>
                    ) : certificates.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: 20, color: '#64748b' }}>No hay certificados aún. ¡Agrega tu primer certificado!</div>
                    ) : (
                        certificates.map(c => (
                            <div key={c.certificateId} style={cardStyle}>
                                <div style={imageWrapperStyle}>
                                    <img
                                        src={c.image || "../static/cardBackground.png"}
                                        alt="Certificado placeholder"
                                        style={imgStyle}
                                    />
                                </div>
                                <h5 style={{ margin: "12px 0 4px", fontSize: 18 }}>{c.title}</h5>
                                <p style={{ marginTop: 0, marginBottom: 16, fontSize: 14, lineHeight: 1.4, flexGrow: 1 }}>{c.description}</p>
                                <div style={cardFooterStyle}>
                                    <div>
                                        <button
                                            style={iconTextBtnStyle()}
                                            aria-label={`Ver certificado ${c.title}`}
                                            title="Ver certificado"
                                        >
                                            <Eye size={16} />
                                        </button>
                                    </div>
                                    <div style={{ display: "flex", gap: 8 }}>
                                        <button
                                            style={iconTextBtnStyle()}
                                            aria-label={`Editar certificado ${c.title}`}
                                            title="Editar certificado"
                                            onClick={() => openCertificateEditModal(c)}
                                        >
                                            <Pencil size={16} />
                                        </button>
                                        <button
                                            style={iconTextBtnStyle()}
                                            aria-label={`Borrar certificado ${c.title}`}
                                            title="Borrar certificado"
                                            onClick={() => handleDeleteCertificate(c.certificateId, c.title)}
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            )}

            {/* Add Project/Certificate Button */}
            <div style={{ marginTop: 20 }}>
                {tab === "projects" ? (
                    <button onClick={openModal} style={addButtonStyle}>
                        Agregar Proyecto
                    </button>
                ) : (
                    <button onClick={openCertificateModal} style={addButtonStyle}>
                        Agregar Certificado
                    </button>
                )}
            </div>

            {/* Add Project Modal */}
            <Modal
                isOpen={modalIsOpen}
                onRequestClose={closeModal}
                style={modalStyle}
                ariaHideApp={false}
            >
                <h2 style={{ marginBottom: 16 }}>Agregar Nuevo Proyecto</h2>
                <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                    <label style={labelStyle}>
                        Nombre:
                        <input
                            type="text"
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            required
                            style={inputStyle}
                        />
                    </label>
                    <label style={labelStyle}>
                        Descripción:
                        <textarea
                            name="description"
                            value={formData.description}
                            onChange={handleChange}
                            required
                            style={{ ...inputStyle, resize: "none", height: 80 }}
                        />
                    </label>
                    <label style={labelStyle}>
                        Fecha del Proyecto:
                        <input
                            type="date"
                            name="projectDate"
                            value={formData.projectDate}
                            onChange={handleChange}
                            style={inputStyle}
                        />
                    </label>
                    <label style={labelStyle}>
                        URL del Proyecto:
                        <input
                            type="url"
                            name="url"
                            value={formData.url}
                            onChange={handleChange}
                            placeholder="https://ejemplo.com"
                            style={inputStyle}
                        />
                    </label>
                    <div style={{ display: "flex", gap: 12 }}>
                        <button type="submit" style={confirmButtonStyle}>
                            Confirmar
                        </button>
                        <button type="button" onClick={closeModal} style={cancelButtonStyle}>
                            Cancelar
                        </button>
                    </div>
                </form>
            </Modal>

            {/* Edit Project Modal */}
            <Modal
                isOpen={editModalIsOpen}
                onRequestClose={closeEditModal}
                style={modalStyle}
                ariaHideApp={false}
            >
                <h2 style={{ marginBottom: 16 }}>Editar Proyecto</h2>
                <form onSubmit={handleEditSubmit} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                    <label style={labelStyle}>
                        Nombre:
                        <input
                            type="text"
                            name="name"
                            value={editFormData.name}
                            onChange={handleEditChange}
                            required
                            style={inputStyle}
                        />
                    </label>
                    <label style={labelStyle}>
                        Descripción:
                        <textarea
                            name="description"
                            value={editFormData.description}
                            onChange={handleEditChange}
                            required
                            style={{ ...inputStyle, resize: "none", height: 80 }}
                        />
                    </label>
                    <label style={labelStyle}>
                        Fecha del Proyecto:
                        <input
                            type="date"
                            name="projectDate"
                            value={editFormData.projectDate}
                            onChange={handleEditChange}
                            style={inputStyle}
                        />
                    </label>
                    <label style={labelStyle}>
                        URL del Proyecto:
                        <input
                            type="url"
                            name="url"
                            value={editFormData.url}
                            onChange={handleEditChange}
                            placeholder="https://ejemplo.com"
                            style={inputStyle}
                        />
                    </label>
                    <div style={{ display: "flex", gap: 12 }}>
                        <button type="submit" style={confirmButtonStyle}>
                            Guardar Cambios
                        </button>
                        <button type="button" onClick={closeEditModal} style={cancelButtonStyle}>
                            Cancelar
                        </button>
                    </div>
                </form>
            </Modal>

            {/* Add Certificate Modal */}
            <Modal
                isOpen={certificateModalIsOpen}
                onRequestClose={closeCertificateModal}
                style={modalStyle}
                ariaHideApp={false}
            >
                <h2 style={{ marginBottom: 16 }}>Agregar Nuevo Certificado</h2>
                <form onSubmit={handleCertificateSubmit} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                    <label style={labelStyle}>
                        Nombre:
                        <input
                            type="text"
                            name="name"
                            value={certificateFormData.name}
                            onChange={handleCertificateChange}
                            required
                            style={inputStyle}
                        />
                    </label>
                    <label style={labelStyle}>
                        Descripción:
                        <textarea
                            name="description"
                            value={certificateFormData.description}
                            onChange={handleCertificateChange}
                            required
                            style={{ ...inputStyle, resize: "none", height: 80 }}
                        />
                    </label>
                    <div style={{ display: "flex", gap: 12 }}>
                        <button type="submit" style={confirmButtonStyle}>
                            Confirmar
                        </button>
                        <button type="button" onClick={closeCertificateModal} style={cancelButtonStyle}>
                            Cancelar
                        </button>
                    </div>
                </form>
            </Modal>

            {/* Edit Certificate Modal */}
            <Modal
                isOpen={certificateEditModalIsOpen}
                onRequestClose={closeCertificateEditModal}
                style={modalStyle}
                ariaHideApp={false}
            >
                <h2 style={{ marginBottom: 16 }}>Editar Certificado</h2>
                <form onSubmit={handleCertificateEditSubmit} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                    <label style={labelStyle}>
                        Nombre:
                        <input
                            type="text"
                            name="name"
                            value={certificateEditFormData.name}
                            onChange={handleCertificateEditChange}
                            required
                            style={inputStyle}
                        />
                    </label>
                    <label style={labelStyle}>
                        Descripción:
                        <textarea
                            name="description"
                            value={certificateEditFormData.description}
                            onChange={handleCertificateEditChange}
                            required
                            style={{ ...inputStyle, resize: "none", height: 80 }}
                        />
                    </label>
                    <div style={{ display: "flex", gap: 12 }}>
                        <button type="submit" style={confirmButtonStyle}>
                            Guardar Cambios
                        </button>
                        <button type="button" onClick={closeCertificateEditModal} style={cancelButtonStyle}>
                            Cancelar
                        </button>
                    </div>
                </form>
            </Modal>
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

// Styles for the modal
const modalStyle = {
    content: {
        top: "50%",
        left: "50%",
        right: "auto",
        bottom: "auto",
        marginRight: "-50%",
        transform: "translate(-50%, -50%)",
        padding: 20,
        borderRadius: 12,
        border: "1px solid #e2e8f0",
        boxShadow: "0 4px 8px rgba(0,0,0,0.1)",
        width: "90%",
        maxWidth: 500,
    },
};

// Styles for form elements
const labelStyle: React.CSSProperties = {
    fontSize: 14,
    color: "#334155",
    marginBottom: 8,
};

const inputStyle: React.CSSProperties = {
    padding: 10,
    borderRadius: 8,
    border: "1px solid #e2e8f0",
    fontSize: 14,
    color: "#334155",
    outline: "none",
    transition: "border-color .15s",
};

const confirmButtonStyle: React.CSSProperties = {
    background: "#22c55e",
    color: "#ffffff",
    border: "none",
    padding: "10px 20px",
    fontSize: 14,
    borderRadius: 8,
    cursor: "pointer",
    flex: 1,
    transition: "background .15s, transform .15s",
};

const cancelButtonStyle: React.CSSProperties = {
    background: "#f1f5f9",
    color: "#334155",
    border: "1px solid #e2e8f0",
    padding: "10px 20px",
    fontSize: 14,
    borderRadius: 8,
    cursor: "pointer",
    flex: 1,
    transition: "background .15s, transform .15s",
};

// Add Project button style
const addButtonStyle: React.CSSProperties = {
    background: "#2563eb",
    color: "#ffffff",
    border: "none",
    padding: "10px 20px",
    fontSize: 16,
    borderRadius: 8,
    cursor: "pointer",
    width: "100%",
    maxWidth: 200,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    transition: "background .15s, transform .15s",
};

export default ProjectCertificate;

