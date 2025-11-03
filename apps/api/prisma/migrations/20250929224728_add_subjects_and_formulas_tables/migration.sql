-- CreateTable
CREATE TABLE "users" (
    "id" SERIAL NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "first_name" TEXT NOT NULL,
    "last_name" TEXT NOT NULL,
    "phone" TEXT,
    "establishment" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "classes" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "academic_year" TEXT NOT NULL,
    "student_count" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "classes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "students" (
    "id" SERIAL NOT NULL,
    "class_id" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "gender" TEXT NOT NULL,
    "student_number" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "students_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "subjects" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "code" VARCHAR(20) NOT NULL,
    "description" TEXT,
    "color" VARCHAR(7),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "subjects_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "evaluation_formulas" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(200) NOT NULL,
    "description" TEXT,
    "formula" TEXT NOT NULL,
    "category" VARCHAR(50) NOT NULL DEFAULT 'evaluation',
    "variables" JSONB NOT NULL DEFAULT '[]',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "is_default" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "evaluation_formulas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "evaluations" (
    "id" SERIAL NOT NULL,
    "class_id" INTEGER NOT NULL,
    "subject_id" INTEGER NOT NULL,
    "formula_id" INTEGER,
    "title" VARCHAR(200) NOT NULL,
    "type" VARCHAR(50) NOT NULL DEFAULT 'Controle',
    "max_score" DECIMAL(8,2) NOT NULL,
    "coefficient" DECIMAL(5,2) NOT NULL DEFAULT 1.0,
    "evaluation_date" DATE NOT NULL,
    "description" TEXT,
    "is_finalized" BOOLEAN NOT NULL DEFAULT false,
    "absent_handling" VARCHAR(50) NOT NULL DEFAULT 'exclude_from_ranking',
    "rounding_method" VARCHAR(50) NOT NULL DEFAULT 'two_decimals',
    "show_ranking" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "evaluations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "evaluation_results" (
    "id" SERIAL NOT NULL,
    "evaluation_id" INTEGER NOT NULL,
    "student_id" INTEGER NOT NULL,
    "score" DECIMAL(8,2),
    "is_absent" BOOLEAN NOT NULL DEFAULT false,
    "absent_reason" VARCHAR(50),
    "notes" TEXT,
    "rank" INTEGER,
    "percentile" DECIMAL(5,2),
    "last_modified_by" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "evaluation_results_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "evaluation_history" (
    "id" SERIAL NOT NULL,
    "evaluation_id" INTEGER NOT NULL,
    "student_id" INTEGER,
    "field" VARCHAR(100) NOT NULL,
    "old_value" JSONB,
    "new_value" JSONB,
    "modified_by" INTEGER NOT NULL,
    "modified_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reason" VARCHAR(500),
    "ip_address" VARCHAR(45),

    CONSTRAINT "evaluation_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "statistics_config" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "name" VARCHAR(200) NOT NULL,
    "description" TEXT,
    "category" VARCHAR(50) NOT NULL DEFAULT 'custom',
    "data_sources" JSONB NOT NULL,
    "calculations" JSONB NOT NULL,
    "visualization" JSONB NOT NULL,
    "is_template" BOOLEAN NOT NULL DEFAULT false,
    "is_public" BOOLEAN NOT NULL DEFAULT false,
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "last_result" JSONB,
    "last_generated" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "statistics_config_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "statistics_results" (
    "id" SERIAL NOT NULL,
    "config_id" INTEGER NOT NULL,
    "generated_by" INTEGER NOT NULL,
    "datasets" JSONB NOT NULL,
    "summary" JSONB NOT NULL,
    "statistics" JSONB NOT NULL,
    "insights" JSONB NOT NULL,
    "processing_time" INTEGER NOT NULL,
    "data_points_count" INTEGER NOT NULL,
    "cache_key" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "statistics_results_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "custom_tables" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "class_id" INTEGER,
    "name" VARCHAR(200) NOT NULL,
    "description" TEXT,
    "category" VARCHAR(50) NOT NULL DEFAULT 'custom',
    "config" JSONB NOT NULL DEFAULT '{}',
    "computed_data" JSONB,
    "is_template" BOOLEAN NOT NULL DEFAULT false,
    "is_public" BOOLEAN NOT NULL DEFAULT false,
    "tags" JSONB NOT NULL DEFAULT '[]',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "custom_tables_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "custom_table_templates" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(200) NOT NULL,
    "description" TEXT,
    "category" VARCHAR(50) NOT NULL DEFAULT 'custom',
    "config" JSONB NOT NULL DEFAULT '{}',
    "is_official" BOOLEAN NOT NULL DEFAULT false,
    "created_by" INTEGER,
    "usage_count" INTEGER NOT NULL DEFAULT 0,
    "tags" JSONB NOT NULL DEFAULT '[]',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "custom_table_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "custom_formulas" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "description" TEXT,
    "expression" TEXT NOT NULL,
    "category" VARCHAR(50) NOT NULL DEFAULT 'custom',
    "variables" JSONB NOT NULL DEFAULT '[]',
    "result_type" VARCHAR(20) NOT NULL DEFAULT 'number',
    "created_by" INTEGER NOT NULL,
    "is_public" BOOLEAN NOT NULL DEFAULT false,
    "usage_count" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "custom_formulas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "annual_reports" (
    "id" SERIAL NOT NULL,
    "class_id" INTEGER NOT NULL,
    "academic_year" TEXT NOT NULL,
    "report_data" JSONB NOT NULL,
    "report_config" JSONB NOT NULL DEFAULT '{}',
    "insights" JSONB NOT NULL DEFAULT '[]',
    "recommendations" JSONB NOT NULL DEFAULT '{}',
    "generation_time" INTEGER NOT NULL DEFAULT 0,
    "template_id" INTEGER,
    "status" VARCHAR(20) NOT NULL DEFAULT 'draft',
    "generated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "annual_reports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "report_templates" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(200) NOT NULL,
    "description" TEXT,
    "target" VARCHAR(50) NOT NULL,
    "config" JSONB NOT NULL DEFAULT '{}',
    "sections" JSONB NOT NULL DEFAULT '[]',
    "formatting" JSONB NOT NULL DEFAULT '{}',
    "is_official" BOOLEAN NOT NULL DEFAULT false,
    "created_by" INTEGER,
    "usage_count" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "report_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "annual_archives" (
    "id" SERIAL NOT NULL,
    "class_id" INTEGER NOT NULL,
    "academic_year" TEXT NOT NULL,
    "summary_data" JSONB NOT NULL,
    "full_report_path" VARCHAR(500),
    "file_size" BIGINT,
    "checksum" VARCHAR(64),
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "archived_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "annual_archives_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "student_profiles" (
    "id" SERIAL NOT NULL,
    "student_id" INTEGER NOT NULL,
    "class_id" INTEGER NOT NULL,
    "academic_year" TEXT NOT NULL,
    "profile_type" VARCHAR(50) NOT NULL,
    "confidence" DECIMAL(3,2) NOT NULL,
    "characteristics" JSONB NOT NULL DEFAULT '[]',
    "strengths" JSONB NOT NULL DEFAULT '[]',
    "challenges" JSONB NOT NULL DEFAULT '[]',
    "performance_data" JSONB NOT NULL DEFAULT '{}',
    "progression_data" JSONB NOT NULL DEFAULT '{}',
    "detected_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_updated" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "student_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "class_insights" (
    "id" SERIAL NOT NULL,
    "class_id" INTEGER NOT NULL,
    "academic_year" TEXT NOT NULL,
    "insight_type" VARCHAR(50) NOT NULL,
    "title" VARCHAR(200) NOT NULL,
    "description" TEXT NOT NULL,
    "data" JSONB NOT NULL DEFAULT '{}',
    "actionable" BOOLEAN NOT NULL DEFAULT false,
    "priority" VARCHAR(10) NOT NULL DEFAULT 'medium',
    "confidence" DECIMAL(3,2) NOT NULL DEFAULT 0.5,
    "detected_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "acknowledged_at" TIMESTAMP(3),
    "acknowledged_by" INTEGER,

    CONSTRAINT "class_insights_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pedagogical_recommendations" (
    "id" SERIAL NOT NULL,
    "class_id" INTEGER NOT NULL,
    "academic_year" TEXT NOT NULL,
    "category" VARCHAR(50) NOT NULL,
    "recommendation" TEXT NOT NULL,
    "rationale" TEXT NOT NULL,
    "expected_impact" TEXT,
    "difficulty" VARCHAR(20) NOT NULL DEFAULT 'medium',
    "priority" INTEGER NOT NULL DEFAULT 5,
    "evidence" JSONB NOT NULL DEFAULT '{}',
    "generated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "implemented_at" TIMESTAMP(3),
    "feedback" TEXT,

    CONSTRAINT "pedagogical_recommendations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "subjects_code_key" ON "subjects"("code");

-- CreateIndex
CREATE INDEX "subjects_is_active_idx" ON "subjects"("is_active");

-- CreateIndex
CREATE INDEX "subjects_code_idx" ON "subjects"("code");

-- CreateIndex
CREATE INDEX "evaluation_formulas_category_idx" ON "evaluation_formulas"("category");

-- CreateIndex
CREATE INDEX "evaluation_formulas_is_active_idx" ON "evaluation_formulas"("is_active");

-- CreateIndex
CREATE INDEX "evaluation_formulas_is_default_idx" ON "evaluation_formulas"("is_default");

-- CreateIndex
CREATE INDEX "evaluations_class_id_idx" ON "evaluations"("class_id");

-- CreateIndex
CREATE INDEX "evaluations_subject_id_idx" ON "evaluations"("subject_id");

-- CreateIndex
CREATE INDEX "evaluations_formula_id_idx" ON "evaluations"("formula_id");

-- CreateIndex
CREATE INDEX "evaluations_evaluation_date_idx" ON "evaluations"("evaluation_date");

-- CreateIndex
CREATE INDEX "evaluations_is_finalized_idx" ON "evaluations"("is_finalized");

-- CreateIndex
CREATE INDEX "evaluations_type_idx" ON "evaluations"("type");

-- CreateIndex
CREATE INDEX "evaluation_results_evaluation_id_idx" ON "evaluation_results"("evaluation_id");

-- CreateIndex
CREATE INDEX "evaluation_results_student_id_idx" ON "evaluation_results"("student_id");

-- CreateIndex
CREATE INDEX "evaluation_results_rank_idx" ON "evaluation_results"("rank");

-- CreateIndex
CREATE INDEX "evaluation_results_is_absent_idx" ON "evaluation_results"("is_absent");

-- CreateIndex
CREATE UNIQUE INDEX "evaluation_results_evaluation_id_student_id_key" ON "evaluation_results"("evaluation_id", "student_id");

-- CreateIndex
CREATE INDEX "evaluation_history_evaluation_id_idx" ON "evaluation_history"("evaluation_id");

-- CreateIndex
CREATE INDEX "evaluation_history_modified_at_idx" ON "evaluation_history"("modified_at");

-- CreateIndex
CREATE INDEX "evaluation_history_modified_by_idx" ON "evaluation_history"("modified_by");

-- CreateIndex
CREATE INDEX "statistics_config_user_id_idx" ON "statistics_config"("user_id");

-- CreateIndex
CREATE INDEX "statistics_config_category_idx" ON "statistics_config"("category");

-- CreateIndex
CREATE INDEX "statistics_config_is_template_idx" ON "statistics_config"("is_template");

-- CreateIndex
CREATE INDEX "statistics_config_is_public_idx" ON "statistics_config"("is_public");

-- CreateIndex
CREATE UNIQUE INDEX "statistics_results_cache_key_key" ON "statistics_results"("cache_key");

-- CreateIndex
CREATE INDEX "statistics_results_config_id_idx" ON "statistics_results"("config_id");

-- CreateIndex
CREATE INDEX "statistics_results_cache_key_idx" ON "statistics_results"("cache_key");

-- CreateIndex
CREATE INDEX "statistics_results_expires_at_idx" ON "statistics_results"("expires_at");

-- CreateIndex
CREATE INDEX "custom_tables_user_id_idx" ON "custom_tables"("user_id");

-- CreateIndex
CREATE INDEX "custom_tables_class_id_idx" ON "custom_tables"("class_id");

-- CreateIndex
CREATE INDEX "custom_tables_category_idx" ON "custom_tables"("category");

-- CreateIndex
CREATE INDEX "custom_tables_is_template_idx" ON "custom_tables"("is_template");

-- CreateIndex
CREATE INDEX "custom_tables_is_public_idx" ON "custom_tables"("is_public");

-- CreateIndex
CREATE INDEX "custom_tables_created_at_idx" ON "custom_tables"("created_at");

-- CreateIndex
CREATE INDEX "custom_table_templates_category_idx" ON "custom_table_templates"("category");

-- CreateIndex
CREATE INDEX "custom_table_templates_is_official_idx" ON "custom_table_templates"("is_official");

-- CreateIndex
CREATE INDEX "custom_table_templates_usage_count_idx" ON "custom_table_templates"("usage_count" DESC);

-- CreateIndex
CREATE INDEX "custom_table_templates_created_by_idx" ON "custom_table_templates"("created_by");

-- CreateIndex
CREATE INDEX "custom_formulas_category_idx" ON "custom_formulas"("category");

-- CreateIndex
CREATE INDEX "custom_formulas_created_by_idx" ON "custom_formulas"("created_by");

-- CreateIndex
CREATE INDEX "custom_formulas_is_public_idx" ON "custom_formulas"("is_public");

-- CreateIndex
CREATE INDEX "custom_formulas_usage_count_idx" ON "custom_formulas"("usage_count" DESC);

-- CreateIndex
CREATE INDEX "annual_reports_status_idx" ON "annual_reports"("status");

-- CreateIndex
CREATE INDEX "annual_reports_template_id_idx" ON "annual_reports"("template_id");

-- CreateIndex
CREATE UNIQUE INDEX "annual_reports_class_id_academic_year_key" ON "annual_reports"("class_id", "academic_year");

-- CreateIndex
CREATE INDEX "report_templates_target_idx" ON "report_templates"("target");

-- CreateIndex
CREATE INDEX "report_templates_is_official_idx" ON "report_templates"("is_official");

-- CreateIndex
CREATE INDEX "report_templates_usage_count_idx" ON "report_templates"("usage_count" DESC);

-- CreateIndex
CREATE INDEX "annual_archives_class_id_academic_year_idx" ON "annual_archives"("class_id", "academic_year");

-- CreateIndex
CREATE INDEX "annual_archives_academic_year_idx" ON "annual_archives"("academic_year");

-- CreateIndex
CREATE INDEX "student_profiles_student_id_academic_year_idx" ON "student_profiles"("student_id", "academic_year");

-- CreateIndex
CREATE INDEX "student_profiles_class_id_academic_year_idx" ON "student_profiles"("class_id", "academic_year");

-- CreateIndex
CREATE INDEX "student_profiles_profile_type_idx" ON "student_profiles"("profile_type");

-- CreateIndex
CREATE INDEX "class_insights_class_id_academic_year_idx" ON "class_insights"("class_id", "academic_year");

-- CreateIndex
CREATE INDEX "class_insights_insight_type_idx" ON "class_insights"("insight_type");

-- CreateIndex
CREATE INDEX "class_insights_priority_idx" ON "class_insights"("priority");

-- CreateIndex
CREATE INDEX "pedagogical_recommendations_class_id_academic_year_idx" ON "pedagogical_recommendations"("class_id", "academic_year");

-- CreateIndex
CREATE INDEX "pedagogical_recommendations_category_idx" ON "pedagogical_recommendations"("category");

-- CreateIndex
CREATE INDEX "pedagogical_recommendations_priority_idx" ON "pedagogical_recommendations"("priority" DESC);

-- AddForeignKey
ALTER TABLE "classes" ADD CONSTRAINT "classes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "students" ADD CONSTRAINT "students_class_id_fkey" FOREIGN KEY ("class_id") REFERENCES "classes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "evaluations" ADD CONSTRAINT "evaluations_class_id_fkey" FOREIGN KEY ("class_id") REFERENCES "classes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "evaluations" ADD CONSTRAINT "evaluations_subject_id_fkey" FOREIGN KEY ("subject_id") REFERENCES "subjects"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "evaluations" ADD CONSTRAINT "evaluations_formula_id_fkey" FOREIGN KEY ("formula_id") REFERENCES "evaluation_formulas"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "evaluation_results" ADD CONSTRAINT "evaluation_results_evaluation_id_fkey" FOREIGN KEY ("evaluation_id") REFERENCES "evaluations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "evaluation_results" ADD CONSTRAINT "evaluation_results_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "evaluation_results" ADD CONSTRAINT "evaluation_results_last_modified_by_fkey" FOREIGN KEY ("last_modified_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "evaluation_history" ADD CONSTRAINT "evaluation_history_evaluation_id_fkey" FOREIGN KEY ("evaluation_id") REFERENCES "evaluations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "evaluation_history" ADD CONSTRAINT "evaluation_history_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "evaluation_history" ADD CONSTRAINT "evaluation_history_modified_by_fkey" FOREIGN KEY ("modified_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "statistics_config" ADD CONSTRAINT "statistics_config_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "statistics_results" ADD CONSTRAINT "statistics_results_config_id_fkey" FOREIGN KEY ("config_id") REFERENCES "statistics_config"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "statistics_results" ADD CONSTRAINT "statistics_results_generated_by_fkey" FOREIGN KEY ("generated_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "custom_tables" ADD CONSTRAINT "custom_tables_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "custom_tables" ADD CONSTRAINT "custom_tables_class_id_fkey" FOREIGN KEY ("class_id") REFERENCES "classes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "custom_table_templates" ADD CONSTRAINT "custom_table_templates_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "custom_formulas" ADD CONSTRAINT "custom_formulas_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "annual_reports" ADD CONSTRAINT "annual_reports_class_id_fkey" FOREIGN KEY ("class_id") REFERENCES "classes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "annual_reports" ADD CONSTRAINT "annual_reports_template_id_fkey" FOREIGN KEY ("template_id") REFERENCES "report_templates"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "report_templates" ADD CONSTRAINT "report_templates_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "annual_archives" ADD CONSTRAINT "annual_archives_class_id_fkey" FOREIGN KEY ("class_id") REFERENCES "classes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_profiles" ADD CONSTRAINT "student_profiles_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_profiles" ADD CONSTRAINT "student_profiles_class_id_fkey" FOREIGN KEY ("class_id") REFERENCES "classes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "class_insights" ADD CONSTRAINT "class_insights_class_id_fkey" FOREIGN KEY ("class_id") REFERENCES "classes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "class_insights" ADD CONSTRAINT "class_insights_acknowledged_by_fkey" FOREIGN KEY ("acknowledged_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pedagogical_recommendations" ADD CONSTRAINT "pedagogical_recommendations_class_id_fkey" FOREIGN KEY ("class_id") REFERENCES "classes"("id") ON DELETE CASCADE ON UPDATE CASCADE;
