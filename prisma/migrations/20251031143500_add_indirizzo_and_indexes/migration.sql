ALTER TABLE "impostazioni" ADD COLUMN "indirizzo" TEXT;

CREATE INDEX "report_impiantoId_idx" ON "report"("impiantoId");

CREATE INDEX "report_utenteId_idx" ON "report"("utenteId");

CREATE INDEX "report_stato_idx" ON "report"("stato");

CREATE INDEX "report_tipo_idx" ON "report"("tipo");

CREATE INDEX "report_creatoIl_idx" ON "report"("creatoIl");

CREATE INDEX "attivita_reportId_idx" ON "attivita"("reportId");

CREATE INDEX "attivita_componenteId_idx" ON "attivita"("componenteId");

CREATE INDEX "foto_attivitaId_idx" ON "foto"("attivitaId");
