import React, { useState, useMemo } from 'react';
import { useGetApiV1SaleOrders, getApiV1SaleOrdersIdPdf } from '../api/generated/posApi';
import type { SaleOrderResponseDto } from '../api/generated/model';
import { useDebounce } from '../hooks/useDebounce';
import { useToast } from '../context/ToastContext';
import { InvoiceDetailModal } from '../components/invoices/InvoiceDetailModal';
import { InvoicePdfModal } from '../components/invoices/InvoicePdfModal';
import {
  FileText,
  Search,
  X,
  Eye,
  Download,
  Loader2,
  Calendar,
  User,
  CreditCard,
  UserCheck,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  FileSpreadsheet,
} from 'lucide-react';

export const InvoicesView: React.FC = () => {
  const toast = useToast();

  // Estados locales de búsqueda y paginación
  const [searchTerm, setSearchTerm] = useState<string>('');
  const debouncedTerm = useDebounce(searchTerm, 300);
  const [page, setPage] = useState<number>(1);
  const pageSize = 8;

  // Estado para descarga directa de fila
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  // Estados de modales
  const [selectedOrderForDetail, setSelectedOrderForDetail] = useState<SaleOrderResponseDto | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState<boolean>(false);

  const [pdfTarget, setPdfTarget] = useState<{ id: string; orderNumber: string } | null>(null);
  const [isPdfModalOpen, setIsPdfModalOpen] = useState<boolean>(false);

  // Consumo directo de SWR generado por Orval (Cero useEffect para datos)
  const { data, isLoading, isValidating, mutate } = useGetApiV1SaleOrders(
    {
      search: debouncedTerm.trim() || undefined,
      page,
      pageSize,
    },
    {
      swr: {
        keepPreviousData: true,
      },
    }
  );

  // Derivación directa de datos en render
  const pagedResult = data?.status === 200 ? data.data : undefined;
  const orders: SaleOrderResponseDto[] = useMemo(() => pagedResult?.items ?? [], [pagedResult?.items]);
  const totalCount = Number(pagedResult?.totalCount ?? 0);
  const totalPages = Math.max(1, Number(pagedResult?.totalPages ?? 1));
  const currentPage = Number(pagedResult?.pageNumber ?? page);

  // Manejo de cambio en la barra de búsqueda
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setPage(1);
  };

  const handleClearSearch = () => {
    setSearchTerm('');
    setPage(1);
  };

  // Apertura del modal de detalle
  const handleOpenDetail = (order: SaleOrderResponseDto) => {
    setSelectedOrderForDetail(order);
    setIsDetailModalOpen(true);
  };

  const handleCloseDetail = () => {
    setIsDetailModalOpen(false);
    setSelectedOrderForDetail(null);
  };

  // Apertura del visor de PDF
  const handleOpenPdfModal = (orderId: string, orderNumber: string) => {
    setPdfTarget({ id: orderId, orderNumber });
    setIsPdfModalOpen(true);
  };

  const handleClosePdfModal = () => {
    setIsPdfModalOpen(false);
    setPdfTarget(null);
  };

  // Descarga directa del archivo PDF desde la fila de la tabla
  const handleDirectDownload = async (e: React.MouseEvent, order: SaleOrderResponseDto) => {
    e.stopPropagation();
    if (downloadingId) return;

    try {
      setDownloadingId(order.id);
      toast.info(`Generando comprobante de venta para ${order.orderNumber}...`, 'Descargando PDF');

      const response = await getApiV1SaleOrdersIdPdf(order.id);

      if (response.status === 200 && response.data instanceof Blob) {
        const url = URL.createObjectURL(response.data);
        const link = document.createElement('a');
        link.href = url;
        link.download = `Factura-${order.orderNumber}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

        toast.success(`Factura ${order.orderNumber} descargada con éxito.`, 'Descarga completada');
      } else {
        toast.error('No se pudo obtener el archivo PDF de la factura.', 'Error en descarga');
      }
    } catch (err: unknown) {
      const detail =
        (err && typeof err === 'object' && 'detail' in err && typeof err.detail === 'string'
          ? err.detail
          : null) || 'Ocurrió un error al descargar el comprobante.';
      toast.error(detail, 'Error al descargar');
    } finally {
      setDownloadingId(null);
    }
  };

  // Formato de fecha y hora en español
  const formatDateTime = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return new Intl.DateTimeFormat('es-EC', {
        dateStyle: 'short',
        timeStyle: 'short',
      }).format(date);
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6 animate-in fade-in duration-200">
      {/* Encabezado Principal */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 sm:p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 shadow-xs">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-slate-900 leading-tight">
                Historial de Facturas Emitidas
              </h2>
              <span className="hidden sm:inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                Vista 4 — POS
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              Consulte facturas registradas, inspeccione su detalle y visualice o descargue el comprobante oficial en PDF
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end md:self-auto">
          <button
            type="button"
            onClick={() => mutate()}
            disabled={isValidating}
            className="inline-flex items-center gap-2 px-3 py-2 text-xs font-medium text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-300 rounded-xl transition-colors cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
            title="Recargar listado"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isValidating ? 'animate-spin text-blue-600' : ''}`} />
            <span className="hidden sm:inline">Actualizar</span>
          </button>
        </div>
      </div>

      {/* Barra de Búsqueda Inteligente (Requisito 12) */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-4">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
            <Search className="w-5 h-5" />
          </div>
          <input
            type="text"
            value={searchTerm}
            onChange={handleSearchChange}
            placeholder="Buscar por N° Factura (FAC-...), Cédula / RUC o Nombre del Cliente..."
            className="w-full pl-10 pr-10 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all placeholder:text-slate-400 text-slate-900"
          />
          {searchTerm && (
            <button
              type="button"
              onClick={handleClearSearch}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
              title="Limpiar búsqueda"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Tabla de Facturas */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden flex flex-col">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200 text-xs">
              <tr>
                <th className="py-3.5 px-4">N° Factura</th>
                <th className="py-3.5 px-4">Fecha y Hora</th>
                <th className="py-3.5 px-4">Cliente</th>
                <th className="py-3.5 px-4">Vendedor</th>
                <th className="py-3.5 px-4 text-right">Total</th>
                <th className="py-3.5 px-4 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs sm:text-sm">
              {isLoading && orders.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-14 text-center">
                    <div className="flex flex-col items-center justify-center gap-3">
                      <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
                      <p className="text-sm font-medium text-slate-600">
                        Cargando facturas emitidas...
                      </p>
                    </div>
                  </td>
                </tr>
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-16 text-center">
                    <div className="flex flex-col items-center justify-center max-w-sm mx-auto">
                      <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mb-3">
                        <FileSpreadsheet className="w-6 h-6" />
                      </div>
                      <p className="text-sm font-bold text-slate-800">
                        No se encontraron facturas emitidas coincidentes
                      </p>
                      <p className="text-xs text-slate-500 mt-1">
                        {debouncedTerm
                          ? 'Intente modificar el término de búsqueda por número de factura o datos del cliente.'
                          : 'Aún no se han registrado órdenes de venta en el sistema.'}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                orders.map((order) => {
                  const isRowDownloading = downloadingId === order.id;

                  return (
                    <tr
                      key={order.id}
                      onClick={() => handleOpenDetail(order)}
                      className="hover:bg-blue-50/40 transition-colors cursor-pointer group"
                    >
                      {/* N° Factura */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold font-mono bg-blue-50 text-blue-700 border border-blue-200 group-hover:bg-blue-100/70 transition-colors">
                          {order.orderNumber}
                        </span>
                      </td>

                      {/* Fecha y Hora */}
                      <td className="py-3 px-4 whitespace-nowrap text-slate-600">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="text-xs font-medium">
                            {formatDateTime(order.issueDate)}
                          </span>
                        </div>
                      </td>

                      {/* Cliente */}
                      <td className="py-3 px-4">
                        <div className="flex flex-col min-w-[180px]">
                          <div className="flex items-center gap-1.5 font-semibold text-slate-900 text-xs sm:text-sm">
                            <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span className="truncate">{order.customerName}</span>
                          </div>
                          <div className="flex items-center gap-1 text-slate-500 font-mono text-[11px] mt-0.5">
                            <CreditCard className="w-3 h-3 text-slate-400 shrink-0" />
                            <span>{order.customerIdentification}</span>
                          </div>
                        </div>
                      </td>

                      {/* Vendedor */}
                      <td className="py-3 px-4 whitespace-nowrap text-slate-700">
                        <div className="flex items-center gap-1.5 text-xs">
                          <UserCheck className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="truncate max-w-[140px] font-medium">
                            {order.sellerName || 'Cajero del Sistema'}
                          </span>
                        </div>
                      </td>

                      {/* Total */}
                      <td className="py-3 px-4 whitespace-nowrap text-right">
                        <span className="font-mono font-bold text-slate-900 text-sm">
                          ${Number(order.totalAmount).toFixed(2)}
                        </span>
                      </td>

                      {/* Acciones */}
                      <td className="py-3 px-4 whitespace-nowrap text-center">
                        <div className="inline-flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                          <button
                            type="button"
                            onClick={() => handleOpenDetail(order)}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-slate-700 bg-white hover:bg-slate-100 active:bg-slate-200 border border-slate-300 rounded-lg transition-colors cursor-pointer shadow-2xs"
                            title="Inspeccionar detalle de la factura"
                          >
                            <Eye className="w-3.5 h-3.5 text-blue-600" />
                            <span>Ver Detalle</span>
                          </button>

                          <button
                            type="button"
                            onClick={(e) => handleDirectDownload(e, order)}
                            disabled={isRowDownloading}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 active:bg-blue-200 border border-blue-200 rounded-lg transition-colors cursor-pointer shadow-2xs disabled:cursor-not-allowed disabled:opacity-50"
                            title="Descargar comprobante PDF oficial"
                          >
                            {isRowDownloading ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-600" />
                            ) : (
                              <Download className="w-3.5 h-3.5 text-blue-600" />
                            )}
                            <span className="hidden sm:inline">PDF</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Barra de Paginación por Bloques (Requisito 15) */}
        <div className="px-6 py-4 border-t border-slate-200 bg-slate-50/70 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-600">
          <div>
            Mostrando{' '}
            <span className="font-semibold text-slate-800">
              {totalCount === 0 ? 0 : (currentPage - 1) * pageSize + 1}
            </span>{' '}
            a{' '}
            <span className="font-semibold text-slate-800">
              {Math.min(currentPage * pageSize, totalCount)}
            </span>{' '}
            de <span className="font-semibold text-slate-800">{totalCount}</span> facturas emitidas
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={currentPage <= 1 || isLoading}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-300 bg-white text-slate-700 font-medium hover:bg-slate-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer shadow-2xs"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Anterior</span>
            </button>

            <span className="px-3 py-1.5 font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg">
              Página {currentPage} de {totalPages}
            </span>

            <button
              type="button"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage >= totalPages || isLoading}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-300 bg-white text-slate-700 font-medium hover:bg-slate-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer shadow-2xs"
            >
              <span>Siguiente</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Modal de Detalle Exhaustivo de Factura */}
      <InvoiceDetailModal
        isOpen={isDetailModalOpen}
        onClose={handleCloseDetail}
        orderId={selectedOrderForDetail?.id ?? null}
        initialOrder={selectedOrderForDetail}
        onViewPdf={(id, orderNum) => {
          handleOpenPdfModal(id, orderNum);
        }}
      />

      {/* Modal de Visor Embebido y Descarga de PDF */}
      <InvoicePdfModal
        isOpen={isPdfModalOpen}
        onClose={handleClosePdfModal}
        orderId={pdfTarget?.id ?? null}
        orderNumber={pdfTarget?.orderNumber ?? null}
      />
    </div>
  );
};
