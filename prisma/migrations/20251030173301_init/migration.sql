-- CreateEnum
CREATE TYPE "Ruolo" AS ENUM ('ADMIN', 'COLLABORATORE');

-- CreateTable
CREATE TABLE "utenti" (
    "id" SERIAL NOT NULL,
    "username" VARCHAR(50) NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "ruolo" "Ruolo" NOT NULL DEFAULT 'COLLABORATORE',
    "attivo" BOOLEAN NOT NULL DEFAULT true,
    "creatoIl" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "utenti_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "impostazioni" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "nomeAzienda" TEXT NOT NULL DEFAULT 'Angelo S.r.l.',
    "telefono" TEXT,
    "email" TEXT,
    "logoPath" TEXT,
    "intestazionePdf" TEXT NOT NULL DEFAULT 'Report generato automaticamente',

    CONSTRAINT "impostazioni_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "utenti_username_key" ON "utenti"("username");
