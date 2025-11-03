-- Migration pour ajouter la table class_thresholds
-- À exécuter avec pgAdmin ou psql

CREATE TABLE IF NOT EXISTS "class_thresholds" (
    "id" SERIAL NOT NULL,
    "class_id" INTEGER NOT NULL,
    "moyenne_admission" DECIMAL(5,2) NOT NULL,
    "moyenne_redoublement" DECIMAL(5,2) NOT NULL,
    "max_note" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "class_thresholds_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "class_thresholds_class_id_key" ON "class_thresholds"("class_id");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "class_thresholds_class_id_idx" ON "class_thresholds"("class_id");

-- AddForeignKey
ALTER TABLE "class_thresholds" 
ADD CONSTRAINT "class_thresholds_class_id_fkey" 
FOREIGN KEY ("class_id") REFERENCES "classes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

