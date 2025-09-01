import React, { useState } from "react";
import {
  Nav, NavItem, NavLink,
  TabContent, TabPane,
  Card, CardBody
} from "reactstrap";

type TabKey = "Editar perfil" | "Hoja de vida" | "Proyectos y certificados";

const ProfileTabs: React.FC = () => {
  const [active, setActive] = useState<TabKey>("Editar perfil");

  return (
    <>
      {/* Header secundario (tabs) */}
      <Nav pills className="gap-2 mb-3">
        <NavItem>
          <NavLink
            href="#"
            active={active === "Editar perfil"}
            onClick={(e) => { e.preventDefault(); setActive("Editar perfil"); }}
            className="d-flex align-items-center gap-2"
          >
            {/* <User size={16} /> */}
            Editar Perfil
          </NavLink>
        </NavItem>

        <NavItem>
          <NavLink
            href="#"
            active={active === "Hoja de vida"}
            onClick={(e) => { e.preventDefault(); setActive("Hoja de vida"); }}
            className="d-flex align-items-center gap-2"
          >
            {/* <FileText size={16} /> */}
            Diseño de mi hoja de vida
          </NavLink>
        </NavItem>

        <NavItem>
          <NavLink
            href="#"
            active={active === "Proyectos y certificados"}
            onClick={(e) => { e.preventDefault(); setActive("Proyectos y certificados"); }}
            className="d-flex align-items-center gap-2"
          >
            {/* <Layers size={16} /> */}
            Proyectos y Certificados
          </NavLink>
        </NavItem>
      </Nav>

      {/* Contenido de cada tab */}
      <TabContent activeTab={active}>
        <TabPane tabId="Editar perfil">
          <Card>
            <CardBody>
              <h5 className="mb-3">Editar Perfil</h5>
              {/* aquí tu formulario de perfil */}
              <p>Formulario con datos personales, foto, etc.</p>
            </CardBody>
          </Card>
        </TabPane>

        <TabPane tabId="Hoja de vida">
          <Card>
            <CardBody>
              <h5 className="mb-3">Diseño de mi hoja de vida</h5>
              {/* constructor/preview del CV */}
              <p>Selecciona plantilla, colores, exporta PDF…</p>
            </CardBody>
          </Card>
        </TabPane>

        <TabPane tabId="Proyectos y certificados">
          <Card>
            <CardBody>
              <h5 className="mb-3">Proyectos y Certificados</h5>
              {/* listado de proyectos / uploads de certificados */}
              <p>Sube certificados, agrega repos, links, etc.</p>
            </CardBody>
          </Card>
        </TabPane>
      </TabContent>
    </>
  );
};

export default ProfileTabs;
