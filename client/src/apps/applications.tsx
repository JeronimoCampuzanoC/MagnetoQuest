import React, { useEffect, useState } from 'react';
import {
    Container,
    Row,
    Col,
    Card,
    CardBody,
    Badge,
    Button,
    Spinner,
    Alert,
    ListGroup,
    ListGroupItem
} from 'reactstrap';
import { Briefcase, MapPin, Clock, DollarSign, Building2, ChevronRight, Bookmark, Share2, MoreVertical } from 'lucide-react';
import { AuthService } from '../services/authService';
import styles from './App.module.css';

interface JobApplication {
    id: string;
    title: string;
    company: string;
    companyLogo?: string;
    location: string;
    type: 'Tiempo indefinido' | 'Temporal' | 'Contrato' | 'Remoto';
    modalidad: 'Presencial' | 'Remoto' | 'Híbrido';
    salary: string;
    salaryType: 'a convenir' | 'fijo';
    description: string;
    responsibilities: string[];
    requirements: string[];
    keywords: string[];
    postedDate: string;
    experienceRequired: string;
    confidential?: boolean;
    missionId?: string;
    status?: string;
    progress?: number;
}

const Applications: React.FC = () => {
    const [jobs, setJobs] = useState<JobApplication[]>([]);
    const [selectedJob, setSelectedJob] = useState<JobApplication | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [applyingToJob, setApplyingToJob] = useState<string | null>(null);
    const [applyMessage, setApplyMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    useEffect(() => {
        const fetchJobs = async () => {
            try {
                setLoading(true);

                // Obtener el usuario actual
                const currentUser = AuthService.getCurrentUser();
                if (!currentUser?.id) {
                    setError('Usuario no autenticado');
                    setLoading(false);
                    return;
                }

                // Llamar al backend para obtener las misiones de tipo Application del usuario
                const response = await fetch(`/api/users/${currentUser.id}/missions/applications`);

                if (!response.ok) {
                    throw new Error('Error al cargar las aplicaciones');
                }

                const applicationMissions = await response.json();

                // Datos mock de empresas para enriquecer las misiones
                const mockCompanies = [
                    {
                        name: 'Solvo Global',
                        location: 'Envigado - Itagui - La Estrella - Medellín - Sabaneta',
                        type: 'Tiempo indefinido' as const,
                        modalidad: 'Presencial' as const,
                        salary: 'Salario a convenir',
                        salaryType: 'a convenir' as const,
                        responsibilities: [
                            'Supervisar operaciones diarias del equipo',
                            'Gestionar KPIs y métricas de rendimiento',
                            'Coordinar con diferentes departamentos',
                            'Implementar mejoras en procesos'
                        ],
                        requirements: [
                            'Inglés avanzado (B2+)',
                            '2+ años de experiencia en supervisión',
                            'Excelentes habilidades de comunicación'
                        ],
                        keywords: ['RPA', 'Developer', 'English'],
                        experienceRequired: '2+ años de experiencia',
                        confidential: false
                    },
                    {
                        name: 'SYNERGY TECHNOLOGY AND PROCESS CONSULTING S.A.S',
                        location: 'Bogotá - Medellín - Remoto',
                        type: 'Tiempo indefinido' as const,
                        modalidad: 'Híbrido' as const,
                        salary: '$5.800.000',
                        salaryType: 'fijo' as const,
                        responsibilities: [
                            'Diseñar e implementar soluciones en Azure DevOps',
                            'Gestionar pipelines CI/CD',
                            'Automatizar procesos de despliegue',
                            'Monitorear y optimizar infraestructura cloud'
                        ],
                        requirements: [
                            'Experiencia en Azure DevOps',
                            'Conocimiento de CI/CD',
                            'Certificaciones Azure (deseable)',
                            'Experiencia con Infrastructure as Code'
                        ],
                        keywords: ['Azure', 'DevOps', 'Cloud'],
                        experienceRequired: '3+ años de experiencia',
                        confidential: false
                    },
                    {
                        name: 'Tech Innovations',
                        location: 'Medellín',
                        type: 'Contrato' as const,
                        modalidad: 'Remoto' as const,
                        salary: '$4.500.000 - $6.000.000',
                        salaryType: 'fijo' as const,
                        responsibilities: [
                            'Desarrollar soluciones fullstack',
                            'Participar en revisiones de código',
                            'Colaborar con el equipo de producto',
                            'Mantener documentación técnica'
                        ],
                        requirements: [
                            'React y Node.js',
                            'TypeScript',
                            'Experiencia con bases de datos',
                            'Metodologías ágiles'
                        ],
                        keywords: ['Fullstack', 'React', 'Node'],
                        experienceRequired: '2+ años de experiencia',
                        confidential: false
                    }
                ];

                // Mapear las misiones del backend a JobApplication
                const jobApplications: JobApplication[] = applicationMissions.map((mission: any, index: number) => {
                    const companyData = mockCompanies[index % mockCompanies.length];

                    return {
                        id: mission.ump_id,
                        missionId: mission.mission_id,
                        title: mission.mission_title,
                        company: companyData.name,
                        location: companyData.location,
                        type: companyData.type,
                        modalidad: companyData.modalidad,
                        salary: companyData.salary,
                        salaryType: companyData.salaryType,
                        description: mission.mission_description, // Descripción de la misión desde BD
                        responsibilities: companyData.responsibilities,
                        requirements: companyData.requirements,
                        keywords: companyData.keywords,
                        postedDate: mission.starts_at || new Date().toISOString(),
                        experienceRequired: companyData.experienceRequired,
                        confidential: companyData.confidential,
                        status: mission.status,
                        progress: mission.progress
                    };
                });

                setJobs(jobApplications);
                if (jobApplications.length > 0) {
                    setSelectedJob(jobApplications[0]);
                }
                setLoading(false);
            } catch (err) {
                console.error('Error cargando aplicaciones:', err);
                setError('Error al cargar los empleos. Por favor, intenta de nuevo.');
                setLoading(false);
            }
        };

        fetchJobs();
    }, []);

    const handleApply = async (job: JobApplication) => {
        if (!job.missionId) {
            console.error('No mission ID found for this job');
            return;
        }

        const currentUser = AuthService.getCurrentUser();
        if (!currentUser?.id) {
            setApplyMessage({ type: 'error', text: 'Usuario no autenticado' });
            return;
        }

        setApplyingToJob(job.id);
        setApplyMessage(null);

        try {
            const response = await fetch(`/api/users/${currentUser.id}/missions/${job.missionId}/apply`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || 'Error al aplicar');
            }

            // Actualizar el estado local del trabajo
            setJobs(prevJobs => prevJobs.map(j => {
                if (j.id === job.id) {
                    return {
                        ...j,
                        progress: result.progress,
                        status: result.status
                    };
                }
                return j;
            }));

            // Actualizar el trabajo seleccionado si es el mismo
            if (selectedJob?.id === job.id) {
                setSelectedJob({
                    ...selectedJob,
                    progress: result.progress,
                    status: result.status
                });
            }

            // Mostrar mensaje de éxito
            setApplyMessage({
                type: 'success',
                text: result.message || '¡Aplicación enviada con éxito!'
            });

            // Si se completó, recargar después de unos segundos
            if (result.completed) {
                setTimeout(() => {
                    window.location.reload();
                }, 3000);
            } else {
                // Limpiar mensaje después de 5 segundos
                setTimeout(() => {
                    setApplyMessage(null);
                }, 5000);
            }

        } catch (err: any) {
            console.error('Error applying to job:', err);
            setApplyMessage({
                type: 'error',
                text: err.message || 'Error al procesar la aplicación'
            });

            setTimeout(() => {
                setApplyMessage(null);
            }, 5000);
        } finally {
            setApplyingToJob(null);
        }
    };

    const calculateTimeAgo = (dateString: string) => {
        const posted = new Date(dateString);
        const now = new Date();
        const diffMs = now.getTime() - posted.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMins / 60);
        const diffDays = Math.floor(diffHours / 24);

        if (diffMins < 60) return `Hace ${diffMins} minutos`;
        if (diffHours < 24) return `Hace ${diffHours === 1 ? '1 hora' : diffHours + ' horas'}`;
        return `Hace ${diffDays} ${diffDays === 1 ? 'día' : 'días'}`;
    };

    if (loading) {
        return (
            <Container className="mt-5 text-center">
                <Spinner color="primary" style={{ width: '3rem', height: '3rem' }} />
                <p className="mt-3">Cargando empleos disponibles...</p>
            </Container>
        );
    }

    if (error) {
        return (
            <Container className="mt-5">
                <Alert color="danger">{error}</Alert>
            </Container>
        );
    }

    return (
        <Container fluid className="mt-3 px-4">
            {/* Barra de Filtros */}
            <Row className="mb-3">
                <Col>
                    <div className="d-flex align-items-center gap-2 p-3 bg-light rounded">
                        <Button color="secondary" size="sm" outline className="d-flex align-items-center gap-1">
                            <span className="fw-semibold">Filtrar (0)</span>
                        </Button>

                        <Button color="light" size="sm" className="d-flex align-items-center gap-2 bg-white border">
                            <Briefcase size={16} />
                            <span>Sector laboral</span>
                            <span className="ms-1">+</span>
                        </Button>

                        <Button color="light" size="sm" className="d-flex align-items-center gap-2 bg-white border">
                            <MapPin size={16} />
                            <span>Modalidad</span>
                            <span className="ms-1">+</span>
                        </Button>

                        <Button color="light" size="sm" className="d-flex align-items-center gap-2 bg-white border">
                            <DollarSign size={16} />
                            <span>Salario mínimo aceptado</span>
                            <span className="ms-1">+</span>
                        </Button>

                        <Button color="light" size="sm" className="d-flex align-items-center gap-2 bg-white border">
                            <Clock size={16} />
                            <span>Experiencia requerida</span>
                            <span className="ms-1">+</span>
                        </Button>

                        <Button color="light" size="sm" className="d-flex align-items-center gap-2 bg-white border">
                            <Clock size={16} />
                            <span>Fecha de publicación</span>
                            <span className="ms-1">+</span>
                        </Button>

                        <Button color="light" size="sm" className="d-flex align-items-center gap-2 bg-white border">
                            <Briefcase size={16} />
                            <span>Tipo de contrato</span>
                            <span className="ms-1">+</span>
                        </Button>

                        <Button color="light" size="sm" className="d-flex align-items-center gap-2 bg-white border">
                            <Building2 size={16} />
                            <span>Tipo de pasantía</span>
                            <span className="ms-1">+</span>
                        </Button>

                        <Button color="light" size="sm" className="d-flex align-items-center gap-2 bg-white border">
                            <MoreVertical size={16} />
                            <span>Otros</span>
                            <span className="ms-1">+</span>
                        </Button>
                    </div>
                </Col>
            </Row>

            {/* Header */}
            <Row className="mb-3">
                <Col>
                    <h5 className="mb-0">
                        <Briefcase size={20} className="me-2" style={{ display: 'inline' }} />
                        Ofertas de empleo en Colombia <span className="text-muted">| {jobs.length.toLocaleString()} cupos</span>
                    </h5>
                </Col>
            </Row>

            <Row className="g-3">
                {/* Lista de empleos - Lado izquierdo */}
                <Col lg={9} xl={9}>
                    <Card style={{ height: 'calc(100vh - 180px)', overflowY: 'auto' }}>
                        <ListGroup flush>
                            {jobs.map((job) => (
                                <ListGroupItem
                                    key={job.id}
                                    action
                                    active={selectedJob?.id === job.id}
                                    onClick={() => setSelectedJob(job)}
                                    className="border-bottom py-3"
                                    style={{
                                        cursor: 'pointer',
                                        backgroundColor: selectedJob?.id === job.id ? '#909090ff' : 'transparent',
                                        border: 'none',
                                        borderBottom: '1px solid #dee2e6'
                                    }}
                                    onMouseEnter={(e) => {
                                        if (selectedJob?.id !== job.id) {
                                            e.currentTarget.style.backgroundColor = '#f8f9fa';
                                        }
                                    }}
                                    onMouseLeave={(e) => {
                                        if (selectedJob?.id !== job.id) {
                                            e.currentTarget.style.backgroundColor = 'transparent';
                                        }
                                    }}
                                >
                                    <div className="d-flex align-items-start">
                                        <div className="me-3 mt-1">
                                            {job.confidential ? (
                                                <div style={{
                                                    width: '48px',
                                                    height: '48px',
                                                    backgroundColor: '#e9ecef',
                                                    borderRadius: '4px',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center'
                                                }}>
                                                    <Building2 size={24} className="text-muted" />
                                                </div>
                                            ) : (
                                                <div style={{
                                                    width: '48px',
                                                    height: '48px',
                                                    backgroundColor: '#f8f9fa',
                                                    borderRadius: '4px',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    fontSize: '20px',
                                                    fontWeight: 'bold',
                                                    color: '#495057'
                                                }}>
                                                    {job.company.charAt(0)}
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex-grow-1">
                                            <div className="d-flex justify-content-between align-items-start mb-1">
                                                <span className="text-muted small">{calculateTimeAgo(job.postedDate)}</span>
                                                <MoreVertical size={16} className="text-muted" />
                                            </div>
                                            <h6 className="mb-1 fw-bold">{job.title}</h6>
                                            <p className="mb-1 small text-muted">
                                                {job.confidential ? 'Empresa confidencial' : job.company} | {job.type}
                                            </p>
                                            <p className="mb-1 small">{job.salary}</p>
                                            <p className="mb-0 small text-muted">{job.location}</p>
                                        </div>
                                        <ChevronRight size={20} className="text-muted ms-2" />
                                    </div>
                                </ListGroupItem>
                            ))}
                        </ListGroup>
                    </Card>
                </Col>

                {/* Panel de detalles - Lado derecho */}
                <Col lg={3} xl={3}>
                    {selectedJob ? (
                        <Card style={{ height: 'calc(100vh - 180px)', overflowY: 'auto' }}>
                            <CardBody className="p-4">
                                {/* Header del empleo seleccionado */}
                                <div className="d-flex justify-content-between align-items-start mb-4">
                                    <div className="d-flex align-items-start">
                                        <div className="me-3">
                                            {selectedJob.confidential ? (
                                                <div style={{
                                                    width: '64px',
                                                    height: '64px',
                                                    backgroundColor: '#e9ecef',
                                                    borderRadius: '8px',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center'
                                                }}>
                                                    <Building2 size={32} className="text-muted" />
                                                </div>
                                            ) : (
                                                <div style={{
                                                    width: '64px',
                                                    height: '64px',
                                                    backgroundColor: '#f8f9fa',
                                                    borderRadius: '8px',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    fontSize: '28px',
                                                    fontWeight: 'bold',
                                                    color: '#495057'
                                                }}>
                                                    {selectedJob.company.charAt(0)}
                                                </div>
                                            )}
                                        </div>
                                        <div>
                                            <h4 className="mb-1 fw-bold">{selectedJob.title}</h4>
                                            <p className="text-muted mb-0">
                                                {selectedJob.confidential ? (
                                                    <>
                                                        <span className="fw-semibold">Empresa confidencial</span>
                                                        <br />
                                                        <span className="small">Confidencial</span>
                                                    </>
                                                ) : (
                                                    selectedJob.company
                                                )}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="d-flex gap-2">
                                        <Button color="light" size="sm" className="border">
                                            <Bookmark size={16} />
                                        </Button>
                                        <Button color="light" size="sm" className="border">
                                            <Share2 size={16} />
                                        </Button>
                                    </div>
                                </div>

                                {/* Mensaje de aplicación */}
                                {applyMessage && (
                                    <Alert
                                        color={applyMessage.type === 'success' ? 'success' : 'danger'}
                                        className="mb-3"
                                    >
                                        {applyMessage.text}
                                    </Alert>
                                )}

                                {/* Botón Aplicar */}
                                <Button
                                    size="lg"
                                    block
                                    className="mb-4"
                                    style={{ backgroundColor: '#090467', borderColor: '#090467', color: 'white' }}
                                    onClick={() => handleApply(selectedJob)}
                                    disabled={applyingToJob === selectedJob.id || selectedJob.status === 'completed'}
                                >
                                    {applyingToJob === selectedJob.id ? (
                                        <>
                                            <Spinner size="sm" className="me-2" />
                                            Aplicando...
                                        </>
                                    ) : selectedJob.status === 'completed' ? (
                                        '✓ Completado'
                                    ) : (
                                        `Aplicar ${selectedJob.progress ? `(${selectedJob.progress}/1)` : ''}`
                                    )}
                                </Button>

                                {/* Información rápida */}
                                <div className="mb-4 p-3 bg-light rounded">
                                    <Row>
                                        <Col xs={6} className="mb-3">
                                            <div className="d-flex align-items-start">
                                                <Clock size={18} className="me-2 mt-1 text-muted" />
                                                <div>
                                                    <small className="text-muted d-block">Publicado</small>
                                                    <span className="small">{calculateTimeAgo(selectedJob.postedDate)}</span>
                                                </div>
                                            </div>
                                        </Col>
                                        <Col xs={6} className="mb-3">
                                            <div className="d-flex align-items-start">
                                                <Briefcase size={18} className="me-2 mt-1 text-muted" />
                                                <div>
                                                    <small className="text-muted d-block">Experiencia</small>
                                                    <span className="small">{selectedJob.experienceRequired}</span>
                                                </div>
                                            </div>
                                        </Col>
                                        <Col xs={6} className="mb-3">
                                            <div className="d-flex align-items-start">
                                                <DollarSign size={18} className="me-2 mt-1 text-muted" />
                                                <div>
                                                    <small className="text-muted d-block">Salario</small>
                                                    <span className="small">{selectedJob.salary}</span>
                                                </div>
                                            </div>
                                        </Col>
                                        <Col xs={6} className="mb-3">
                                            <div className="d-flex align-items-start">
                                                <MapPin size={18} className="me-2 mt-1 text-muted" />
                                                <div>
                                                    <small className="text-muted d-block">Ubicación</small>
                                                    <span className="small">{selectedJob.modalidad} en : {selectedJob.location}</span>
                                                </div>
                                            </div>
                                        </Col>
                                    </Row>
                                    <div className="mt-2">
                                        <small className="text-muted d-block mb-2">Palabras clave:</small>
                                        <div className="d-flex flex-wrap gap-2">
                                            {selectedJob.keywords.map((keyword, idx) => (
                                                <Badge key={idx} color="secondary" pill className="px-3 py-1">
                                                    {keyword}
                                                </Badge>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                {/* Descripción */}
                                <div className="mb-4">
                                    <p className="mb-3" style={{ textAlign: 'justify', lineHeight: '1.6' }}>
                                        {selectedJob.description}
                                    </p>
                                </div>

                                {/* Funciones */}
                                {selectedJob.responsibilities && selectedJob.responsibilities.length > 0 && (
                                    <div className="mb-4">
                                        <h6 className="fw-bold mb-3">Funciones</h6>
                                        <ol className="ps-3">
                                            {selectedJob.responsibilities.map((resp, idx) => (
                                                <li key={idx} className="mb-2" style={{ lineHeight: '1.6' }}>
                                                    {resp}
                                                </li>
                                            ))}
                                        </ol>
                                    </div>
                                )}

                                {/* Requisitos */}
                                <div className="mb-4">
                                    <h6 className="fw-bold mb-3">Requisitos:</h6>
                                    <ul className="ps-3">
                                        {selectedJob.requirements.map((req, idx) => (
                                            <li key={idx} className="mb-2" style={{ lineHeight: '1.6' }}>
                                                {req}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </CardBody>
                        </Card>
                    ) : (
                        <Card className="h-100 d-flex align-items-center justify-content-center">
                            <CardBody className="text-center">
                                <Briefcase size={48} className="text-muted mb-3" />
                                <h5 className="text-muted">Selecciona un empleo para ver los detalles</h5>
                            </CardBody>
                        </Card>
                    )}
                </Col>
            </Row>
        </Container>
    );
};

export default Applications;
