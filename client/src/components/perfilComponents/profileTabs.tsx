import React, { useState } from "react";
import styles from "./profileTabs.module.css";
import ProjectCertificate from "./ProjectCertificate";
import PerformanceTrivia from "./PerformanceTrivia";
import CVForm from "./CVForm";
import {
  TabContent, TabPane,
  Card, CardBody
} from "reactstrap";

type Tab = {
  id: string;
  label: string;
  icon?: React.ReactNode;
};

const TABS: Tab[] = [
  { id: "perfil", label: "Editar Perfil", icon: <span className={styles.icon}>👤</span> },
  { id: "cv", label: "Diseño de mi hoja de vida", icon: <span className={styles.icon}>🗂️</span> },
  { id: "proyectos", label: "Proyectos y Certificados", icon: <span className={styles.icon}>📄</span> },
  { id: "rendimientoTrivias", label: "Rendimiento en mis trivias", icon: <span className={styles.icon}>🎯</span> },
];

export default function ProfileTabs() {
  const [active, setActive] = useState("perfil");

  return (
    <>
      <nav className={styles.navbar} role="tablist" aria-label="Opciones de perfil">
        {TABS.map(tab => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActive(tab.id)}
            className={`${styles.tab} ${active === tab.id ? styles.tabActive : ""}`}
            role="tab"
            aria-selected={active === tab.id}
          >
            {tab.icon}
            <span>{tab.label}</span>
          </button>
        ))}
      </nav>
      {/* Contenido de cada tab */}
      <TabContent activeTab={active}>
        <TabPane tabId="perfil">
          <Card>
            <CardBody>
              <h5 className="mb-3">Editar Perfil</h5>
              {/* aquí tu formulario de perfil */}
              <p>Formulario con datos personales, foto, etc.</p>
            </CardBody>
          </Card>
        </TabPane>

        <TabPane tabId="cv">
          <Card>
            <CardBody>
              <CVForm />
            </CardBody>
          </Card>
        </TabPane>

        <TabPane tabId="proyectos">
          <Card>
            <CardBody>
              <h5 className="mb-3">Proyectos y Certificados</h5>
              {/* Componente que maneja los tabs internos de proyectos/certificados */}
              <ProjectCertificate />
            </CardBody>
          </Card>
        </TabPane>

        <TabPane tabId="rendimientoTrivias">
          <Card>
            <CardBody>
              <h5 className="mb-3"></h5>
              {/* Componente que maneja los tabs internos de proyectos/certificados */}
              <PerformanceTrivia />
            </CardBody>
          </Card>
        </TabPane>
      </TabContent>
    </>
  );
}
