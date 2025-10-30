-- CreateEnum
CREATE TYPE "TipoReport" AS ENUM ('MANUTENZIONE', 'INTERVENTO');

-- CreateEnum
CREATE TYPE "StatoReport" AS ENUM ('BOZZA', 'COMPLETATO');

-- CreateEnum
CREATE TYPE "StatoAttivita" AS ENUM ('FATTO', 'NON_FATTO', 'NON_APPLICABILE');

-- CreateTable
CREATE TABLE "report" (
    "id" SERIAL NOT NULL,
    "codice" VARCHAR(20) NOT NULL,
    "tipo" "TipoReport" NOT NULL,
    "stato" "StatoReport" NOT NULL DEFAULT 'BOZZA',
    "pdfPath" TEXT,
    "creatoIl" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "modificatoIl" TIMESTAMP(3) NOT NULL,
    "impiantoId" INTEGER NOT NULL,
    "utenteId" INTEGER NOT NULL,

    CONSTRAINT "report_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "componenti" (
    "id" SERIAL NOT NULL,
    "nome" VARCHAR(100) NOT NULL,
    "predefinito" BOOLEAN NOT NULL DEFAULT false,
    "impiantoId" INTEGER,

    CONSTRAINT "componenti_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "attivita" (
    "id" SERIAL NOT NULL,
    "descrizione" TEXT NOT NULL,
    "stato" "StatoAttivita" NOT NULL,
    "motivazione" TEXT,
    "note" TEXT,
    "ordine" INTEGER NOT NULL DEFAULT 0,
    "reportId" INTEGER NOT NULL,
    "componenteId" INTEGER,

    CONSTRAINT "attivita_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "report_codice_key" ON "report"("codice");

-- CreateIndex
CREATE INDEX "report_codice_stato_creatoIl_idx" ON "report"("codice", "stato", "creatoIl");

-- AddForeignKey
ALTER TABLE "report" ADD CONSTRAINT "report_impiantoId_fkey" FOREIGN KEY ("impiantoId") REFERENCES "impianti"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "report" ADD CONSTRAINT "report_utenteId_fkey" FOREIGN KEY ("utenteId") REFERENCES "utenti"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "componenti" ADD CONSTRAINT "componenti_impiantoId_fkey" FOREIGN KEY ("impiantoId") REFERENCES "impianti"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attivita" ADD CONSTRAINT "attivita_reportId_fkey" FOREIGN KEY ("reportId") REFERENCES "report"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attivita" ADD CONSTRAINT "attivita_componenteId_fkey" FOREIGN KEY ("componenteId") REFERENCES "componenti"("id") ON DELETE SET NULL ON UPDATE CASCADE;
