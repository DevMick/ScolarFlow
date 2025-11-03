-- Script de création de la base de données EduStats
-- Exécuter ce script avec psql en tant qu'utilisateur postgres

-- Créer la base de données
CREATE DATABASE edustats_db;

-- Se connecter à la base de données
\c edustats_db;

-- Table Users (Enseignants)
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    establishment VARCHAR(200),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table Classes
CREATE TABLE classes (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    level VARCHAR(50) NOT NULL CHECK (level IN ('CP1', 'CP2', 'CE1', 'CE2', 'CM1', 'CM2')),
    academic_year VARCHAR(20) NOT NULL,
    student_count INTEGER DEFAULT 0,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table Students
CREATE TABLE students (
    id SERIAL PRIMARY KEY,
    class_id INTEGER REFERENCES classes(id) ON DELETE CASCADE,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    date_of_birth DATE,
    gender VARCHAR(10) CHECK (gender IN ('M', 'F')),
    student_number VARCHAR(50),
    parent_contact VARCHAR(200),
    address TEXT,
    notes TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table Evaluations
CREATE TABLE evaluations (
    id SERIAL PRIMARY KEY,
    class_id INTEGER REFERENCES classes(id) ON DELETE CASCADE,
    title VARCHAR(200) NOT NULL,
    subject VARCHAR(100) NOT NULL,
    type VARCHAR(50) DEFAULT 'Controle' CHECK (type IN ('Controle', 'Devoir', 'Examen', 'Oral', 'TP')),
    max_score DECIMAL(5,2) NOT NULL CHECK (max_score > 0),
    coefficient DECIMAL(3,2) DEFAULT 1.0 CHECK (coefficient > 0),
    evaluation_date DATE NOT NULL,
    description TEXT,
    is_finalized BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table EvaluationResults
CREATE TABLE evaluation_results (
    id SERIAL PRIMARY KEY,
    evaluation_id INTEGER REFERENCES evaluations(id) ON DELETE CASCADE,
    student_id INTEGER REFERENCES students(id) ON DELETE CASCADE,
    score DECIMAL(5,2) CHECK (score >= 0),
    is_absent BOOLEAN DEFAULT false,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(evaluation_id, student_id),
    CHECK (is_absent = true OR score IS NOT NULL)
);

-- Table StatisticsConfig
CREATE TABLE statistics_config (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(200) NOT NULL,
    config_data JSONB NOT NULL,
    is_default BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table CustomTables
CREATE TABLE custom_tables (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    class_id INTEGER REFERENCES classes(id) ON DELETE CASCADE,
    name VARCHAR(200) NOT NULL,
    table_config JSONB NOT NULL,
    table_data JSONB,
    is_template BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table AnnualReports
CREATE TABLE annual_reports (
    id SERIAL PRIMARY KEY,
    class_id INTEGER REFERENCES classes(id) ON DELETE CASCADE,
    academic_year VARCHAR(20) NOT NULL,
    report_data JSONB NOT NULL,
    generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(class_id, academic_year)
);

-- Index pour optimiser les performances
CREATE INDEX idx_classes_user_id ON classes(user_id);
CREATE INDEX idx_classes_academic_year ON classes(academic_year);
CREATE INDEX idx_students_class_id ON students(class_id);
CREATE INDEX idx_students_active ON students(is_active);
CREATE INDEX idx_evaluations_class_id ON evaluations(class_id);
CREATE INDEX idx_evaluations_date ON evaluations(evaluation_date);
CREATE INDEX idx_evaluation_results_evaluation_id ON evaluation_results(evaluation_id);
CREATE INDEX idx_evaluation_results_student_id ON evaluation_results(student_id);
CREATE INDEX idx_statistics_config_user_id ON statistics_config(user_id);
CREATE INDEX idx_custom_tables_user_id ON custom_tables(user_id);
CREATE INDEX idx_custom_tables_class_id ON custom_tables(class_id);

-- Fonction pour mettre à jour updated_at automatiquement
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers pour updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_classes_updated_at BEFORE UPDATE ON classes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_students_updated_at BEFORE UPDATE ON students FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_evaluations_updated_at BEFORE UPDATE ON evaluations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_evaluation_results_updated_at BEFORE UPDATE ON evaluation_results FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_statistics_config_updated_at BEFORE UPDATE ON statistics_config FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_custom_tables_updated_at BEFORE UPDATE ON custom_tables FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_annual_reports_updated_at BEFORE UPDATE ON annual_reports FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Données de test pour le développement
INSERT INTO users (email, password_hash, first_name, last_name, establishment) VALUES
('professeur@exemple.com', '$2a$12$dummy.hash.for.testing', 'Jean', 'Dupont', 'École Primaire de Test');

INSERT INTO classes (user_id, name, level, academic_year, description) VALUES
(1, 'CM2-A', 'CM2', '2024-2025', 'Classe de CM2 - Section A'),
(1, 'CE2-B', 'CE2', '2024-2025', 'Classe de CE2 - Section B'),
(1, 'CM1-A', 'CM1', '2024-2025', 'Classe de CM1 - Section A');

-- Confirmer que tout est créé
SELECT 'Base de données EduStats créée avec succès!' as message;
SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name;
