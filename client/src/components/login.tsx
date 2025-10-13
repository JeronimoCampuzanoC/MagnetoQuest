import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
    Container,
    Row,
    Col,
    Card,
    CardBody,
    CardTitle,
    Form,
    FormGroup,
    Label,
    Input,
    Button,
    Alert
} from "reactstrap";
import styles from "./login.module.css";
import { AuthService } from "../services/authService";

const Login: React.FC = () => {
    const [username, setUsername] = useState<string>("");
    const [error, setError] = useState<string>("");
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [availableUsers, setAvailableUsers] = useState<string[]>([]);
    const navigate = useNavigate();

    // Load available users on component mount
    useEffect(() => {
        const loadUsers = async () => {
            try {
                const users = await AuthService.getValidUsernames();
                setAvailableUsers(users);
            } catch (error) {
                console.error('Error loading users:', error);
                setAvailableUsers(['Error loading users']);
            }
        };
        loadUsers();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!username.trim()) {
            setError("Por favor, ingresa un nombre de usuario");
            return;
        }

        setIsLoading(true);
        setError("");

        try {
            const user = await AuthService.validateUser(username);

            if (user) {
                // Save user session
                AuthService.saveSession(user);
                // Dispatch custom event to notify App component
                window.dispatchEvent(new Event("login"));
                // Navigate to home
                navigate("/home");
            } else {
                setError("Usuario no encontrado. Usuarios disponibles: " + availableUsers.join(", "));
            }
        } catch (error) {
            setError("Error al conectar con el servidor. Intenta de nuevo.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Container className={styles.loginContainer}>
            <Row className="justify-content-center">
                <Col md="50" lg="80" xl="200">
                    <Card className={styles.loginCard}>
                        <CardBody>
                            <div className={styles.logoContainer}>
                                <img
                                    src="/static/magnetoQuestTrivia.png"
                                    alt="MagnetoQuest"
                                    className={styles.logoImage}
                                />
                                <CardTitle tag="h5" className="text-center text-muted">
                                    Iniciar Sesión
                                </CardTitle>
                            </div>

                            <Form onSubmit={handleSubmit}>
                                <FormGroup className="mb-3">
                                    <Label for="username" className={styles.formLabel}>
                                        Nombre de Usuario
                                    </Label>
                                    <Input
                                        type="text"
                                        name="username"
                                        id="username"
                                        placeholder="Ingresa tu nombre de usuario"
                                        value={username}
                                        onChange={(e) => setUsername(e.target.value)}
                                        disabled={isLoading}
                                        className="form-control"
                                    />
                                </FormGroup>

                                {error && (
                                    <Alert color="danger">
                                        {error}
                                    </Alert>
                                )}

                                <Button
                                    color="primary"
                                    type="submit"
                                    disabled={isLoading || !username.trim()}
                                    className="w-100"
                                >
                                    {isLoading ? (
                                        <>
                                            <span className="spinner-border spinner-border-sm me-2" />
                                            Verificando...
                                        </>
                                    ) : (
                                        "Iniciar Sesión"
                                    )}
                                </Button>
                            </Form>

                            <div className={styles.divider}>
                                Usuarios de prueba
                            </div>

                            <div className={styles.testUsers}>
                                <small>
                                    {availableUsers.join(" • ")}
                                </small>
                            </div>
                        </CardBody>
                    </Card>
                </Col>
            </Row>
        </Container>
    );
};

export default Login;