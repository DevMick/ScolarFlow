/*
  Warnings:

  - You are about to drop the column `academic_year` on the `classes` table. All the data in the column will be lost.
  - You are about to drop the column `student_count` on the `classes` table. All the data in the column will be lost.
  - You are about to drop the column `category` on the `evaluation_formulas` table. All the data in the column will be lost.
  - You are about to drop the column `description` on the `evaluation_formulas` table. All the data in the column will be lost.
  - You are about to drop the column `is_active` on the `evaluation_formulas` table. All the data in the column will be lost.
  - You are about to drop the column `is_default` on the `evaluation_formulas` table. All the data in the column will be lost.
  - You are about to drop the column `variables` on the `evaluation_formulas` table. All the data in the column will be lost.
  - You are about to drop the column `absent_handling` on the `evaluations` table. All the data in the column will be lost.
  - You are about to drop the column `coefficient` on the `evaluations` table. All the data in the column will be lost.
  - You are about to drop the column `description` on the `evaluations` table. All the data in the column will be lost.
  - You are about to drop the column `evaluation_date` on the `evaluations` table. All the data in the column will be lost.
  - You are about to drop the column `formula_id` on the `evaluations` table. All the data in the column will be lost.
  - You are about to drop the column `is_finalized` on the `evaluations` table. All the data in the column will be lost.
  - You are about to drop the column `max_score` on the `evaluations` table. All the data in the column will be lost.
  - You are about to drop the column `rounding_method` on the `evaluations` table. All the data in the column will be lost.
  - You are about to drop the column `show_ranking` on the `evaluations` table. All the data in the column will be lost.
  - You are about to drop the column `subject_id` on the `evaluations` table. All the data in the column will be lost.
  - You are about to drop the column `title` on the `evaluations` table. All the data in the column will be lost.
  - You are about to drop the column `type` on the `evaluations` table. All the data in the column will be lost.
  - You are about to drop the column `code` on the `subjects` table. All the data in the column will be lost.
  - You are about to drop the column `color` on the `subjects` table. All the data in the column will be lost.
  - You are about to drop the column `description` on the `subjects` table. All the data in the column will be lost.
  - You are about to drop the column `is_active` on the `subjects` table. All the data in the column will be lost.
  - You are about to drop the column `phone` on the `users` table. All the data in the column will be lost.
  - You are about to drop the `annual_archives` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `annual_reports` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `class_insights` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `custom_formulas` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `custom_table_templates` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `custom_tables` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `evaluation_history` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `evaluation_results` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `pedagogical_recommendations` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `report_templates` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `statistics_config` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `statistics_results` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `student_profiles` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[class_id,name]` on the table `subjects` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `user_id` to the `class_thresholds` table without a default value. This is not possible if the table is not empty.
  - Added the required column `user_id` to the `evaluation_formulas` table without a default value. This is not possible if the table is not empty.
  - Added the required column `date` to the `evaluations` table without a default value. This is not possible if the table is not empty.
  - Added the required column `nom` to the `evaluations` table without a default value. This is not possible if the table is not empty.
  - Added the required column `school_year_id` to the `evaluations` table without a default value. This is not possible if the table is not empty.
  - Added the required column `school_year_id` to the `students` table without a default value. This is not possible if the table is not empty.
  - Added the required column `class_id` to the `subjects` table without a default value. This is not possible if the table is not empty.
  - Added the required column `user_id` to the `subjects` table without a default value. This is not possible if the table is not empty.
  - Added the required column `direction_regionale` to the `users` table without a default value. This is not possible if the table is not empty.
  - Added the required column `secteur_pedagogique` to the `users` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "annual_archives" DROP CONSTRAINT "annual_archives_class_id_fkey";

-- DropForeignKey
ALTER TABLE "annual_reports" DROP CONSTRAINT "annual_reports_class_id_fkey";

-- DropForeignKey
ALTER TABLE "annual_reports" DROP CONSTRAINT "annual_reports_template_id_fkey";

-- DropForeignKey
ALTER TABLE "class_insights" DROP CONSTRAINT "class_insights_acknowledged_by_fkey";

-- DropForeignKey
ALTER TABLE "class_insights" DROP CONSTRAINT "class_insights_class_id_fkey";

-- DropForeignKey
ALTER TABLE "custom_formulas" DROP CONSTRAINT "custom_formulas_created_by_fkey";

-- DropForeignKey
ALTER TABLE "custom_table_templates" DROP CONSTRAINT "custom_table_templates_created_by_fkey";

-- DropForeignKey
ALTER TABLE "custom_tables" DROP CONSTRAINT "custom_tables_class_id_fkey";

-- DropForeignKey
ALTER TABLE "custom_tables" DROP CONSTRAINT "custom_tables_user_id_fkey";

-- DropForeignKey
ALTER TABLE "evaluation_history" DROP CONSTRAINT "evaluation_history_evaluation_id_fkey";

-- DropForeignKey
ALTER TABLE "evaluation_history" DROP CONSTRAINT "evaluation_history_modified_by_fkey";

-- DropForeignKey
ALTER TABLE "evaluation_history" DROP CONSTRAINT "evaluation_history_student_id_fkey";

-- DropForeignKey
ALTER TABLE "evaluation_results" DROP CONSTRAINT "evaluation_results_evaluation_id_fkey";

-- DropForeignKey
ALTER TABLE "evaluation_results" DROP CONSTRAINT "evaluation_results_last_modified_by_fkey";

-- DropForeignKey
ALTER TABLE "evaluation_results" DROP CONSTRAINT "evaluation_results_student_id_fkey";

-- DropForeignKey
ALTER TABLE "evaluations" DROP CONSTRAINT "evaluations_formula_id_fkey";

-- DropForeignKey
ALTER TABLE "evaluations" DROP CONSTRAINT "evaluations_subject_id_fkey";

-- DropForeignKey
ALTER TABLE "pedagogical_recommendations" DROP CONSTRAINT "pedagogical_recommendations_class_id_fkey";

-- DropForeignKey
ALTER TABLE "report_templates" DROP CONSTRAINT "report_templates_created_by_fkey";

-- DropForeignKey
ALTER TABLE "statistics_config" DROP CONSTRAINT "statistics_config_user_id_fkey";

-- DropForeignKey
ALTER TABLE "statistics_results" DROP CONSTRAINT "statistics_results_config_id_fkey";

-- DropForeignKey
ALTER TABLE "statistics_results" DROP CONSTRAINT "statistics_results_generated_by_fkey";

-- DropForeignKey
ALTER TABLE "student_profiles" DROP CONSTRAINT "student_profiles_class_id_fkey";

-- DropForeignKey
ALTER TABLE "student_profiles" DROP CONSTRAINT "student_profiles_student_id_fkey";

-- DropIndex
DROP INDEX "evaluation_formulas_category_idx";

-- DropIndex
DROP INDEX "evaluation_formulas_is_active_idx";

-- DropIndex
DROP INDEX "evaluation_formulas_is_default_idx";

-- DropIndex
DROP INDEX "evaluations_evaluation_date_idx";

-- DropIndex
DROP INDEX "evaluations_formula_id_idx";

-- DropIndex
DROP INDEX "evaluations_is_finalized_idx";

-- DropIndex
DROP INDEX "evaluations_subject_id_idx";

-- DropIndex
DROP INDEX "evaluations_type_idx";

-- DropIndex
DROP INDEX "subjects_code_idx";

-- DropIndex
DROP INDEX "subjects_code_key";

-- DropIndex
DROP INDEX "subjects_is_active_idx";

-- AlterTable
ALTER TABLE "class_thresholds" ADD COLUMN     "user_id" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "classes" DROP COLUMN "academic_year",
DROP COLUMN "student_count";

-- AlterTable
ALTER TABLE "evaluation_formulas" DROP COLUMN "category",
DROP COLUMN "description",
DROP COLUMN "is_active",
DROP COLUMN "is_default",
DROP COLUMN "variables",
ADD COLUMN     "user_id" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "evaluations" DROP COLUMN "absent_handling",
DROP COLUMN "coefficient",
DROP COLUMN "description",
DROP COLUMN "evaluation_date",
DROP COLUMN "formula_id",
DROP COLUMN "is_finalized",
DROP COLUMN "max_score",
DROP COLUMN "rounding_method",
DROP COLUMN "show_ranking",
DROP COLUMN "subject_id",
DROP COLUMN "title",
DROP COLUMN "type",
ADD COLUMN     "date" DATE NOT NULL,
ADD COLUMN     "nom" VARCHAR(200) NOT NULL,
ADD COLUMN     "school_year_id" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "students" ADD COLUMN     "school_year_id" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "subjects" DROP COLUMN "code",
DROP COLUMN "color",
DROP COLUMN "description",
DROP COLUMN "is_active",
ADD COLUMN     "class_id" INTEGER NOT NULL,
ADD COLUMN     "user_id" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "users" DROP COLUMN "phone",
ADD COLUMN     "direction_regionale" TEXT NOT NULL,
ADD COLUMN     "gender" TEXT,
ADD COLUMN     "secteur_pedagogique" TEXT NOT NULL;

-- DropTable
DROP TABLE "annual_archives";

-- DropTable
DROP TABLE "annual_reports";

-- DropTable
DROP TABLE "class_insights";

-- DropTable
DROP TABLE "custom_formulas";

-- DropTable
DROP TABLE "custom_table_templates";

-- DropTable
DROP TABLE "custom_tables";

-- DropTable
DROP TABLE "evaluation_history";

-- DropTable
DROP TABLE "evaluation_results";

-- DropTable
DROP TABLE "pedagogical_recommendations";

-- DropTable
DROP TABLE "report_templates";

-- DropTable
DROP TABLE "statistics_config";

-- DropTable
DROP TABLE "statistics_results";

-- DropTable
DROP TABLE "student_profiles";

-- CreateTable
CREATE TABLE "school_years" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "start_year" INTEGER NOT NULL,
    "end_year" INTEGER NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "school_years_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "class_average_configs" (
    "id" SERIAL NOT NULL,
    "class_id" INTEGER NOT NULL,
    "user_id" INTEGER NOT NULL,
    "divisor" DECIMAL(5,2) NOT NULL,
    "formula" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "class_average_configs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notes" (
    "id" SERIAL NOT NULL,
    "student_id" INTEGER NOT NULL,
    "subject_id" INTEGER NOT NULL,
    "evaluation_id" INTEGER NOT NULL,
    "user_id" INTEGER NOT NULL,
    "value" DECIMAL(5,2) NOT NULL,
    "is_absent" BOOLEAN NOT NULL DEFAULT false,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "notes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "moyennes" (
    "id" SERIAL NOT NULL,
    "student_id" INTEGER NOT NULL,
    "evaluation_id" INTEGER NOT NULL,
    "user_id" INTEGER NOT NULL,
    "moyenne" DECIMAL(5,2) NOT NULL,
    "date" DATE NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "moyennes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "school_years_user_id_idx" ON "school_years"("user_id");

-- CreateIndex
CREATE INDEX "school_years_is_active_idx" ON "school_years"("is_active");

-- CreateIndex
CREATE UNIQUE INDEX "school_years_user_id_start_year_end_year_key" ON "school_years"("user_id", "start_year", "end_year");

-- CreateIndex
CREATE INDEX "class_average_configs_class_id_idx" ON "class_average_configs"("class_id");

-- CreateIndex
CREATE INDEX "class_average_configs_user_id_idx" ON "class_average_configs"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "class_average_configs_class_id_user_id_key" ON "class_average_configs"("class_id", "user_id");

-- CreateIndex
CREATE INDEX "notes_student_id_idx" ON "notes"("student_id");

-- CreateIndex
CREATE INDEX "notes_subject_id_idx" ON "notes"("subject_id");

-- CreateIndex
CREATE INDEX "notes_evaluation_id_idx" ON "notes"("evaluation_id");

-- CreateIndex
CREATE INDEX "notes_user_id_idx" ON "notes"("user_id");

-- CreateIndex
CREATE INDEX "notes_is_active_idx" ON "notes"("is_active");

-- CreateIndex
CREATE INDEX "moyennes_student_id_idx" ON "moyennes"("student_id");

-- CreateIndex
CREATE INDEX "moyennes_evaluation_id_idx" ON "moyennes"("evaluation_id");

-- CreateIndex
CREATE INDEX "moyennes_user_id_idx" ON "moyennes"("user_id");

-- CreateIndex
CREATE INDEX "moyennes_date_idx" ON "moyennes"("date");

-- CreateIndex
CREATE INDEX "moyennes_is_active_idx" ON "moyennes"("is_active");

-- CreateIndex
CREATE INDEX "class_thresholds_user_id_idx" ON "class_thresholds"("user_id");

-- CreateIndex
CREATE INDEX "classes_user_id_idx" ON "classes"("user_id");

-- CreateIndex
CREATE INDEX "evaluation_formulas_user_id_idx" ON "evaluation_formulas"("user_id");

-- CreateIndex
CREATE INDEX "evaluations_school_year_id_idx" ON "evaluations"("school_year_id");

-- CreateIndex
CREATE INDEX "evaluations_date_idx" ON "evaluations"("date");

-- CreateIndex
CREATE INDEX "students_school_year_id_idx" ON "students"("school_year_id");

-- CreateIndex
CREATE INDEX "subjects_class_id_idx" ON "subjects"("class_id");

-- CreateIndex
CREATE INDEX "subjects_user_id_idx" ON "subjects"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "subjects_class_id_name_key" ON "subjects"("class_id", "name");

-- AddForeignKey
ALTER TABLE "school_years" ADD CONSTRAINT "school_years_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "students" ADD CONSTRAINT "students_school_year_id_fkey" FOREIGN KEY ("school_year_id") REFERENCES "school_years"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subjects" ADD CONSTRAINT "subjects_class_id_fkey" FOREIGN KEY ("class_id") REFERENCES "classes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subjects" ADD CONSTRAINT "subjects_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "evaluation_formulas" ADD CONSTRAINT "evaluation_formulas_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "class_average_configs" ADD CONSTRAINT "class_average_configs_class_id_fkey" FOREIGN KEY ("class_id") REFERENCES "classes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "class_average_configs" ADD CONSTRAINT "class_average_configs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "evaluations" ADD CONSTRAINT "evaluations_school_year_id_fkey" FOREIGN KEY ("school_year_id") REFERENCES "school_years"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notes" ADD CONSTRAINT "notes_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notes" ADD CONSTRAINT "notes_subject_id_fkey" FOREIGN KEY ("subject_id") REFERENCES "subjects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notes" ADD CONSTRAINT "notes_evaluation_id_fkey" FOREIGN KEY ("evaluation_id") REFERENCES "evaluations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notes" ADD CONSTRAINT "notes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "moyennes" ADD CONSTRAINT "moyennes_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "moyennes" ADD CONSTRAINT "moyennes_evaluation_id_fkey" FOREIGN KEY ("evaluation_id") REFERENCES "evaluations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "moyennes" ADD CONSTRAINT "moyennes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "class_thresholds" ADD CONSTRAINT "class_thresholds_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
