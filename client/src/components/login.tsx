import React, { useState } from "react";
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
    const navigate = useNavigate();

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
                const validUsernames = AuthService.getValidUsernames();
                setError("Usuario no encontrado. Usuarios válidos: " + validUsernames.join(", "));
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
                <Col md="6" lg="4">
                    <Card className={styles.loginCard}>
                        <CardBody>
                            <CardTitle tag="h3" className="text-center mb-4">
                                MagnetoQuest
                            </CardTitle>
                            <CardTitle tag="h5" className="text-center mb-4 text-muted">
                                Iniciar Sesión
                            </CardTitle>

                            <Form onSubmit={handleSubmit}>
                                <FormGroup>
                                    <Label for="username">Nombre de Usuario</Label>
                                    <Input
                                        type="text"
                                        name="username"
                                        id="username"
                                        placeholder="Ingresa tu nombre de usuario"
                                        value={username}
                                        onChange={(e) => setUsername(e.target.value)}
                                        disabled={isLoading}
                                    />
                                </FormGroup>

                                {error && (
                                    <Alert color="danger" className="mb-3">
                                        {error}
                                    </Alert>
                                )}

                                <Button
                                    color="primary"
                                    block
                                    type="submit"
                                    disabled={isLoading || !username.trim()}
                                >
                                    {isLoading ? "Verificando..." : "Iniciar Sesión"}
                                </Button>
                            </Form>

                            <div className="mt-3 text-center">
                                <small className="text-muted">
                                    Usuarios de prueba: {AuthService.getValidUsernames().join(", ")}
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