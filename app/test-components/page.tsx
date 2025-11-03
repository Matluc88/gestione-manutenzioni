'use client';

import { useState } from 'react';
import ArchivioFiltri from '@/components/ArchivioFiltri';
import ArchivioLista from '@/components/ArchivioLista';
import Paginazione from '@/components/Paginazione';

export default function TestComponentsPage() {
  const [filtri, setFiltri] = useState({
    search: '',
    impiantoId: '',
    utenteId: '',
    tipo: '',
    stato: '',
    dataInizio: '',
    dataFine: '',
  });

  const mockReport = [
    {
      id: 1,
      codice: 'ANG-MAN-2025-0001',
      tipo: 'MANUTENZIONE',
      stato: 'COMPLETATO',
      pdfPath: '/pdf/test.pdf',
      creatoIl: new Date().toISOString(),
      numAttivita: 5,
      impiantoId: 1,
      impianto: { nome: 'Impianto Test', proprieta: 'Proprietà Test' },
      utente: { username: 'testuser' },
    },
    {
      id: 2,
      codice: 'ANG-INT-2025-0001',
      tipo: 'INTERVENTO',
      stato: 'BOZZA',
      pdfPath: null,
      creatoIl: new Date().toISOString(),
      numAttivita: 3,
      impiantoId: 2,
      impianto: { nome: 'Impianto 2', proprieta: null },
      utente: { username: 'testuser' },
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <h1 className="text-3xl font-bold">Test Componenti Archivio</h1>

        <div>
          <h2 className="text-xl font-bold mb-4">Filtri</h2>
          <ArchivioFiltri
            filtri={filtri}
            onChange={setFiltri}
            isAdmin={true}
          />
        </div>

        <div>
          <h2 className="text-xl font-bold mb-4">Lista Report</h2>
          <ArchivioLista
            report={mockReport}
            isAdmin={true}
            onDelete={(id) => console.log('Delete', id)}
            onView={(id) => console.log('View', id)}
          />
        </div>

        <div>
          <h2 className="text-xl font-bold mb-4">Paginazione</h2>
          <Paginazione
            currentPage={3}
            totalPages={10}
            totalCount={200}
            onPageChange={(page) => console.log('Page', page)}
          />
        </div>
      </div>
    </div>
  );
}
