-- Enable UUIDs (for unique identifiers)
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TYPE mission_status AS ENUM ('not_started', 'in_progress', 'completed');

CREATE TYPE difficulty     AS ENUM ('easy', 'medium', 'hard');

CREATE TABLE app_user (
    id_app_user UUID PRIMARY KEY DEFAULT gen_random_uuid (),
    name TEXT NOT NULL,
    email TEXT,
    sector TEXT,
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
    category TEXT,
    xp_reward INT NOT NULL DEFAULT 10 CHECK (xp_reward >= 0),
    starts_at TIMESTAMPTZ,
    ends_at TIMESTAMPTZ,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CHECK (
        ends_at IS NULL
        OR starts_at IS NULL
        OR ends_at > starts_at
    )
);

CREATE TABLE user_mission_progress (
    ump_id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
    user_id UUID NOT NULL REFERENCES app_user (id_app_user) ON DELETE CASCADE,
    mission_id UUID NOT NULL REFERENCES mission (mission_id) ON DELETE CASCADE,
    status mission_status NOT NULL DEFAULT 'not_started',
    progress INT NOT NULL DEFAULT 0 CHECK (progress >= 0),
    completed_at TIMESTAMPTZ,
    UNIQUE (user_id, mission_id)
);

CREATE TABLE trivia_question (
    question_id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
    category TEXT,
    difficulty difficulty NOT NULL DEFAULT 'easy',
    question TEXT NOT NULL,
    answer TEXT NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE trivia_attempt (
    attempt_id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
    user_id UUID NOT NULL REFERENCES app_user (id_app_user) ON DELETE CASCADE,
    question_id UUID NOT NULL REFERENCES trivia_question (question_id) ON DELETE CASCADE,
    puntaje INT NOT NULL CHECK (puntaje >= 0),
    attempted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (user_id, question_id)
);



CREATE TABLE notification_log (
    notification_id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
    user_id UUID NOT NULL REFERENCES app_user (id_app_user) ON DELETE CASCADE,
    channel TEXT NOT NULL,
    template TEXT,
    sent_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    metadata JSONB
);