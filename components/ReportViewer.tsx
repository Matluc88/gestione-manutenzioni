'use client';

import { useState, useEffect } from 'react';
import { Download, Loader2 } from 'lucide-react';
import Image from 'next/image';

interface Report {
  id: number;
  codice: string;
  tipo: string;
  stato: string;
  pdfPath: string | null;
  creatoIl: string;
  impianto: {
    nome: string;
    proprieta: string | null;
  };
  utente: {
    username: string;
  };
  attivita: {
    id: number;
    descrizione: string;
    stato: string;
    motivazione: string | null;
    note: string | null;
    componente: {
      nome: string;
    } | null;
    foto: {
      id: number;
      filePath: string;
      fileName: string;
    }[];
  }[];
}

export default function ReportViewer({ reportId }: { reportId: number }) {
  const [report, setReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    const fetchReport = async () => {
      setLoading(true);
      const res = await fetch(`/api/report/${reportId}`);
      const data = await res.json();
      setReport(data);
      setLoading(false);
    };

    fetchReport();
  }, [reportId]);

  const handleDownload = async () => {
    setDownloading(true);
    window.open(`/api/report/${reportId}/pdf`, '_blank');
    setTimeout(() => setDownloading(false), 2000);
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="animate-spin text-gray-400" size={40} />
      </div>
    );
  }

  if (!report) {
    return (
      <div className="text-center py-12 text-red-600">
        Report non trovato
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {report.tipo === 'MANUTENZIONE' ? 'Manutenzione ordinaria' : 'Intervento tecnico'}
            </h1>
            <p className="text-gray-600 mt-1">Codice: {report.codice}</p>
          </div>
          
          {report.pdfPath && (
            <button
              onClick={handleDownload}
              disabled={downloading}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition"
            >
              {downloading ? <Loader2 className="animate-spin" size={20} /> : <Download size={20} />}
              Scarica PDF
            </button>
          )}
        </div>

        <div className="mt-6 grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="font-semibold">Data:</span>{' '}
            {new Date(report.creatoIl).toLocaleDateString('it-IT')}
          </div>
          <div>
            <span className="font-semibold">Operatore:</span> {report.utente.username}
          </div>
          <div>
            <span className="font-semibold">Impianto:</span> {report.impianto.nome}
          </div>
          {report.impianto.proprieta && (
            <div>
              <span className="font-semibold">Proprietà:</span> {report.impianto.proprieta}
            </div>
          )}
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="text-xl font-bold">Attività</h2>
        
        {report.attivita.map((att, index) => (
          <div key={att.id} className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-lg font-semibold">
                {index + 1}. {att.descrizione}
              </h3>
              <span
                className={`px-3 py-1 rounded-full text-sm font-medium ${
                  att.stato === 'FATTO'
                    ? 'bg-green-100 text-green-700'
                    : att.stato === 'NON_FATTO'
                    ? 'bg-red-100 text-red-700'
                    : 'bg-gray-100 text-gray-700'
                }`}
              >
                {att.stato === 'FATTO' ? '✓ Fatto' : att.stato === 'NON_FATTO' ? '✗ Non fatto' : '○ N/A'}
              </span>
            </div>

            {att.componente && (
              <p className="text-sm text-gray-600 mb-3">
                Componente: {att.componente.nome}
              </p>
            )}

            {att.motivazione && (
              <div className="mb-3">
                <p className="text-sm font-semibold text-gray-700">Motivazione:</p>
                <p className="text-sm text-gray-600">{att.motivazione}</p>
              </div>
            )}

            {att.note && (
              <div className="mb-3">
                <p className="text-sm font-semibold text-gray-700">Note:</p>
                <p className="text-sm text-gray-600">{att.note}</p>
              </div>
            )}

            {att.foto.length > 0 && (
              <div>
                <p className="text-sm font-semibold text-gray-700 mb-2">
                  Foto ({att.foto.length}):
                </p>
                <div className="grid grid-cols-3 gap-4">
                  {att.foto.map((foto) => (
                    <div key={foto.id}>
                      <Image
                        src={foto.filePath}
                        alt={foto.fileName}
                        width={200}
                        height={200}
                        className="w-full h-32 object-cover rounded-lg border border-gray-200"
                      />
                      <p className="text-xs text-gray-500 mt-1 truncate">
                        {foto.fileName}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
