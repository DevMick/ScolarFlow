-- ========================================
-- MIGRATION BILANS ANNUELS - PHASE 7
-- ========================================

-- Extension de la table annual_reports existante
ALTER TABLE annual_reports ADD COLUMN IF NOT EXISTS report_config JSONB DEFAULT '{}';
ALTER TABLE annual_reports ADD COLUMN IF NOT EXISTS insights JSONB DEFAULT '[]';
ALTER TABLE annual_reports ADD COLUMN IF NOT EXISTS recommendations JSONB DEFAULT '{}';
ALTER TABLE annual_reports ADD COLUMN IF NOT EXISTS generation_time INTEGER DEFAULT 0;
ALTER TABLE annual_reports ADD COLUMN IF NOT EXISTS template_id INTEGER;
ALTER TABLE annual_reports ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'draft';

-- Table pour templates de rapports
CREATE TABLE IF NOT EXISTS report_templates (
    id SERIAL PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    target VARCHAR(50) NOT NULL CHECK (target IN ('administration', 'parents', 'next_teacher', 'archive')),
    config JSONB NOT NULL DEFAULT '{}',
    sections JSONB NOT NULL DEFAULT '[]',
    formatting JSONB NOT NULL DEFAULT '{}',
    is_official BOOLEAN DEFAULT false,
    created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    usage_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table pour archivage optimisé des bilans
CREATE TABLE IF NOT EXISTS annual_archives (
    id SERIAL PRIMARY KEY,
    class_id INTEGER REFERENCES classes(id) ON DELETE CASCADE,
    academic_year VARCHAR(20) NOT NULL,
    summary_data JSONB NOT NULL DEFAULT '{}',
    full_report_path VARCHAR(500),
    file_size BIGINT,
    checksum VARCHAR(64),
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    archived_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table pour profils d'élèves détectés automatiquement
CREATE TABLE IF NOT EXISTS student_profiles (
    id SERIAL PRIMARY KEY,
    student_id INTEGER REFERENCES students(id) ON DELETE CASCADE,
    class_id INTEGER REFERENCES classes(id) ON DELETE CASCADE,
    academic_year VARCHAR(20) NOT NULL,
    profile_type VARCHAR(50) NOT NULL CHECK (profile_type IN (
        'high_achiever', 'consistent_performer', 'improving_student', 
        'struggling_student', 'inconsistent_performer', 'exceptional_case'
    )),
    confidence DECIMAL(3,2) NOT NULL CHECK (confidence >= 0 AND confidence <= 1),
    characteristics JSONB DEFAULT '[]',
    strengths JSONB DEFAULT '[]',
    challenges JSONB DEFAULT '[]',
    performance_data JSONB DEFAULT '{}',
    progression_data JSONB DEFAULT '{}',
    detected_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table pour insights et patterns détectés
CREATE TABLE IF NOT EXISTS class_insights (
    id SERIAL PRIMARY KEY,
    class_id INTEGER REFERENCES classes(id) ON DELETE CASCADE,
    academic_year VARCHAR(20) NOT NULL,
    insight_type VARCHAR(50) NOT NULL CHECK (insight_type IN (
        'class_trend', 'subject_insight', 'pedagogical_alert', 'success_factor'
    )),
    title VARCHAR(200) NOT NULL,
    description TEXT NOT NULL,
    data JSONB DEFAULT '{}',
    actionable BOOLEAN DEFAULT false,
    priority VARCHAR(10) DEFAULT 'medium' CHECK (priority IN ('high', 'medium', 'low')),
    confidence DECIMAL(3,2) DEFAULT 0.5,
    detected_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    acknowledged_at TIMESTAMP,
    acknowledged_by INTEGER REFERENCES users(id) ON DELETE SET NULL
);

-- Table pour recommandations pédagogiques
CREATE TABLE IF NOT EXISTS pedagogical_recommendations (
    id SERIAL PRIMARY KEY,
    class_id INTEGER REFERENCES classes(id) ON DELETE CASCADE,
    academic_year VARCHAR(20) NOT NULL,
    category VARCHAR(50) NOT NULL CHECK (category IN (
        'teaching_method', 'curriculum_focus', 'individual_support', 
        'class_management', 'assessment_strategy', 'next_year_planning'
    )),
    recommendation TEXT NOT NULL,
    rationale TEXT NOT NULL,
    expected_impact TEXT,
    difficulty VARCHAR(20) DEFAULT 'medium' CHECK (difficulty IN ('easy', 'medium', 'challenging')),
    priority INTEGER DEFAULT 5 CHECK (priority >= 1 AND priority <= 10),
    evidence JSONB DEFAULT '{}',
    generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    implemented_at TIMESTAMP,
    feedback TEXT
);

-- Index pour performance optimale
CREATE INDEX IF NOT EXISTS idx_annual_reports_class_year ON annual_reports(class_id, academic_year);
CREATE INDEX IF NOT EXISTS idx_annual_reports_status ON annual_reports(status);
CREATE INDEX IF NOT EXISTS idx_annual_reports_template ON annual_reports(template_id);

CREATE INDEX IF NOT EXISTS idx_annual_archives_class_year ON annual_archives(class_id, academic_year);
CREATE INDEX IF NOT EXISTS idx_annual_archives_year ON annual_archives(academic_year);

CREATE INDEX IF NOT EXISTS idx_student_profiles_student_year ON student_profiles(student_id, academic_year);
CREATE INDEX IF NOT EXISTS idx_student_profiles_class_year ON student_profiles(class_id, academic_year);
CREATE INDEX IF NOT EXISTS idx_student_profiles_type ON student_profiles(profile_type);

CREATE INDEX IF NOT EXISTS idx_class_insights_class_year ON class_insights(class_id, academic_year);
CREATE INDEX IF NOT EXISTS idx_class_insights_type ON class_insights(insight_type);
CREATE INDEX IF NOT EXISTS idx_class_insights_priority ON class_insights(priority);

CREATE INDEX IF NOT EXISTS idx_pedagogical_recommendations_class_year ON pedagogical_recommendations(class_id, academic_year);
CREATE INDEX IF NOT EXISTS idx_pedagogical_recommendations_category ON pedagogical_recommendations(category);
CREATE INDEX IF NOT EXISTS idx_pedagogical_recommendations_priority ON pedagogical_recommendations(priority DESC);

CREATE INDEX IF NOT EXISTS idx_report_templates_target ON report_templates(target);
CREATE INDEX IF NOT EXISTS idx_report_templates_official ON report_templates(is_official);
CREATE INDEX IF NOT EXISTS idx_report_templates_usage ON report_templates(usage_count DESC);

-- Triggers pour mise à jour automatique des timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_report_templates_updated_at 
    BEFORE UPDATE ON report_templates 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_student_profiles_updated_at 
    BEFORE UPDATE ON student_profiles 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Fonction pour nettoyer les anciennes données (RGPD)
CREATE OR REPLACE FUNCTION cleanup_old_annual_data(years_to_keep INTEGER DEFAULT 7)
RETURNS INTEGER AS $$
DECLARE
    cutoff_year VARCHAR(20);
    deleted_count INTEGER := 0;
BEGIN
    cutoff_year := (EXTRACT(YEAR FROM CURRENT_DATE) - years_to_keep)::VARCHAR || '-' || (EXTRACT(YEAR FROM CURRENT_DATE) - years_to_keep + 1)::VARCHAR;
    
    -- Supprimer les anciennes archives
    DELETE FROM annual_archives WHERE academic_year < cutoff_year;
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    
    -- Supprimer les anciens profils d'élèves
    DELETE FROM student_profiles WHERE academic_year < cutoff_year;
    
    -- Supprimer les anciens insights
    DELETE FROM class_insights WHERE academic_year < cutoff_year;
    
    -- Supprimer les anciennes recommandations
    DELETE FROM pedagogical_recommendations WHERE academic_year < cutoff_year;
    
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Insertion des templates par défaut
INSERT INTO report_templates (name, description, target, config, sections, formatting, is_official) VALUES
(
    'Rapport Administratif Complet',
    'Rapport détaillé pour l''administration avec toutes les données et analyses',
    'administration',
    '{"includeRawData": true, "includeStatistics": true, "includeRecommendations": true}',
    '[
        {"id": "metadata", "title": "Informations Générales", "type": "summary", "required": true, "customizable": false},
        {"id": "class_stats", "title": "Statistiques de Classe", "type": "statistics", "required": true, "customizable": true},
        {"id": "progression_charts", "title": "Graphiques de Progression", "type": "charts", "required": true, "customizable": true},
        {"id": "student_profiles", "title": "Profils Élèves", "type": "student_list", "required": true, "customizable": true},
        {"id": "insights", "title": "Insights Automatiques", "type": "insights", "required": true, "customizable": false},
        {"id": "recommendations", "title": "Recommandations Pédagogiques", "type": "recommendations", "required": true, "customizable": true}
    ]',
    '{"layout": "detailed", "includeCharts": true, "includeRawData": true, "pageBreaks": ["class_stats", "student_profiles"], "branding": true}',
    true
),
(
    'Résumé de Transition',
    'Synthèse pour l''enseignant de l''année suivante avec profils élèves et conseils',
    'next_teacher',
    '{"focusOnProfiles": true, "includeRecommendations": true, "compactFormat": true}',
    '[
        {"id": "class_overview", "title": "Vue d''ensemble de la classe", "type": "summary", "required": true, "customizable": false},
        {"id": "student_profiles", "title": "Profils élèves à retenir", "type": "student_list", "required": true, "customizable": true},
        {"id": "pedagogical_advice", "title": "Conseils Pédagogiques", "type": "recommendations", "required": true, "customizable": true},
        {"id": "next_year_focus", "title": "Points d''attention année suivante", "type": "planning", "required": true, "customizable": true}
    ]',
    '{"layout": "compact", "includeCharts": false, "includeRawData": false, "pageBreaks": ["student_profiles"], "branding": false}',
    true
),
(
    'Bilan Parents',
    'Rapport synthétique pour communication avec les parents',
    'parents',
    '{"emphasizeProgress": true, "positiveFraming": true, "includeNextSteps": true}',
    '[
        {"id": "class_achievements", "title": "Réussites de la classe", "type": "summary", "required": true, "customizable": false},
        {"id": "progress_highlights", "title": "Points de progression", "type": "charts", "required": true, "customizable": true},
        {"id": "collective_projects", "title": "Projets collectifs", "type": "activities", "required": false, "customizable": true},
        {"id": "next_objectives", "title": "Objectifs pour l''année suivante", "type": "planning", "required": true, "customizable": true}
    ]',
    '{"layout": "compact", "includeCharts": true, "includeRawData": false, "pageBreaks": [], "branding": true}',
    true
),
(
    'Archive Complète',
    'Archive complète pour conservation historique avec toutes les données',
    'archive',
    '{"preserveAllData": true, "includeMetadata": true, "structuredFormat": true}',
    '[
        {"id": "complete_metadata", "title": "Métadonnées complètes", "type": "metadata", "required": true, "customizable": false},
        {"id": "all_evaluations", "title": "Toutes les évaluations", "type": "raw_data", "required": true, "customizable": false},
        {"id": "all_statistics", "title": "Toutes les statistiques", "type": "statistics", "required": true, "customizable": false},
        {"id": "all_analyses", "title": "Toutes les analyses", "type": "analysis", "required": true, "customizable": false}
    ]',
    '{"layout": "detailed", "includeCharts": true, "includeRawData": true, "pageBreaks": ["all_evaluations", "all_statistics"], "branding": false}',
    true
);

-- Commentaires pour documentation
COMMENT ON TABLE report_templates IS 'Templates de rapports annuels prédéfinis et personnalisés';
COMMENT ON TABLE annual_archives IS 'Archives optimisées des bilans annuels pour consultation historique';
COMMENT ON TABLE student_profiles IS 'Profils d''élèves détectés automatiquement par l''IA';
COMMENT ON TABLE class_insights IS 'Insights et patterns détectés automatiquement dans les données de classe';
COMMENT ON TABLE pedagogical_recommendations IS 'Recommandations pédagogiques générées automatiquement';

COMMENT ON COLUMN student_profiles.confidence IS 'Niveau de confiance de la classification (0.0 à 1.0)';
COMMENT ON COLUMN class_insights.actionable IS 'Indique si l''insight peut donner lieu à une action concrète';
COMMENT ON COLUMN pedagogical_recommendations.priority IS 'Priorité de 1 (très faible) à 10 (critique)';

-- Finalisation
SELECT 'Migration bilans annuels terminée avec succès' as status;
