'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { redirect } from 'next/navigation';
import Navbar from '@/components/Navbar';
import ArchivioFiltri from '@/components/ArchivioFiltri';
import ArchivioLista from '@/components/ArchivioLista';
import Paginazione from '@/components/Paginazione';
import ReportModal from '@/components/ReportModal';
import { Loader2 } from 'lucide-react';

interface Report {
  id: number;
  codice: string;
  tipo: string;
  stato: string;
  pdfPath: string | null;
  creatoIl: string;
  numAttivita: number;
  impiantoId: number;
  impianto: {
    nome: string;
    proprieta: string | null;
  };
  utente: {
    username: string;
  };
}

interface Pagination {
  page: number;
  totalPages: number;
  totalCount: number;
  limit: number;
}

export default function ArchivioPage() {
  const { data: session, status } = useSession();
  const [report, setReport] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedReportId, setSelectedReportId] = useState<number | null>(null);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    totalPages: 1,
    totalCount: 0,
    limit: 20,
  });

  const [filtri, setFiltri] = useState({
    search: '',
    impiantoId: '',
    utenteId: '',
    tipo: '',
    stato: '',
    dataInizio: '',
    dataFine: '',
  });

  useEffect(() => {
    if (status === 'unauthenticated') {
      redirect('/login');
    }
  }, [status]);

  const fetchReport = useCallback(async () => {
    setLoading(true);

    try {
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        ...Object.fromEntries(
          Object.entries(filtri).filter(([, value]) => value !== '')
        ),
      });

      const res = await fetch(`/api/report?${params}`);
      
      if (!res.ok) {
        throw new Error('Errore caricamento report');
      }

      const data = await res.json();

      setReport(data.report);
      setPagination({
        page: data.pagination.page,
        totalPages: data.pagination.totalPages,
        totalCount: data.pagination.totalCount,
        limit: data.pagination.limit,
      });
    } catch (error) {
      console.error('Errore fetch report:', error);
      alert('Errore durante caricamento dei report');
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.limit, filtri]);

  useEffect(() => {
    if (session) {
      fetchReport();
    }
  }, [session, fetchReport]);

  const handleFiltriChange = (newFiltri: typeof filtri) => {
    setFiltri(newFiltri);
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handlePageChange = (newPage: number) => {
    setPagination(prev => ({ ...prev, page: newPage }));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = (reportId: number) => {
    setReport(prev => prev.filter(r => r.id !== reportId));
    setPagination(prev => ({
      ...prev,
      totalCount: prev.totalCount - 1,
      totalPages: Math.ceil((prev.totalCount - 1) / prev.limit),
    }));
  };

  const handleView = (reportId: number) => {
    setSelectedReportId(reportId);
  };

  const handleCloseModal = () => {
    setSelectedReportId(null);
  };

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="animate-spin text-gray-400 mx-auto mb-4" size={48} />
          <p className="text-gray-600">Caricamento...</p>
        </div>
      </div>
    );
  }

  if (!session) return null;

  const isAdmin = session.user.ruolo === 'ADMIN';

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar user={session.user} />

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Archivio Report</h1>
          <p className="text-gray-600 mt-1">
            {loading ? (
              'Caricamento...'
            ) : (
              <>
                {pagination.totalCount} report totali
                {filtri.search || filtri.impiantoId || filtri.utenteId || filtri.tipo || filtri.stato || filtri.dataInizio || filtri.dataFine
                  ? ' (filtrati)'
                  : ''}
              </>
            )}
          </p>
        </div>

        <div className="mb-6">
          <ArchivioFiltri
            filtri={filtri}
            onChange={handleFiltriChange}
            isAdmin={isAdmin}
          />
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="text-center">
              <Loader2 className="animate-spin text-gray-400 mx-auto mb-4" size={40} />
              <p className="text-gray-600">Caricamento report...</p>
            </div>
          </div>
        ) : (
          <>
            <ArchivioLista
              report={report}
              isAdmin={isAdmin}
              onDelete={handleDelete}
              onView={handleView}
            />

            {pagination.totalPages > 1 && (
              <div className="mt-6">
                <Paginazione
                  currentPage={pagination.page}
                  totalPages={pagination.totalPages}
                  totalCount={pagination.totalCount}
                  onPageChange={handlePageChange}
                />
              </div>
            )}
          </>
        )}
      </main>

      {selectedReportId && (
        <ReportModal
          reportId={selectedReportId}
          onClose={handleCloseModal}
        />
      )}
    </div>
  );
}
