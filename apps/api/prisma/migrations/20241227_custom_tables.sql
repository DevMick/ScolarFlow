-- ========================================
-- MIGRATION PHASE 6 - TABLEAUX PERSONNALISÉS
-- ========================================

-- Extension de la table custom_tables (si elle n'existe pas déjà)
CREATE TABLE IF NOT EXISTS custom_tables (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    class_id INTEGER REFERENCES classes(id) ON DELETE CASCADE,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    category VARCHAR(50) DEFAULT 'custom',
    
    -- Configuration du tableau (JSONB pour flexibilité)
    config JSONB NOT NULL DEFAULT '{}',
    
    -- Données calculées (cache)
    computed_data JSONB,
    
    -- Métadonnées
    is_template BOOLEAN DEFAULT false,
    is_public BOOLEAN DEFAULT false,
    tags JSONB DEFAULT '[]',
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table pour les templates partagés
CREATE TABLE IF NOT EXISTS custom_table_templates (
    id SERIAL PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    category VARCHAR(50) DEFAULT 'custom',
    
    -- Configuration du template
    config JSONB NOT NULL DEFAULT '{}',
    
    -- Métadonnées
    is_official BOOLEAN DEFAULT false,
    created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    usage_count INTEGER DEFAULT 0,
    tags JSONB DEFAULT '[]',
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table pour les formules sauvegardées
CREATE TABLE IF NOT EXISTS custom_formulas (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    expression TEXT NOT NULL,
    category VARCHAR(50) DEFAULT 'custom',
    
    -- Métadonnées de la formule
    variables JSONB DEFAULT '[]',
    result_type VARCHAR(20) DEFAULT 'number',
    
    -- Partage
    created_by INTEGER REFERENCES users(id) ON DELETE CASCADE,
    is_public BOOLEAN DEFAULT false,
    usage_count INTEGER DEFAULT 0,
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Index pour optimiser les performances
CREATE INDEX IF NOT EXISTS idx_custom_tables_user_id ON custom_tables(user_id);
CREATE INDEX IF NOT EXISTS idx_custom_tables_class_id ON custom_tables(class_id);
CREATE INDEX IF NOT EXISTS idx_custom_tables_category ON custom_tables(category);
CREATE INDEX IF NOT EXISTS idx_custom_tables_is_template ON custom_tables(is_template);
CREATE INDEX IF NOT EXISTS idx_custom_tables_is_public ON custom_tables(is_public);
CREATE INDEX IF NOT EXISTS idx_custom_tables_created_at ON custom_tables(created_at);

CREATE INDEX IF NOT EXISTS idx_custom_table_templates_category ON custom_table_templates(category);
CREATE INDEX IF NOT EXISTS idx_custom_table_templates_is_official ON custom_table_templates(is_official);
CREATE INDEX IF NOT EXISTS idx_custom_table_templates_usage_count ON custom_table_templates(usage_count DESC);

CREATE INDEX IF NOT EXISTS idx_custom_formulas_category ON custom_formulas(category);
CREATE INDEX IF NOT EXISTS idx_custom_formulas_created_by ON custom_formulas(created_by);
CREATE INDEX IF NOT EXISTS idx_custom_formulas_is_public ON custom_formulas(is_public);

-- Trigger pour mettre à jour updated_at automatiquement
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_custom_tables_updated_at 
    BEFORE UPDATE ON custom_tables 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_custom_table_templates_updated_at 
    BEFORE UPDATE ON custom_table_templates 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insertion des templates officiels de base
INSERT INTO custom_table_templates (name, description, category, is_official, config) VALUES
(
    'Bulletin de Notes Standard',
    'Bulletin classique avec moyennes par matière et rang',
    'bulletin',
    true,
    '{
        "columns": [
            {
                "id": "nom",
                "label": "Nom",
                "type": "student_info",
                "source": {"field": "lastName"},
                "formatting": {"width": 120, "alignment": "left"},
                "sortable": true,
                "filterable": true,
                "exportable": true
            },
            {
                "id": "prenom",
                "label": "Prénom",
                "type": "student_info",
                "source": {"field": "firstName"},
                "formatting": {"width": 100, "alignment": "left"},
                "sortable": true,
                "filterable": true,
                "exportable": true
            },
            {
                "id": "moyenne_generale",
                "label": "Moyenne Générale",
                "type": "calculated",
                "formula": {
                    "expression": "MOYENNE(TOUTES_NOTES)",
                    "variables": ["TOUTES_NOTES"],
                    "resultType": "number"
                },
                "formatting": {
                    "width": 100,
                    "alignment": "center",
                    "numberFormat": "0.00",
                    "conditionalFormatting": [
                        {
                            "id": "excellent",
                            "condition": {"operator": ">=", "value": 16},
                            "style": {"backgroundColor": "#dcfce7", "textColor": "#166534", "fontWeight": "bold"}
                        },
                        {
                            "id": "bien",
                            "condition": {"operator": ">=", "value": 14},
                            "style": {"backgroundColor": "#dbeafe", "textColor": "#1d4ed8"}
                        },
                        {
                            "id": "insuffisant",
                            "condition": {"operator": "<", "value": 10},
                            "style": {"backgroundColor": "#fee2e2", "textColor": "#dc2626"}
                        }
                    ]
                },
                "sortable": true,
                "filterable": true,
                "exportable": true
            },
            {
                "id": "rang",
                "label": "Rang",
                "type": "calculated",
                "formula": {
                    "expression": "RANG(moyenne_generale, TOUTES_MOYENNES)",
                    "variables": ["moyenne_generale", "TOUTES_MOYENNES"],
                    "resultType": "number"
                },
                "formatting": {"width": 60, "alignment": "center"},
                "sortable": true,
                "filterable": false,
                "exportable": true
            },
            {
                "id": "mention",
                "label": "Mention",
                "type": "calculated",
                "formula": {
                    "expression": "SI(moyenne_generale >= 16, \"Très Bien\", SI(moyenne_generale >= 14, \"Bien\", SI(moyenne_generale >= 12, \"Assez Bien\", SI(moyenne_generale >= 10, \"Passable\", \"Insuffisant\"))))",
                    "variables": ["moyenne_generale"],
                    "resultType": "text"
                },
                "formatting": {"width": 100, "alignment": "center"},
                "sortable": true,
                "filterable": true,
                "exportable": true
            }
        ],
        "styling": {
            "headerStyle": {
                "backgroundColor": "#f3f4f6",
                "fontWeight": "bold",
                "textAlign": "center"
            },
            "alternateRowColors": true,
            "showBorders": true
        }
    }'
),
(
    'Tableau Conseil de Classe',
    'Vue d''ensemble pour le conseil de classe avec évolution et absences',
    'conseil_classe',
    true,
    '{
        "columns": [
            {
                "id": "eleve",
                "label": "Élève",
                "type": "calculated",
                "formula": {
                    "expression": "CONCATENER(PRENOM, \" \", NOM)",
                    "variables": ["PRENOM", "NOM"],
                    "resultType": "text"
                },
                "formatting": {"width": 150, "alignment": "left"},
                "sortable": true,
                "filterable": true,
                "exportable": true
            },
            {
                "id": "moyenne",
                "label": "Moyenne",
                "type": "calculated",
                "formula": {
                    "expression": "MOYENNE_GENERALE",
                    "variables": ["MOYENNE_GENERALE"],
                    "resultType": "number"
                },
                "formatting": {"width": 80, "alignment": "center", "numberFormat": "0.00"},
                "sortable": true,
                "filterable": true,
                "exportable": true
            },
            {
                "id": "rang",
                "label": "Rang",
                "type": "calculated",
                "formula": {
                    "expression": "RANG(MOYENNE_GENERALE, TOUTES_MOYENNES)",
                    "variables": ["MOYENNE_GENERALE", "TOUTES_MOYENNES"],
                    "resultType": "number"
                },
                "formatting": {"width": 60, "alignment": "center"},
                "sortable": true,
                "filterable": false,
                "exportable": true
            },
            {
                "id": "evolution",
                "label": "Évolution",
                "type": "calculated",
                "formula": {
                    "expression": "EVOLUTION_TRIMESTRE",
                    "variables": ["EVOLUTION_TRIMESTRE"],
                    "resultType": "text"
                },
                "formatting": {"width": 80, "alignment": "center"},
                "sortable": true,
                "filterable": true,
                "exportable": true
            },
            {
                "id": "appreciation",
                "label": "Appréciation",
                "type": "static",
                "source": {"staticValue": "À compléter"},
                "formatting": {"width": 200, "alignment": "left"},
                "sortable": false,
                "filterable": false,
                "exportable": true
            }
        ]
    }'
);

-- Insertion de formules prédéfinies
INSERT INTO custom_formulas (name, description, expression, category, variables, result_type, is_public) VALUES
('Moyenne Simple', 'Calcule la moyenne de plusieurs valeurs', 'MOYENNE(val1, val2, val3)', 'statistical', '["val1", "val2", "val3"]', 'number', true),
('Rang dans Classe', 'Calcule le rang d''un élève dans sa classe', 'RANG(valeur, toutes_valeurs)', 'statistical', '["valeur", "toutes_valeurs"]', 'number', true),
('Mention selon Moyenne', 'Détermine la mention selon la moyenne', 'SI(moyenne >= 16, "TB", SI(moyenne >= 14, "B", SI(moyenne >= 12, "AB", SI(moyenne >= 10, "Passable", "Insuffisant"))))', 'logical', '["moyenne"]', 'text', true),
('Nom Complet', 'Concatène prénom et nom', 'CONCATENER(PRENOM, " ", NOM)', 'text', '["PRENOM", "NOM"]', 'text', true),
('Taux de Réussite', 'Calcule le pourcentage de réussite', 'POURCENTAGE(COMPTER_SI(notes, ">=", 10), COMPTER(notes))', 'statistical', '["notes"]', 'number', true);

COMMENT ON TABLE custom_tables IS 'Tableaux personnalisés créés par les utilisateurs';
COMMENT ON TABLE custom_table_templates IS 'Templates de tableaux partagés et officiels';
COMMENT ON TABLE custom_formulas IS 'Formules personnalisées sauvegardées';

COMMENT ON COLUMN custom_tables.config IS 'Configuration JSON du tableau (colonnes, style, filtres)';
COMMENT ON COLUMN custom_tables.computed_data IS 'Cache des données calculées pour optimiser les performances';
COMMENT ON COLUMN custom_table_templates.is_official IS 'Template créé par l''équipe EduStats';
COMMENT ON COLUMN custom_formulas.expression IS 'Expression de la formule en syntaxe EduStats';
