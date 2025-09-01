import React from "react";
import { Navbar, NavbarBrand, Nav, NavItem, NavbarText } from "reactstrap";
import { NavLink as RRNavLink } from "react-router-dom";

const Header: React.FC = () => {
    return (
        <Navbar color="dark" dark expand="md" className="mb-4 px-3">
            <NavbarBrand href="/">MagnetoQuest</NavbarBrand>
            <Nav className="me-auto" navbar>
                <NavItem>
                    <RRNavLink to="/" className="nav-link">
                        Inicio
                    </RRNavLink>
                </NavItem>
                <NavItem>
                    <RRNavLink to="/perfil" className="nav-link">
                        Perfil
                    </RRNavLink>
                </NavItem>
                <NavItem>
                    <RRNavLink to="/misiones" className="nav-link">
                        Misiones
                    </RRNavLink>
                </NavItem>
                <NavItem>
                    <RRNavLink to="/home" className="nav-link">
                        Trivia
                    </RRNavLink>
                </NavItem>
            </Nav>
            <NavbarText>
                <RRNavLink to="/inicioSesion" className="nav-link">Iniciar Sesión
                </RRNavLink>
            </NavbarText>
        </Navbar>
    );
};

export default Header;
