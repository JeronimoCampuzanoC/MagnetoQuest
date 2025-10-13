// import React, { useEffect, useState } from "react";
// import {
//   Container,
//   Row,
//   Col,
//   Card,
//   CardBody,
//   CardTitle,
//   Button,
//   Spinner,
//   Alert,
//   ListGroup,
//   ListGroupItem,
// } from "reactstrap";

// type User = {
//   id: number | string;
//   name: string;
// };

// function getErrorMessage(e: unknown): string {
//   if (e instanceof Error) return e.message;
//   try {
//     return String(e);
//   } catch {
//     return "Error desconocido";
//   }
// }

// const App: React.FC = () => {
//   // Saludo /api/hello
//   const [msg, setMsg] = useState<string>("Cargando…");
//   const [time, setTime] = useState<number | string | null>(null);
//   const [error, setError] = useState<string | null>(null);

//   // Usuarios /api/users
//   const [users, setUsers] = useState<User[]>([]);
//   const [usersLoading, setUsersLoading] = useState<boolean>(false);
//   const [usersError, setUsersError] = useState<string | null>(null);

//   async function loadHello(): Promise<void> {
//     try {
//       setError(null);
//       const res = await fetch("/api/hello");
//       if (!res.ok) throw new Error("HTTP " + res.status);
//       const data: { message?: string; timestamp?: number | string } = await res.json();
//       setMsg(data.message ?? "Sin mensaje");
//       setTime(data.timestamp ?? null);
//     } catch (e) {
//       setError(getErrorMessage(e));
//     }
//   }

//   async function loadUsers(): Promise<void> {
//     try {
//       setUsersError(null);
//       setUsersLoading(true);
//       const res = await fetch("/api/users");
//       if (!res.ok) throw new Error("HTTP " + res.status);
//       const data: unknown = await res.json(); // podría venir cualquier cosa
//       setUsers(Array.isArray(data) ? (data as User[]) : []);
//     } catch (e) {
//       setUsersError(getErrorMessage(e));
//     } finally {
//       setUsersLoading(false);
//     }
//   }

//   useEffect(() => {
//     void loadHello();
//   }, []);

//   return (
//     <Container className="py-4">
//       <Row className="mb-4">
//         <Col>
//           <h1 className="h3 mb-0">PoC React (TS) + Express</h1>
//         </Col>
//       </Row>

//       {/* Sección /api/hello */}
//       <Row className="mb-4">
//         <Col md="6">
//           <Card>
//             <CardBody>
//               <CardTitle tag="h5" className="mb-3">
//                 Saludo del backend
//               </CardTitle>

//               {error ? (
//                 <Alert color="danger" className="mb-3">
//                   Error: {error}
//                 </Alert>
//               ) : (
//                 <p className="mb-2">{msg}</p>
//               )}

//               {time && (
//                 <p className="text-muted mb-3">
//                   <small>{new Date(time).toLocaleString()}</small>
//                 </p>
//               )}

//               <Button color="primary" onClick={loadHello}>
//                 Volver a llamar
//               </Button>
//             </CardBody>
//           </Card>
//         </Col>
//       </Row>

//       {/* Sección /api/users */}
//       <Row>
//         <Col md="6">
//           <Card>
//             <CardBody>
//               <CardTitle tag="h5" className="mb-3">
//                 Usuarios (desde la base de datos)
//               </CardTitle>

//               <div className="d-flex gap-2 mb-3">
//                 <Button color="secondary" onClick={loadUsers} disabled={usersLoading}>
//                   {usersLoading ? (
//                     <>
//                       <Spinner size="sm" /> Cargando…
//                     </>
//                   ) : (
//                     "Cargar usuarios"
//                   )}
//                 </Button>
//               </div>

//               {usersError && <Alert color="danger">Error: {usersError}</Alert>}

//               {!usersLoading && users.length === 0 && !usersError && (
//                 <Alert color="info" className="mb-0">
//                   Sin usuarios aún.
//                 </Alert>
//               )}

//               {users.length > 0 && (
//                 <ListGroup>
//                   {users.map((u) => (
//                     <ListGroupItem key={u.id}>
//                       <strong>{u.id}</strong> — {u.name}
//                     </ListGroupItem>
//                   ))}
//                 </ListGroup>
//               )}
//             </CardBody>
//           </Card>
//         </Col>
//       </Row>
//     </Container>
//   );
// };

// export default App;

import React, { useState, useEffect } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import styles from "./App.module.css";
import Header from "../components/header";
import TriviaApp from "./triviaApp";
import Misiones from "./misiones";
import Perfil from "./perfil";
import Notifications from "../components/notifications";
import Login from "../components/login";
import ProtectedRoute from "../components/protectedRoute";

const App: React.FC = () => {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);

  useEffect(() => {
    // Check if user is logged in on app load
    const username = localStorage.getItem("username");
    setIsLoggedIn(username !== null);

    // Listen for storage changes (in case user logs out in another tab)
    const handleStorageChange = () => {
      const username = localStorage.getItem("username");
      setIsLoggedIn(username !== null);
    };

    window.addEventListener("storage", handleStorageChange);

    // Custom events for same-tab login/logout
    const handleLogout = () => {
      setIsLoggedIn(false);
    };

    const handleLogin = () => {
      setIsLoggedIn(true);
    };

    window.addEventListener("logout", handleLogout);
    window.addEventListener("login", handleLogin);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("logout", handleLogout);
      window.removeEventListener("login", handleLogin);
    };
  }, []);

  return (
    <div className={styles.appContainer}>
      {isLoggedIn && <Header />}
      {isLoggedIn && <Notifications />}
      <Routes>
        <Route
          path="/"
          element={
            isLoggedIn ? <Navigate to="/home" replace /> : <Login />
          }
        />
        <Route
          path="/home"
          element={
            <ProtectedRoute>
              <TriviaApp />
            </ProtectedRoute>
          }
        />
        <Route
          path="/perfil"
          element={
            <ProtectedRoute>
              <Perfil />
            </ProtectedRoute>
          }
        />
        <Route
          path="/misiones"
          element={
            <ProtectedRoute>
              <Misiones />
            </ProtectedRoute>
          }
        />
      </Routes>
    </div>
  );
};

export default App;
