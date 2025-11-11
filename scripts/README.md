# Scripts per Gestione Manutenzioni

## regenerate-all-pdfs.ts

Script per rigenerare tutti i PDF dei report con il nuovo stile grafico.

### Cosa fa

1. Trova tutti i report COMPLETATO con PDF già generati
2. Cancella i file PDF dalla cartella `public/pdf/`
3. Resetta il campo `pdfPath` nel database
4. I PDF verranno rigenerati automaticamente con il nuovo stile quando l'utente li aprirà dall'archivio

### Come usare

```bash
# Dalla root del progetto
npx tsx scripts/regenerate-all-pdfs.ts
```

### Requisiti

- Database PostgreSQL configurato e accessibile
- File `.env` con `DATABASE_URL` corretto
- Permessi di scrittura sulla cartella `public/pdf/`

### Output

Lo script mostra:
- ✅ Numero di PDF cancellati
- ❌ Eventuali errori
- 📝 Numero di record aggiornati nel database

### Nota

Dopo aver eseguito lo script, i PDF verranno rigenerati automaticamente quando:
- Un utente apre un report dall'archivio
- Il sistema chiama l'endpoint `/api/report/[id]/pdf`

Il nuovo stile include:
- Font professionali: Montserrat Bold (titoli) + Open Sans Regular (corpo)
- Palette colori ONE-M Energy Solutions
- Simboli sostituiti con testo leggibile
- Watermark più discreto (opacità 0.08)
