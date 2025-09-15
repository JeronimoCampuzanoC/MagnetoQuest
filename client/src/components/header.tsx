import styles from "./header.module.css";
import React, { useState } from "react";
import {
    Navbar,
    NavbarBrand,
    Nav,
    NavItem,
    NavbarText,
    Button,
    Offcanvas,
    OffcanvasHeader,
    OffcanvasBody,
} from "reactstrap";
import { NavLink as RRNavLink } from "react-router-dom";
import SearchBar from "./searchBar";

const Header: React.FC = () => {
    const [isOpen, setIsOpen] = useState(false);
    const toggle = () => setIsOpen(v => !v);

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
                    <NavItem className={styles.lettersItem}><RRNavLink to="/" className="nav-link">Empleo</RRNavLink></NavItem>
                    <NavItem className={styles.lettersItem}><RRNavLink to="/perfil" className="nav-link">Ver todo</RRNavLink></NavItem>
                    <NavItem className={styles.lettersItem}><RRNavLink to="/misiones" className="nav-link">Sugeridos</RRNavLink></NavItem>
                    <NavItem className={styles.lettersItem}><RRNavLink to="/home" className="nav-link">Guardados</RRNavLink></NavItem>
                    <NavItem className={styles.lettersItem}><RRNavLink to="/home" className="nav-link">En proceso</RRNavLink></NavItem>
                </Nav>


                {/*Profile and CV*/}
                <NavbarText>
                    <div className="d-flex align-items-center gap-2">
                        <Button className={styles.cvPill} size="sm"> 
                            Hoja de vida
                        </Button>

                        <button aria-label="Perfil"  // onClick={onAvatarClick} // onClick={onCvClick}
                            className={styles.avatarBtn}>
                            {/* SVG icono usuario */}
                            <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
                                stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M20 21a8 8 0 0 0-16 0" />
                                <circle cx="12" cy="7" r="4" />
                            </svg>
                        </button>
                    </div>
                </NavbarText>
            </Navbar>

            {/* Offcanvas (contiene los links para < md + tus extras) */}
            <Offcanvas isOpen={isOpen} toggle={toggle} direction="start">
                <OffcanvasHeader toggle={toggle}>Menú</OffcanvasHeader>
                <OffcanvasBody>
                    <div className="d-md-none mb-3">
                        <Nav navbar vertical>
                            <NavItem><RRNavLink to="/" className="nav-link" onClick={toggle}>Inicio</RRNavLink></NavItem>
                            <NavItem><RRNavLink to="/perfil" className="nav-link" onClick={toggle}>Perfil</RRNavLink></NavItem>
                            <NavItem><RRNavLink to="/misiones" className="nav-link" onClick={toggle}>Misiones</RRNavLink></NavItem>
                            <NavItem><RRNavLink to="/home" className="nav-link" onClick={toggle}>Trivia</RRNavLink></NavItem>
                            <NavItem className="mt-2"><RRNavLink to="/inicioSesion" className="nav-link" onClick={toggle}>Iniciar Sesión</RRNavLink></NavItem>
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
