# Foto facoltative nei report

**Stato:** codice completato e pushato su `claude/gestione-manutenzioni-ph3suh` (nov 2026).
Da fare: aprire la PR verso main, merge, verificare il deploy e avvisare l'ingegnere.

## Richiesta
L'ingegnere ha scritto: "se non carichi almeno 1 foto non ti genera il report".
Non era un bug: l'app era progettata così (foto obbligatoria per attività FATTO/NON_FATTO).
Gli abbiamo chiesto via WhatsApp cosa preferiva → scelta: **foto sempre facoltative**.

## Modifiche fatte (`components/ManutenzioneForm.tsx`, `components/InterventoForm.tsx`)
- Rimosso il controllo "Foto obbligatoria per attività" in `salvaAttivita`
- Rimosso `required` da `FotoUpload` (niente asterisco/avviso)
- Bug collaterale corretto: `salvaAttivita` ora ritorna `boolean`; se la validazione fallisce,
  "Salva bozza" e "Genera PDF" si fermano (prima marcavano il report COMPLETATO comunque)
- Lato server nessun vincolo sulle foto; il PDF salta già la sezione foto se vuota
- tsc e eslint ok; non testato con l'app avviata

## Prossimi passi
1. PR → main e merge (deploy Render/Vercel)
2. Prova reale: report con attività FATTO senza foto → PDF generato
3. Messaggio all'ingegnere che è sistemato
