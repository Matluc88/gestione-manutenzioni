ALTER TABLE "impostazioni" ADD COLUMN "indirizzo" TEXT;

-- CreateTable
CREATE TABLE "foto" (
    "id" SERIAL NOT NULL,
    "filePath" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "mimeType" TEXT NOT NULL,
    "caricataIl" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "attivitaId" INTEGER NOT NULL,

    CONSTRAINT "foto_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "report_impiantoId_idx" ON "report"("impiantoId");

-- CreateIndex
CREATE INDEX "report_utenteId_idx" ON "report"("utenteId");

-- CreateIndex
CREATE INDEX "report_stato_idx" ON "report"("stato");

-- CreateIndex
CREATE INDEX "report_tipo_idx" ON "report"("tipo");

-- CreateIndex
CREATE INDEX "report_creatoIl_idx" ON "report"("creatoIl");

-- CreateIndex
CREATE INDEX "attivita_reportId_idx" ON "attivita"("reportId");

-- CreateIndex
CREATE INDEX "attivita_componenteId_idx" ON "attivita"("componenteId");

-- CreateIndex
CREATE INDEX "foto_attivitaId_idx" ON "foto"("attivitaId");

-- AddForeignKey
ALTER TABLE "foto" ADD CONSTRAINT "foto_attivitaId_fkey" FOREIGN KEY ("attivitaId") REFERENCES "attivita"("id") ON DELETE CASCADE ON UPDATE CASCADE;
