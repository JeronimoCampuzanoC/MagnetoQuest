-- Enable UUIDs (for unique identifiers)
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TYPE mission_status AS ENUM ('not_started', 'in_progress', 'completed');

CREATE TYPE difficulty     AS ENUM ('easy', 'medium', 'hard');

CREATE TYPE mission_category AS ENUM ('Trivia', 'Certificate', 'Project', 'CV');

CREATE TABLE app_user (
    id_app_user UUID PRIMARY KEY DEFAULT gen_random_uuid (),
    name TEXT NOT NULL,
    email TEXT,
    sector TEXT,
    interest_field TEXT,
    target_position TEXT,
    minimum_salary NUMERIC(12, 2),
    education_level TEXT,
    availability TEXT,
    city TEXT
);

CREATE TABLE resume (
    id_resume UUID PRIMARY KEY DEFAULT gen_random_uuid (),
    id_app_user UUID NOT NULL REFERENCES app_user (id_app_user) ON DELETE CASCADE,
    description TEXT,
    experience TEXT,
    courses TEXT,
    projects TEXT,
    languages TEXT,
    references_cv TEXT
);

CREATE TABLE project (
    project_id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
    user_id UUID NOT NULL REFERENCES app_user (id_app_user) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    url TEXT,
    preview_image TEXT,
    document TEXT,
    project_date DATE
);

CREATE TABLE certificate (
    certificate_id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
    user_id UUID NOT NULL REFERENCES app_user (id_app_user) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    image TEXT,
    validation_link TEXT
);

CREATE TABLE badge (
    badge_id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
    badge_name TEXT NOT NULL,
    badge_score INT NOT NULL CHECK (badge_score >= 0),
    category TEXT,
    parameter TEXT,
    quantity INT CHECK (
        quantity IS NULL
        OR quantity >= 0
    )
);

CREATE TABLE badge_progress (
    progress_id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
    user_id UUID NOT NULL REFERENCES app_user (id_app_user) ON DELETE CASCADE,
    badge_id UUID NOT NULL REFERENCES badge (badge_id) ON DELETE CASCADE,
    progress INT NOT NULL DEFAULT 0 CHECK (progress >= 0),
    awarded_at TIMESTAMPTZ,
    UNIQUE (user_id, badge_id)
);

