import styles from "./header.module.css";
import React, { useState } from "react";
import {
    Navbar,
    Nav,
    NavItem,
    NavbarText,
    Button,
    Offcanvas,
    OffcanvasHeader,
    OffcanvasBody,
    Dropdown,
    DropdownToggle,
    DropdownMenu,
    DropdownItem,
} from "reactstrap";
import { NavLink as RRNavLink, useNavigate } from "react-router-dom";
import SearchBar from "./searchBar";
import { AuthService } from "../services/authService";

const Header: React.FC = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const navigate = useNavigate();
    const currentUser = AuthService.getCurrentUser();
    const username = currentUser?.name || currentUser?.username || "Usuario";

    const toggle = () => setIsOpen(v => !v);
    const toggleDropdown = () => setDropdownOpen(v => !v);

    const handleLogout = () => {
        AuthService.clearSession();
        // Dispatch custom event to notify App component
        window.dispatchEvent(new Event("logout"));
        navigate("/");
    };

    return (
        <>
            <Navbar expand="md" className={`${styles.navCustom} mb-4 px-3`}>
                {/* Toggle*/}
                <Button onClick={toggle} aria-label="Abrir menú" className={`${styles.toggleButton} me-2 p-2 bg-transparent border-0`} >
                    <span className="navbar-toggler-icon" />
                </Button>

                {/* Logo*/}
                <img src="static/magneto.svg" alt="MagnetoQuest" height="35" className="d-inline-block align-top" />

                {/*Search input*/}
                <div className={`${styles.positonSearchBar} d-none d-md-flex flex-grow-1 px-3`}>
                    <SearchBar onSearch={(q) => console.log("buscar:", q)} />
                </div>

                {/* Links*/}
                <Nav className="me-auto d-none d-md-flex" navbar>
                    <NavItem className={styles.lettersItem}><RRNavLink to="/empleos" className="nav-link">Empleos</RRNavLink></NavItem>
                    <NavItem className={styles.lettersItem}><RRNavLink to="/home" className="nav-link">Ver Todo</RRNavLink></NavItem>
                    <NavItem className={styles.lettersItem}><RRNavLink to="/perfil" className="nav-link">Perfil</RRNavLink></NavItem>
                    <NavItem className={styles.lettersItem}><RRNavLink to="/misiones" className="nav-link">Misiones</RRNavLink></NavItem>
                    <NavItem className={styles.lettersItem}><RRNavLink to="/home" className="nav-link">En progreso</RRNavLink></NavItem>
                </Nav>


                {/*Profile and CV*/}
                <NavbarText>
                    <div className="d-flex align-items-center gap-2">
                        <Button className={styles.cvPill} size="sm">
                            Hoja de vida
                        </Button>

                        <Dropdown isOpen={dropdownOpen} toggle={toggleDropdown}>
                            <DropdownToggle tag="button" aria-label="Perfil"
                                className={styles.avatarBtn}>
                                {/* SVG icono usuario */}
                                <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
                                    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M20 21a8 8 0 0 0-16 0" />
                                    <circle cx="12" cy="7" r="4" />
                                </svg>
                            </DropdownToggle>
                            <DropdownMenu end className={styles.userDropdown}>
                                <DropdownItem header>
                                    Hola, {username}
                                </DropdownItem>
                                <DropdownItem divider />
                                <DropdownItem onClick={() => navigate("/perfil")}>
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="me-2">
                                        <path d="M20 21a8 8 0 0 0-16 0" />
                                        <circle cx="12" cy="7" r="4" />
                                    </svg>
                                    Ver Perfil
                                </DropdownItem>
                                <DropdownItem divider />
                                <DropdownItem onClick={handleLogout}>
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="me-2">
                                        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                                        <polyline points="16,17 21,12 16,7" />
                                        <line x1="21" y1="12" x2="9" y2="12" />
                                    </svg>
                                    Cerrar Sesión
                                </DropdownItem>
                            </DropdownMenu>
                        </Dropdown>
                    </div>
                </NavbarText>
            </Navbar>

            {/* Offcanvas (contiene los links para < md + tus extras) */}
            <Offcanvas isOpen={isOpen} toggle={toggle} direction="start">
                <OffcanvasHeader toggle={toggle}>Menú</OffcanvasHeader>
                <OffcanvasBody>
                    <div className="d-md-none mb-3">
                        <Nav navbar vertical>
                            <NavItem><RRNavLink to="/home" className="nav-link" onClick={toggle}>Inicio</RRNavLink></NavItem>
                            <NavItem><RRNavLink to="/perfil" className="nav-link" onClick={toggle}>Perfil</RRNavLink></NavItem>
                            <NavItem><RRNavLink to="/misiones" className="nav-link" onClick={toggle}>Misiones</RRNavLink></NavItem>
                            <NavItem><RRNavLink to="/home" className="nav-link" onClick={toggle}>Trivia</RRNavLink></NavItem>
                            <NavItem className="mt-2">
                                <Button color="danger" size="sm" onClick={() => { handleLogout(); toggle(); }} className="w-100">
                                    Cerrar Sesión
                                </Button>
                            </NavItem>
                        </Nav>
                        <hr />
                    </div>

                    <Nav navbar vertical>
                        <NavItem><RRNavLink to="/ajustes" className="nav-link" onClick={toggle}>⚙️ Ajustes</RRNavLink></NavItem>
                        <NavItem><RRNavLink to="/ayuda" className="nav-link" onClick={toggle}>❓ Ayuda</RRNavLink></NavItem>
                        <NavItem><RRNavLink to="/acerca" className="nav-link" onClick={toggle}>ℹ️ Acerca de</RRNavLink></NavItem>
                    </Nav>
                </OffcanvasBody>
            </Offcanvas>
        </>
    );
};

export default Header;
