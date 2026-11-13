// Helper per la data dell'intervento scelta dall'operatore.
// Il campo <input type="datetime-local"> lavora con stringhe "YYYY-MM-DDTHH:mm"
// nell'ora locale del browser; nel database salviamo un istante (UTC).

const pad = (n: number) => n.toString().padStart(2, '0');

/** Converte una data (Date o stringa ISO) nel formato di <input type="datetime-local">, ora locale. */
export function toDatetimeLocal(value: Date | string | null | undefined): string {
  if (!value) return '';
  const d = typeof value === 'string' ? new Date(value) : value;
  if (isNaN(d.getTime())) return '';
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/** Converte il valore di <input type="datetime-local"> (ora locale) in stringa ISO, o null se vuoto/non valido. */
export function datetimeLocalToISO(value: string): string | null {
  if (!value) return null;
  const d = new Date(value);
  return isNaN(d.getTime()) ? null : d.toISOString();
}

/** Formatta data e ora per il PDF sempre nel fuso italiano, indipendentemente dal fuso del server. */
export function formatDataOraIT(value: Date | string): string {
  const d = typeof value === 'string' ? new Date(value) : value;
  return d.toLocaleString('it-IT', {
    timeZone: 'Europe/Rome',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}