CREATE TABLE mission (
    mission_id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
    title TEXT NOT NULL,
    description TEXT,
    category mission_category,
    xp_reward INT NOT NULL DEFAULT 10 CHECK (xp_reward >= 0),
    objective INT NOT NULL DEFAULT 1 CHECK (objective >= 1),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE user_mission_progress (
    ump_id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
    user_id UUID NOT NULL REFERENCES app_user (id_app_user) ON DELETE CASCADE,
    mission_id UUID NOT NULL REFERENCES mission (mission_id) ON DELETE CASCADE,
    status mission_status NOT NULL DEFAULT 'not_started',
    progress INT NOT NULL DEFAULT 0 CHECK (progress >= 0),
    starts_at TIMESTAMPTZ,
    ends_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    UNIQUE (user_id, mission_id),
    CHECK (
        ends_at IS NULL
        OR starts_at IS NULL
        OR ends_at > starts_at
    )
);

CREATE TABLE trivia_attempt (
    attempt_id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
    user_id UUID NOT NULL REFERENCES app_user (id_app_user) ON DELETE CASCADE,
    category TEXT,
    difficulty difficulty NOT NULL DEFAULT 'medium',
    score INT NOT NULL CHECK (score >= 0),
    total_time INT NOT NULL CHECK (total_time >= 0),
    precision_score INT NOT NULL CHECK (precision_score >= 0),
    attempted_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE notification_log (
    notification_id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
    user_id UUID NOT NULL REFERENCES app_user (id_app_user) ON DELETE CASCADE,
    channel TEXT NOT NULL,
    template TEXT,
    sent_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    metadata JSONB
);

CREATE TABLE user_progress (
    progress_id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
    user_id UUID NOT NULL REFERENCES app_user (id_app_user) ON DELETE CASCADE,
    streak INT NOT NULL DEFAULT 0 CHECK (streak >= 0),
    has_done_today BOOLEAN NOT NULL DEFAULT FALSE,
    magento_points INT NOT NULL DEFAULT 0 CHECK (magento_points >= 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (user_id)
);

-- =========================
-- SEED: APP DATA (10 users)
-- =========================
INSERT INTO
    app_user (
        name,
        email,
        sector,
        target_position,
        minimum_salary,
        education_level,
        availability,
        city
    )
VALUES (
        'Ana Torres',
        'ana@example.com',
        'Tecnología',
        'Frontend Dev',
        3500.00,
        'Universitario',
        'Tiempo completo',
        'Bogotá'
    ),
    (
        'Luis Pérez',
        'luis@example.com',
        'Tecnología',
        'Backend Dev',
        3800.00,
        'Universitario',
        'Remoto',
        'Medellín'
    ),
    (
        'María Gómez',
        'maria@example.com',
        'Salud',
        'Analista Datos',
        4200.00,
        'Maestría',
        'Híbrido',
        'Cali'
    ),
    (
        'Carlos Díaz',
        'carlos@example.com',
        'Educación',
        'PM Jr',
        4000.00,
        'Universitario',
        'Tiempo completo',
        'Barranquilla'
    ),
    (
        'Sofía Rojas',
        'sofia@example.com',
        'Finanzas',
        'Data Eng Jr',
        4500.00,
        'Universitario',
        'Remoto',
        'Bogotá'
    ),
    (
        'Jorge Herrera',
        'jorge@example.com',
        'Marketing',
        'UX Researcher',
        3200.00,
        'Universitario',
        'Híbrido',
        'Bucaramanga'
    ),
    (
        'Valentina Ruiz',
        'valen@example.com',
        'Tecnología',
        'QA Analyst',
        3000.00,
        'Técnico',
        'Tiempo completo',
        'Pereira'
    ),
    (
        'Andrés Ramírez',
        'andres@example.com',
        'Tecnología',
        'Fullstack Jr',
        3600.00,
        'Universitario',
        'Remoto',
        'Manizales'
    ),
    (
        'Camila López',
        'camila@example.com',
        'Diseño',
        'Product Designer',
        3700.00,
        'Universitario',
        'Híbrido',
        'Cartagena'
    ),
    (
        'Diego Castillo',
        'diego@example.com',
        'Tecnología',
        'DevOps Jr',
        3900.00,
        'Universitario',
        'Remoto',
        'Medellín'
    );

-- =========================
-- SEED: RESUME (10)
-- =========================
INSERT INTO
    resume (
        id_app_user,
        description,
        experience,
        courses,
        projects,
        languages,
        references_cv
    )
VALUES (
        (
            SELECT id_app_user
            FROM app_user
            ORDER BY name
            LIMIT 1
            OFFSET
                0
        ),
        'Dev front apasionada por React.',
        '6m en landing pages',
        'React Basics',
        'Portfolio web',
        'ES, EN',
        'Ref A'
    ),
    (
        (
            SELECT id_app_user
            FROM app_user
            ORDER BY name
            LIMIT 1
            OFFSET
                1
        ),
        'Back con Node',
        '1a Node/Express',
        'Node Avanzado',
        'API REST',
        'ES',
        'Ref B'
    ),
    (
        (
            SELECT id_app_user
            FROM app_user
            ORDER BY name
            LIMIT 1
            OFFSET
                2
        ),
        'Data analyst',
        '1a Analytics',
        'SQL, PowerBI',
        'Dashboard BI',
        'ES, EN',
        'Ref C'
    ),
    (
        (
            SELECT id_app_user
            FROM app_user
            ORDER BY name
            LIMIT 1
            OFFSET
                3
        ),
        'PM Jr',
        '1a coord. equipos',
        'Scrum',
        'Kanban board',
        'ES',
        'Ref D'
    ),
    (
        (
            SELECT id_app_user
            FROM app_user
            ORDER BY name
            LIMIT 1
            OFFSET
                4
        ),
        'Data Eng Jr',
        '6m ETL',
        'Python ETL',
        'Pipeline demo',
        'ES, EN',
        'Ref E'
    ),
    (
        (
            SELECT id_app_user
            FROM app_user
            ORDER BY name
            LIMIT 1
            OFFSET
                5
        ),
        'UX Researcher',
        '1a research',
        'UX Foundations',
        'User studies',
        'ES',
        'Ref F'
    ),
    (
        (
            SELECT id_app_user
            FROM app_user
            ORDER BY name
            LIMIT 1
            OFFSET
                6
        ),
        'QA Analyst',
        '1a testing',
        'Cypress',
        'Auto tests',
        'ES',
        'Ref G'
    ),
    (
        (
            SELECT id_app_user
            FROM app_user
            ORDER BY name
            LIMIT 1
            OFFSET
                7
        ),
        'Fullstack Jr',
        '1a MERN',
        'Typescript',
        'App CRUD',
        'ES, EN',
        'Ref H'
    ),
    (
        (
            SELECT id_app_user
            FROM app_user
            ORDER BY name
            LIMIT 1
            OFFSET
                8
        ),
        'Product Designer',
        '6m UI kits',
        'Figma Avanz.',
        'Design system',
        'ES',
        'Ref I'
    ),
    (
        (
            SELECT id_app_user
            FROM app_user
            ORDER BY name
            LIMIT 1
            OFFSET
                9
        ),
        'DevOps Jr',
        '6m CI/CD',
        'Docker/K8s',
        'CI pipelines',
        'ES, EN',
        'Ref J'
    );

-- =========================
-- SEED: PROJECT (10)
-- =========================
INSERT INTO
    project (
        user_id,
        title,
        description,
        url,
        preview_image,
        document,
        project_date
    )
VALUES (
        (
            SELECT id_app_user
            FROM app_user
            ORDER BY name
            LIMIT 1
            OFFSET
                0
        ),
        'E-commerce React',
        'Tienda demo con carrito',
        'https://ex1.shop',
        NULL,
        NULL,
        CURRENT_DATE - INTERVAL '300 days'
    ),
    (
        (
            SELECT id_app_user
            FROM app_user
            ORDER BY name
            LIMIT 1
            OFFSET
                1
        ),
        'API REST Node',
        'Auth + CRUD',
        'https://api.demo',
        NULL,
        NULL,
        CURRENT_DATE - INTERVAL '250 days'
    ),
    (
        (
            SELECT id_app_user
            FROM app_user
            ORDER BY name
            LIMIT 1
            OFFSET
                2
        ),
        'Dashboard BI',
        'Visualización ventas',
        NULL,
        NULL,
        NULL,
        CURRENT_DATE - INTERVAL '200 days'
    ),
    (
        (
            SELECT id_app_user
            FROM app_user
            ORDER BY name
            LIMIT 1
            OFFSET
                3
        ),
        'App Tareas',
        'Gestión ágil',
        NULL,
        NULL,
        NULL,
        CURRENT_DATE - INTERVAL '180 days'
    ),
    (
        (
            SELECT id_app_user
            FROM app_user
            ORDER BY name
            LIMIT 1
            OFFSET
                4
        ),
        'ETL Productos',
        'Pipeline Airflow',
        NULL,
        NULL,
        NULL,
        CURRENT_DATE - INTERVAL '150 days'
    ),
    (
        (
            SELECT id_app_user
            FROM app_user
            ORDER BY name
            LIMIT 1
            OFFSET
                5
        ),
        'Research Banking',
        'Estudio UX',
        NULL,
        NULL,
        NULL,
        CURRENT_DATE - INTERVAL '120 days'
    ),
    (
        (
            SELECT id_app_user
            FROM app_user
            ORDER BY name
            LIMIT 1
            OFFSET
                6
        ),
        'Suite Tests',
        'Cypress + Jest',
        NULL,
        NULL,
        NULL,
        CURRENT_DATE - INTERVAL '100 days'
    ),
    (
        (
            SELECT id_app_user
            FROM app_user
            ORDER BY name
            LIMIT 1
            OFFSET
                7
        ),
        'Blog Tech',
        'SSR con Next.js',
        'https://blog.dev',
        NULL,
        NULL,
        CURRENT_DATE - INTERVAL '90 days'
    ),
    (
        (
            SELECT id_app_user
            FROM app_user
            ORDER BY name
            LIMIT 1
            OFFSET
                8
        ),
        'Design System',
        'Tokens + librería UI',
        NULL,
        NULL,
        NULL,
        CURRENT_DATE - INTERVAL '60 days'
    ),
    (
        (
            SELECT id_app_user
            FROM app_user
            ORDER BY name
            LIMIT 1
            OFFSET
                9
        ),
        'Infra CI/CD',
        'Pipelines GitHub',
        NULL,
        NULL,
        NULL,
        CURRENT_DATE - INTERVAL '30 days'
    );

-- =========================
-- SEED: CERTIFICATE (10)
-- =========================
INSERT INTO
    certificate (
        user_id,
        title,
        description,
        image,
        validation_link
    )
VALUES (
        (
            SELECT id_app_user
            FROM app_user
            ORDER BY name
            LIMIT 1
            OFFSET
                0
        ),
        'Cert React',
        'Componentes y Hooks',
        NULL,
        'https://cert/1'
    ),
    (
        (
            SELECT id_app_user
            FROM app_user
            ORDER BY name
            LIMIT 1
            OFFSET
                1
        ),
        'Cert Node',
        'APIs y Auth',
        NULL,
        'https://cert/2'
    ),
    (
        (
            SELECT id_app_user
            FROM app_user
            ORDER BY name
            LIMIT 1
            OFFSET
                2
        ),
        'Cert SQL',
        'Consultas y Modelado',
        NULL,
        'https://cert/3'
    ),
    (
        (
            SELECT id_app_user
            FROM app_user
            ORDER BY name
            LIMIT 1
            OFFSET
                3
        ),
        'Cert Scrum',
        'Fundamentos Ágiles',
        NULL,
        'https://cert/4'
    ),
    (
        (
            SELECT id_app_user
            FROM app_user
            ORDER BY name
            LIMIT 1
            OFFSET
                4
        ),
        'Cert Python',
        'ETL/Data',
        NULL,
        'https://cert/5'
    ),
    (
        (
            SELECT id_app_user
            FROM app_user
            ORDER BY name
            LIMIT 1
            OFFSET
                5
        ),
        'Cert UX',
        'Investigación',
        NULL,
        'https://cert/6'
    ),
    (
        (
            SELECT id_app_user
            FROM app_user
            ORDER BY name
            LIMIT 1
            OFFSET
                6
        ),
        'Cert Testing',
        'Automatización',
        NULL,
        'https://cert/7'
    ),
    (
        (
            SELECT id_app_user
            FROM app_user
            ORDER BY name
            LIMIT 1
            OFFSET
                7
        ),
        'Cert TS',
        'Typescript',
        NULL,
        'https://cert/8'
    ),
    (
        (
            SELECT id_app_user
            FROM app_user
            ORDER BY name
            LIMIT 1
            OFFSET
                8
        ),
        'Cert Figma',
        'UI Avanzado',
        NULL,
        'https://cert/9'
    ),
    (
        (
            SELECT id_app_user
            FROM app_user
            ORDER BY name
            LIMIT 1
            OFFSET
                9
        ),
        'Cert DevOps',
        'CI/CD',
        NULL,
        'https://cert/10'
    );

-- =========================
-- SEED: BADGE (10)
-- =========================
INSERT INTO
    badge (
        badge_name,
        badge_score,
        category,
        parameter,
        quantity
    )
VALUES (
        'Onboarding 10%',
        10,
        'perfil',
        'perfil_completo',
        1
    ),
    (
        'Onboarding 50%',
        50,
        'perfil',
        'perfil_completo',
        1
    ),
    (
        'Onboarding 100%',
        100,
        'perfil',
        'perfil_completo',
        1
    ),
    (
        'Primer Proyecto',
        20,
        'proyecto',
        'proyectos',
        1
    ),
    (
        '5 Proyectos',
        60,
        'proyecto',
        'proyectos',
        5
    ),
    (
        '10 Proyectos',
        120,
        'proyecto',
        'proyectos',
        10
    ),
    (
        'Primer Cert',
        15,
        'cert',
        'certificados',
        1
    ),
    (
        '3 Certs',
        45,
        'cert',
        'certificados',
        3
    ),
    (
        'Primer Intento',
        10,
        'trivia',
        'intentos_trivia',
        1
    ),
    (
        'Trivia Master',
        200,
        'trivia',
        'intentos_trivia',
        50
    );

-- =========================
-- SEED: BADGE_PROGRESS (10)
--  (pares únicos user_id/badge_id)
-- =========================
INSERT INTO
    badge_progress (
        user_id,
        badge_id,
        progress,
        awarded_at
    )
VALUES (
        (
            SELECT id_app_user
            FROM app_user
            ORDER BY name
            LIMIT 1
            OFFSET
                0
        ),
        (
            SELECT badge_id
            FROM badge
            ORDER BY badge_name
            LIMIT 1
            OFFSET
                0
        ),
        1,
        NOW() - INTERVAL '10 days'
    ),
    (
        (
            SELECT id_app_user
            FROM app_user
            ORDER BY name
            LIMIT 1
            OFFSET
                1
        ),
        (
            SELECT badge_id
            FROM badge
            ORDER BY badge_name
            LIMIT 1
            OFFSET
                3
        ),
        1,
        NOW() - INTERVAL '9 days'
    ),
    (
        (
            SELECT id_app_user
            FROM app_user
            ORDER BY name
            LIMIT 1
            OFFSET
                2
        ),
        (
            SELECT badge_id
            FROM badge
            ORDER BY badge_name
            LIMIT 1
            OFFSET
                6
        ),
        1,
        NOW() - INTERVAL '8 days'
    ),
    (
        (
            SELECT id_app_user
            FROM app_user
            ORDER BY name
            LIMIT 1
            OFFSET
                3
        ),
        (
            SELECT badge_id
            FROM badge
            ORDER BY badge_name
            LIMIT 1
            OFFSET
                1
        ),
        1,
        NOW() - INTERVAL '7 days'
    ),
    (
        (
            SELECT id_app_user
            FROM app_user
            ORDER BY name
            LIMIT 1
            OFFSET
                4
        ),
        (
            SELECT badge_id
            FROM badge
            ORDER BY badge_name
            LIMIT 1
            OFFSET
                4
        ),
        3,
        NOW() - INTERVAL '6 days'
    ),
    (
        (
            SELECT id_app_user
            FROM app_user
            ORDER BY name
            LIMIT 1
            OFFSET
                5
        ),
        (
            SELECT badge_id
            FROM badge
            ORDER BY badge_name
            LIMIT 1
            OFFSET
                5
        ),
        7,
        NOW() - INTERVAL '5 days'
    ),
    (
        (
            SELECT id_app_user
            FROM app_user
            ORDER BY name
            LIMIT 1
            OFFSET
                6
        ),
        (
            SELECT badge_id
            FROM badge
            ORDER BY badge_name
            LIMIT 1
            OFFSET
                2
        ),
        1,
        NOW() - INTERVAL '4 days'
    ),
    (
        (
            SELECT id_app_user
            FROM app_user
            ORDER BY name
            LIMIT 1
            OFFSET
                7
        ),
        (
            SELECT badge_id
            FROM badge
            ORDER BY badge_name
            LIMIT 1
            OFFSET
                7
        ),
        2,
        NOW() - INTERVAL '3 days'
    ),
    (
        (
            SELECT id_app_user
            FROM app_user
            ORDER BY name
            LIMIT 1
            OFFSET
                8
        ),
        (
            SELECT badge_id
            FROM badge
            ORDER BY badge_name
            LIMIT 1
            OFFSET
                8
        ),
        1,
        NOW() - INTERVAL '2 days'
    ),
    (
        (
            SELECT id_app_user
            FROM app_user
            ORDER BY name
            LIMIT 1
            OFFSET
                9
        ),
        (
            SELECT badge_id
            FROM badge
            ORDER BY badge_name
            LIMIT 1
            OFFSET
                9
        ),
        10,
        NOW() - INTERVAL '1 days'
    );

-- =========================
-- SEED: MISSION (10)
-- =========================
INSERT INTO
    mission (
        title,
        description,
        category,
        xp_reward,
        objective,
        is_active
    )
VALUES (
        'Completa tu perfil',
        'Añade tu información básica',
        'onboarding',
        20,
        1,
        TRUE
    ),
    (
        'Sube un proyecto',
        'Publica tu primer proyecto',
        'proyectos',
        15,
        1,
        TRUE
    ),
    (
        'Consigue 3 certs',
        'Agrega 3 certificados',
        'certificados',
        40,
        3,
        TRUE
    ),
    (
        'Responde 5 trivias',
        'Practica con trivias',
        'trivia',
        30,
        5,
        TRUE
    ),
    (
        'Mejora CV',
        'Agrega experiencia al CV',
        'cv',
        25,
        1,
        TRUE
    ),
    (
        'Portfolio',
        'Crea tu portafolio online',
        'proyectos',
        35,
        1,
        TRUE
    ),
    (
        'Refactor perfil',
        'Completa campos avanzados',
        'onboarding',
        15,
        1,
        TRUE
    ),
    (
        'Habilidades',
        'Lista 5 habilidades clave',
        'cv',
        10,
        5,
        TRUE
    ),
    (
        'CI/CD básico',
        'Configura pipelines',
        'devops',
        50,
        1,
        TRUE
    ),
    (
        'Soft skills',
        'Completa cuestionario soft skills',
        'formación',
        10,
        1,
        TRUE
    );

-- =========================
-- SEED: USER_MISSION_PROGRESS (10)  (pares únicos)
-- =========================
INSERT INTO
    user_mission_progress (
        user_id,
        mission_id,
        status,
        progress,
        starts_at,
        ends_at,
        completed_at
    )
VALUES (
        (
            SELECT id_app_user
            FROM app_user
            ORDER BY name
            LIMIT 1
            OFFSET
                0
        ),
        (
            SELECT mission_id
            FROM mission
            ORDER BY created_at
            LIMIT 1
            OFFSET
                0
        ),
        'in_progress',
        40,
        NOW() - INTERVAL '7 days',
        NOW() + INTERVAL '23 days',
        NULL
    ),
    (
        (
            SELECT id_app_user
            FROM app_user
            ORDER BY name
            LIMIT 1
            OFFSET
                1
        ),
        (
            SELECT mission_id
            FROM mission
            ORDER BY created_at
            LIMIT 1
            OFFSET
                1
        ),
        'completed',
        100,
        NOW() - INTERVAL '6 days',
        NOW() + INTERVAL '24 days',
        NOW() - INTERVAL '1 day'
    ),
    (
        (
            SELECT id_app_user
            FROM app_user
            ORDER BY name
            LIMIT 1
            OFFSET
                2
        ),
        (
            SELECT mission_id
            FROM mission
            ORDER BY created_at
            LIMIT 1
            OFFSET
                2
        ),
        'not_started',
        0,
        NOW() - INTERVAL '5 days',
        NOW() + INTERVAL '35 days',
        NULL
    ),
    (
        (
            SELECT id_app_user
            FROM app_user
            ORDER BY name
            LIMIT 1
            OFFSET
                3
        ),
        (
            SELECT mission_id
            FROM mission
            ORDER BY created_at
            LIMIT 1
            OFFSET
                3
        ),
        'in_progress',
        70,
        NOW() - INTERVAL '4 days',
        NOW() + INTERVAL '16 days',
        NULL
    ),
    (
        (
            SELECT id_app_user
            FROM app_user
            ORDER BY name
            LIMIT 1
            OFFSET
                4
        ),
        (
            SELECT mission_id
            FROM mission
            ORDER BY created_at
            LIMIT 1
            OFFSET
                4
        ),
        'in_progress',
        30,
        NOW() - INTERVAL '10 days',
        NOW() + INTERVAL '23 hours',
        NULL
    ),
    (
        (
            SELECT id_app_user
            FROM app_user
            ORDER BY name
            LIMIT 1
            OFFSET
                5
        ),
        (
            SELECT mission_id
            FROM mission
            ORDER BY created_at
            LIMIT 1
            OFFSET
                5
        ),
        'not_started',
        0,
        NOW() - INTERVAL '12 days',
        NOW() + INTERVAL '48 days',
        NULL
    ),
    (
        (
            SELECT id_app_user
            FROM app_user
            ORDER BY name
            LIMIT 1
            OFFSET
                6
        ),
        (
            SELECT mission_id
            FROM mission
            ORDER BY created_at
            LIMIT 1
            OFFSET
                6
        ),
        'completed',
        100,
        NOW() - INTERVAL '2 days',
        NOW() + INTERVAL '13 days',
        NOW() - INTERVAL '2 days'
    ),
    (
        (
            SELECT id_app_user
            FROM app_user
            ORDER BY name
            LIMIT 1
            OFFSET
                7
        ),
        (
            SELECT mission_id
            FROM mission
            ORDER BY created_at
            LIMIT 1
            OFFSET
                7
        ),
        'in_progress',
        55,
        NOW() - INTERVAL '3 days',
        NOW() + INTERVAL '9 days',
        NULL
    ),
    (
        (
            SELECT id_app_user
            FROM app_user
            ORDER BY name
            LIMIT 1
            OFFSET
                8
        ),
        (
            SELECT mission_id
            FROM mission
            ORDER BY created_at
            LIMIT 1
            OFFSET
                8
        ),
        'in_progress',
        20,
        NOW() - INTERVAL '8 days',
        NOW() + INTERVAL '37 days',
        NULL
    ),
    (
        (
            SELECT id_app_user
            FROM app_user
            ORDER BY name
            LIMIT 1
            OFFSET
                9
        ),
        (
            SELECT mission_id
            FROM mission
            ORDER BY created_at
            LIMIT 1
            OFFSET
                9
        ),
        'not_started',
        0,
        NOW() - INTERVAL '1 days',
        NOW() + INTERVAL '12 hours',
        NULL
    );

-- =========================
-- SEED: TRIVIA_ATTEMPT (10)  (pares únicos user/question)
-- =========================
INSERT INTO
    trivia_attempt (
        user_id,
        category,
        difficulty,
        score,
        total_time,
        precision_score
    )
VALUES (
        (
            SELECT id_app_user
            FROM app_user
            ORDER BY name
            LIMIT 1
            OFFSET
                0
        ),
        'Programación Backend',
        'medium',
        85,
        300,
        90
    ),
    (
        (
            SELECT id_app_user
            FROM app_user
            ORDER BY name
            LIMIT 1
            OFFSET
                1
        ),
        'Desarrollo Web',
        'easy',
        95,
        240,
        95
    ),
    (
        (
            SELECT id_app_user
            FROM app_user
            ORDER BY name
            LIMIT 1
            OFFSET
                2
        ),
        'Bases de Datos',
        'hard',
        75,
        420,
        80
    ),
    (
        (
            SELECT id_app_user
            FROM app_user
            ORDER BY name
            LIMIT 1
            OFFSET
                3
        ),
        'Arquitectura Software',
        'medium',
        88,
        360,
        85
    ),
    (
        (
            SELECT id_app_user
            FROM app_user
            ORDER BY name
            LIMIT 1
            OFFSET
                4
        ),
        'APIs RESTful',
        'easy',
        100,
        180,
        100
    ),
    (
        (
            SELECT id_app_user
            FROM app_user
            ORDER BY name
            LIMIT 1
            OFFSET
                5
        ),
        'DevOps',
        'hard',
        70,
        480,
        75
    ),
    (
        (
            SELECT id_app_user
            FROM app_user
            ORDER BY name
            LIMIT 1
            OFFSET
                6
        ),
        'Testing',
        'medium',
        92,
        270,
        95
    ),
    (
        (
            SELECT id_app_user
            FROM app_user
            ORDER BY name
            LIMIT 1
            OFFSET
                7
        ),
        'Microservicios',
        'hard',
        82,
        390,
        85
    ),
    (
        (
            SELECT id_app_user
            FROM app_user
            ORDER BY name
            LIMIT 1
            OFFSET
                8
        ),
        'Seguridad Web',
        'medium',
        78,
        330,
        80
    ),
    (
        (
            SELECT id_app_user
            FROM app_user
            ORDER BY name
            LIMIT 1
            OFFSET
                9
        ),
        'Cloud Computing',
        'easy',
        98,
        210,
        100
    );

-- =========================
-- SEED: NOTIFICATION_LOG (10)
-- =========================
INSERT INTO
    notification_log (
        user_id,
        channel,
        template,
        sent_at,
        metadata
    )
VALUES (
        (
            SELECT id_app_user
            FROM app_user
            ORDER BY name
            LIMIT 1
            OFFSET
                0
        ),
        'email',
        'welcome',
        NOW() - INTERVAL '9 days',
        '{"lang":"es"}'
    ),
    (
        (
            SELECT id_app_user
            FROM app_user
            ORDER BY name
            LIMIT 1
            OFFSET
                1
        ),
        'email',
        'mission_remind',
        NOW() - INTERVAL '8 days',
        '{"mission":"Completa tu perfil"}'
    ),
    (
        (
            SELECT id_app_user
            FROM app_user
            ORDER BY name
            LIMIT 1
            OFFSET
                2
        ),
        'push',
        'badge_award',
        NOW() - INTERVAL '7 days',
        '{"badge":"Onboarding 10%"}'
    ),
    (
        (
            SELECT id_app_user
            FROM app_user
            ORDER BY name
            LIMIT 1
            OFFSET
                3
        ),
        'sms',
        'otp',
        NOW() - INTERVAL '6 days',
        '{"length":6}'
    ),
    (
        (
            SELECT id_app_user
            FROM app_user
            ORDER BY name
            LIMIT 1
            OFFSET
                4
        ),
        'email',
        'digest',
        NOW() - INTERVAL '5 days',
        '{"items":3}'
    ),
    (
        (
            SELECT id_app_user
            FROM app_user
            ORDER BY name
            LIMIT 1
            OFFSET
                5
        ),
        'push',
        'mission_start',
        NOW() - INTERVAL '4 days',
        '{"category":"proyectos"}'
    ),
    (
        (
            SELECT id_app_user
            FROM app_user
            ORDER BY name
            LIMIT 1
            OFFSET
                6
        ),
        'email',
        'trivia_week',
        NOW() - INTERVAL '3 days',
        '{"difficulty":"easy"}'
    ),
    (
        (
            SELECT id_app_user
            FROM app_user
            ORDER BY name
            LIMIT 1
            OFFSET
                7
        ),
        'push',
        'badge_goal',
        NOW() - INTERVAL '2 days',
        '{"progress":70}'
    ),
    (
        (
            SELECT id_app_user
            FROM app_user
            ORDER BY name
            LIMIT 1
            OFFSET
                8
        ),
        'email',
        'tips',
        NOW() - INTERVAL '1 days',
        '{"topic":"portfolio"}'
    ),
    (
        (
            SELECT id_app_user
            FROM app_user
            ORDER BY name
            LIMIT 1
            OFFSET
                9
        ),
        'sms',
        'otp',
        NOW(),
        '{"length":6}'
    );

-- =========================
-- SEED: USER_PROGRESS (10)
-- =========================
INSERT INTO
    user_progress (
        user_id,
        streak,
        has_done_today,
        magento_points,
        created_at,
        updated_at
    )
VALUES (
        (
            SELECT id_app_user
            FROM app_user
            ORDER BY name
            LIMIT 1
            OFFSET
                0
        ),
        5,
        TRUE,
        150,
        NOW() - INTERVAL '10 days',
        NOW()
    ),
    (
        (
            SELECT id_app_user
            FROM app_user
            ORDER BY name
            LIMIT 1
            OFFSET
                1
        ),
        3,
        FALSE,
        120,
        NOW() - INTERVAL '9 days',
        NOW() - INTERVAL '1 day'
    ),
    (
        (
            SELECT id_app_user
            FROM app_user
            ORDER BY name
            LIMIT 1
            OFFSET
                2
        ),
        8,
        TRUE,
        220,
        NOW() - INTERVAL '8 days',
        NOW()
    ),
    (
        (
            SELECT id_app_user
            FROM app_user
            ORDER BY name
            LIMIT 1
            OFFSET
                3
        ),
        12,
        TRUE,
        350,
        NOW() - INTERVAL '7 days',
        NOW()
    ),
    (
        (
            SELECT id_app_user
            FROM app_user
            ORDER BY name
            LIMIT 1
            OFFSET
                4
        ),
        1,
        FALSE,
        45,
        NOW() - INTERVAL '6 days',
        NOW() - INTERVAL '2 days'
    ),
    (
        (
            SELECT id_app_user
            FROM app_user
            ORDER BY name
            LIMIT 1
            OFFSET
                5
        ),
        7,
        TRUE,
        180,
        NOW() - INTERVAL '5 days',
        NOW()
    ),
    (
        (
            SELECT id_app_user
            FROM app_user
            ORDER BY name
            LIMIT 1
            OFFSET
                6
        ),
        15,
        FALSE,
        420,
        NOW() - INTERVAL '4 days',
        NOW() - INTERVAL '1 day'
    ),
    (
        (
            SELECT id_app_user
            FROM app_user
            ORDER BY name
            LIMIT 1
            OFFSET
                7
        ),
        4,
        TRUE,
        95,
        NOW() - INTERVAL '3 days',
        NOW()
    ),
    (
        (
            SELECT id_app_user
            FROM app_user
            ORDER BY name
            LIMIT 1
            OFFSET
                8
        ),
        9,
        TRUE,
        275,
        NOW() - INTERVAL '2 days',
        NOW()
    ),
    (
        (
            SELECT id_app_user
            FROM app_user
            ORDER BY name
            LIMIT 1
            OFFSET
                9
        ),
        2,
        FALSE,
        60,
        NOW() - INTERVAL '1 days',
        NOW() - INTERVAL '3 days'
    );