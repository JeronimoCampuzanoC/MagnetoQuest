import React, { useState, useEffect } from 'react';
import { Form, FormGroup, Label, Input, Button, Alert, Spinner } from 'reactstrap';
import { AuthService } from '../../services/authService';
import styles from './CVForm.module.css';

interface ResumeData {
    id_resume?: string;
    id_app_user?: string;
    description: string;
    experience: string;
    courses: string;
    projects: string;
    languages: string;
    references_cv: string;
}

export default function CVForm() {
    const [resume, setResume] = useState<ResumeData>({
        description: '',
        experience: '',
        courses: '',
        projects: '',
        languages: '',
        references_cv: ''
    });

    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    const [userId, setUserId] = useState<string | null>(null);

    // Cargar userId usando AuthService
    useEffect(() => {
        const currentUserId = AuthService.getCurrentUserId();
        if (currentUserId) {
            setUserId(currentUserId);
            loadResume(currentUserId);
        } else {
            setError('No se encontró el ID de usuario. Por favor inicia sesión nuevamente.');
        }
    }, []);

    // Cargar el resume existente
    const loadResume = async (uid: string) => {
        setLoading(true);
        setError(null);

        try {
            const response = await fetch(`http://localhost:4000/api/users/${uid}/resume`);

            if (response.ok) {
                const data = await response.json();
                setResume({
                    description: data.description || '',
                    experience: data.experience || '',
                    courses: data.courses || '',
                    projects: data.projects || '',
                    languages: data.languages || '',
                    references_cv: data.references_cv || ''
                });
            } else if (response.status === 404) {
                // No existe resume aún, usar valores vacíos
                console.log('No se encontró un CV existente, comenzando con formulario vacío');
            } else {
                throw new Error('Error al cargar el CV');
            }
        } catch (err) {
            console.error('Error loading resume:', err);
            // No mostrar error si no existe, solo si hay un error real
            if (err instanceof Error && !err.message.includes('404')) {
                setError('Error al cargar tu CV. Puedes comenzar a crear uno nuevo.');
            }
        } finally {
            setLoading(false);
        }
    };

    // Manejar cambios en los campos
    const handleChange = (field: keyof ResumeData, value: string) => {
        setResume(prev => ({
            ...prev,
            [field]: value
        }));
        setSuccess(false);
        setError(null);
    };

    // Guardar el resume
    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!userId) {
            setError('No se encontró el ID de usuario');
            return;
        }

        setSaving(true);
        setError(null);
        setSuccess(false);

        try {
            // Preparar solo los campos que tienen contenido
            const dataToSend: Partial<ResumeData> = {};

            if (resume.description?.trim()) dataToSend.description = resume.description.trim();
            if (resume.experience?.trim()) dataToSend.experience = resume.experience.trim();
            if (resume.courses?.trim()) dataToSend.courses = resume.courses.trim();
            if (resume.projects?.trim()) dataToSend.projects = resume.projects.trim();
            if (resume.languages?.trim()) dataToSend.languages = resume.languages.trim();
            if (resume.references_cv?.trim()) dataToSend.references_cv = resume.references_cv.trim();

            const response = await fetch(`http://localhost:4000/api/users/${userId}/resume`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(dataToSend)
            });

            if (!response.ok) {
                throw new Error('Error al guardar el CV');
            }

            const savedResume = await response.json();
            setResume({
                description: savedResume.description || '',
                experience: savedResume.experience || '',
                courses: savedResume.courses || '',
                projects: savedResume.projects || '',
                languages: savedResume.languages || '',
                references_cv: savedResume.references_cv || ''
            });

            setSuccess(true);

            // Ocultar mensaje de éxito después de 3 segundos
            setTimeout(() => setSuccess(false), 3000);

        } catch (err) {
            console.error('Error saving resume:', err);
            setError(err instanceof Error ? err.message : 'Error al guardar el CV');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className={styles.loadingContainer}>
                <Spinner color="primary" />
                <p>Cargando tu CV...</p>
            </div>
        );
    }

    return (
        <div className={styles.cvFormContainer}>
            <h5 className="mb-4">✏️ Diseña tu Hoja de Vida</h5>
            <p className="text-muted mb-4">
                Completa los campos que desees actualizar. No es necesario llenar todos los campos.
            </p>

            {error && (
                <Alert color="danger" toggle={() => setError(null)}>
                    {error}
                </Alert>
            )}

            {success && (
                <Alert color="success" toggle={() => setSuccess(false)}>
                    ✅ ¡Tu CV ha sido guardado exitosamente!
                </Alert>
            )}

            <Form onSubmit={handleSave}>
                <FormGroup>
                    <Label for="description">📝 Descripción Personal</Label>
                    <Input
                        type="textarea"
                        id="description"
                        name="description"
                        placeholder="Cuéntanos sobre ti: ¿Quién eres? ¿Cuáles son tus fortalezas?"
                        value={resume.description}
                        onChange={(e) => handleChange('description', e.target.value)}
                        rows={4}
                        className={styles.textarea}
                    />
                    <small className="text-muted">
                        Ejemplo: Desarrollador frontend apasionado por crear interfaces intuitivas...
                    </small>
                </FormGroup>

                <FormGroup>
                    <Label for="experience">💼 Experiencia Profesional</Label>
                    <Input
                        type="textarea"
                        id="experience"
                        name="experience"
                        placeholder="Describe tu experiencia laboral relevante"
                        value={resume.experience}
                        onChange={(e) => handleChange('experience', e.target.value)}
                        rows={4}
                        className={styles.textarea}
                    />
                    <small className="text-muted">
                        Ejemplo: 2 años como Frontend Developer en TechCorp (2021-2023)...
                    </small>
                </FormGroup>

                <FormGroup>
                    <Label for="courses">🎓 Cursos y Certificaciones</Label>
                    <Input
                        type="textarea"
                        id="courses"
                        name="courses"
                        placeholder="Lista los cursos y certificaciones que has completado"
                        value={resume.courses}
                        onChange={(e) => handleChange('courses', e.target.value)}
                        rows={3}
                        className={styles.textarea}
                    />
                    <small className="text-muted">
                        Ejemplo: React Avanzado - Udemy (2023), Scrum Master Certification...
                    </small>
                </FormGroup>

                <FormGroup>
                    <Label for="projects">🚀 Proyectos Destacados</Label>
                    <Input
                        type="textarea"
                        id="projects"
                        name="projects"
                        placeholder="Describe tus proyectos más importantes"
                        value={resume.projects}
                        onChange={(e) => handleChange('projects', e.target.value)}
                        rows={4}
                        className={styles.textarea}
                    />
                    <small className="text-muted">
                        Ejemplo: E-commerce con React - Tienda online con carrito de compras...
                    </small>
                </FormGroup>

                <FormGroup>
                    <Label for="languages">🌍 Idiomas</Label>
                    <Input
                        type="textarea"
                        id="languages"
                        name="languages"
                        placeholder="¿Qué idiomas hablas y a qué nivel?"
                        value={resume.languages}
                        onChange={(e) => handleChange('languages', e.target.value)}
                        rows={2}
                        className={styles.textarea}
                    />
                    <small className="text-muted">
                        Ejemplo: Español (Nativo), Inglés (Avanzado - B2), Francés (Básico)...
                    </small>
                </FormGroup>

                <FormGroup>
                    <Label for="references_cv">👥 Referencias</Label>
                    <Input
                        type="textarea"
                        id="references_cv"
                        name="references_cv"
                        placeholder="Referencias profesionales o académicas"
                        value={resume.references_cv}
                        onChange={(e) => handleChange('references_cv', e.target.value)}
                        rows={3}
                        className={styles.textarea}
                    />
                    <small className="text-muted">
                        Ejemplo: Juan Pérez - Gerente de TI, TechCorp - juan@techcorp.com...
                    </small>
                </FormGroup>

                <div className={styles.buttonContainer}>
                    <Button
                        color="primary"
                        type="submit"
                        disabled={saving}
                        className={styles.saveButton}
                    >
                        {saving ? (
                            <>
                                <Spinner size="sm" className="me-2" />
                                Guardando...
                            </>
                        ) : (
                            <>
                                💾 Guardar CV
                            </>
                        )}
                    </Button>
                </div>
            </Form>

            <div className={styles.infoBox}>
                <h6>💡 Consejos para tu CV:</h6>
                <ul>
                    <li>Sé conciso y específico en tus descripciones</li>
                    <li>Usa verbos de acción: desarrollé, implementé, lideré, etc.</li>
                    <li>Incluye logros cuantificables cuando sea posible</li>
                    <li>Actualiza tu CV regularmente con nuevas experiencias</li>
                    <li>Completa todos los campos para aumentar tus posibilidades de éxito</li>
                </ul>
            </div>
        </div>
    );
}
