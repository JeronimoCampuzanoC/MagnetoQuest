-- Enable UUIDs (for unique identifiers)
CREATE EXTENSION IF NOT EXISTS pgcrypto;


CREATE TABLE usuario (
  id_usuario UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre TEXT NOT NULL,
  sector TEXT,                 
  cargo_objetivo TEXT,
  salario_minimo NUMERIC(12,2),
  nivel_estudios TEXT,
  disponible_para TEXT,
  ciudad TEXT
);


CREATE TABLE hoja_vida (
  id_hoja_vida UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  id_usuario UUID NOT NULL REFERENCES usuario(id_usuario) ON DELETE CASCADE,
  descripcion TEXT,
  experiencia TEXT,
  cursos TEXT,
  proyectos TEXT,
  idiomas TEXT,
  referencias TEXT
);


CREATE TABLE proyecto (
  id_proyecto UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  id_usuario UUID NOT NULL REFERENCES usuario(id_usuario) ON DELETE CASCADE,
  titulo TEXT NOT NULL,
  descripcion TEXT,
  url TEXT,
  imagen_previsualizacion TEXT,  
  documento TEXT                  
);


CREATE TABLE certificado (
  id_certificado UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  id_usuario UUID NOT NULL REFERENCES usuario(id_usuario) ON DELETE CASCADE,
  titulo TEXT NOT NULL,
  descripcion TEXT,
  imagen TEXT,                    
  link_validacion TEXT
);


CREATE TABLE insignia (
  id_insignia UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre_insignia TEXT NOT NULL,
  puntaje_insignia INT NOT NULL,
  categoria TEXT,
  parametro TEXT,
  cantidad INT
);


CREATE TABLE progreso_insignia (
  id_progreso UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  id_usuario UUID NOT NULL REFERENCES usuario(id_usuario) ON DELETE CASCADE,
  id_insignia UUID NOT NULL REFERENCES insignia(id_insignia) ON DELETE CASCADE,
  progreso INT NOT NULL DEFAULT 0
);
