import React from "react";
import { Container } from "reactstrap";

const Footer: React.FC = () => {
  return (
    <footer className="bg-dark text-light py-3 mt-auto">
      <Container className="text-center">
        <small>© {new Date().getFullYear()} Metroverso</small>
      </Container>
    </footer>
  );
};

export default Footer;
