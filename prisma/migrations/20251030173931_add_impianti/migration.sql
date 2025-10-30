-- CreateTable
CREATE TABLE "impianti" (
    "id" SERIAL NOT NULL,
    "nome" VARCHAR(100) NOT NULL,
    "proprieta" VARCHAR(100),
    "creatoIl" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "creatoId" INTEGER NOT NULL,

    CONSTRAINT "impianti_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "impianti" ADD CONSTRAINT "impianti_creatoId_fkey" FOREIGN KEY ("creatoId") REFERENCES "utenti"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
