import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useGetApiV1SaleOrdersIdPdf } from '../../api/generated/posApi';
import { X, Download, FileText, Loader2, AlertCircle, Printer } from 'lucide-react';

export interface InvoicePdfModalProps {
  isOpen: boolean;
  onClose: () => void;
  orderId: string | null;
  orderNumber: string | null;
}

export const InvoicePdfModal: React.FC<InvoicePdfModalProps> = ({
  isOpen,
  onClose,
  orderId,
  orderNumber,
}) => {
  const [blobUrl, setBlobUrl] = useState<string | null>(null);

  // Cierre con la tecla Escape
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Consumo mediante SWR del stream PDF
  const { data, isLoading, error } = useGetApiV1SaleOrdersIdPdf(orderId ?? '', {
    swr: {
      enabled: Boolean(isOpen && orderId),
      keepPreviousData: false,
    },
  });

  const pdfBlob = data?.status === 200 && data.data instanceof Blob ? data.data : null;

  // Sincronización del Blob a Object URL para el iframe con limpieza de memoria
  useEffect(() => {
    if (!pdfBlob) return;
    const url = URL.createObjectURL(pdfBlob);
    // Establecer asíncronamente para evitar cascading renders síncronos según reglas de React 19
    const frameId = requestAnimationFrame(() => {
      setBlobUrl(url);
    });

    return () => {
      cancelAnimationFrame(frameId);
      URL.revokeObjectURL(url);
      setBlobUrl(null);
    };
  }, [pdfBlob]);

  if (!isOpen) return null;

  const fileName = `Factura-${orderNumber || 'comprobante'}.pdf`;
  const errorMessage = error ? 'Ocurrió un error al generar el comprobante PDF.' : null;

  return createPortal(
    <div
      className="fixed inset-0 z-[60] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-150"
      role="dialog"
      aria-modal="true"
      aria-labelledby="pdf-modal-title"
    >
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl overflow-hidden flex flex-col h-[90vh] max-h-[850px]">
        {/* Cabecera del Modal */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-white shrink-0 relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center shadow-xs">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 id="pdf-modal-title" className="text-base font-bold text-slate-900">
                  Comprobante de Venta
                </h3>
                {orderNumber && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold font-mono bg-blue-50 text-blue-700 border border-blue-200">
                    {orderNumber}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500">
                Visualice, imprima o descargue el comprobante de venta en formato PDF
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 hover:bg-slate-100 p-2 rounded-xl transition-colors cursor-pointer"
            title="Cerrar visor (Escape)"
            aria-label="Cerrar visor"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Cuerpo del Visor */}
        <div className="p-4 sm:p-6 flex-1 min-h-0 flex flex-col overflow-hidden bg-slate-100/60">
          {isLoading && (
            <div className="flex-1 flex flex-col items-center justify-center py-16 text-center">
              <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mb-4 shadow-sm">
                <Loader2 className="w-8 h-8 animate-spin" />
              </div>
              <p className="text-sm font-semibold text-slate-800">
                Generando documento PDF con QuestPDF...
              </p>
              <p className="text-xs text-slate-500 mt-1">
                Por favor espere mientras preparamos el comprobante de venta.
              </p>
            </div>
          )}

          {!isLoading && errorMessage && (
            <div className="flex-1 flex flex-col items-center justify-center py-16 text-center max-w-md mx-auto">
              <div className="w-14 h-14 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mb-4 shadow-sm">
                <AlertCircle className="w-8 h-8" />
              </div>
              <h4 className="text-sm font-bold text-slate-900 mb-1">
                Error al cargar el documento PDF
              </h4>
              <p className="text-xs text-slate-600 leading-relaxed mb-4">
                {errorMessage}
              </p>
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 font-medium rounded-xl text-xs transition-colors cursor-pointer"
              >
                Cerrar ventana
              </button>
            </div>
          )}

          {!isLoading && !errorMessage && blobUrl && (
            <div className="w-full h-full flex-1 min-h-0 rounded-xl overflow-hidden border border-slate-300 bg-white shadow-inner">
              <iframe
                src={blobUrl}
                className="w-full h-full border-0 block"
                title={`Comprobante de Venta ${orderNumber || ''}`}
              />
            </div>
          )}
        </div>

        {/* Pie del Modal / Acciones */}
        <div className="px-6 py-4 border-t border-slate-200 bg-white shrink-0 relative z-10 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs text-slate-500 text-center sm:text-left">
            <Printer className="w-4 h-4 text-slate-400 shrink-0" />
            <span>
              Use los controles nativos del visor para realizar zoom o imprimir directamente.
            </span>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs sm:text-sm font-medium text-slate-700 bg-white hover:bg-slate-100 border border-slate-300 rounded-xl transition-colors cursor-pointer"
            >
              Cerrar
            </button>

            {blobUrl && (
              <a
                href={blobUrl}
                download={fileName}
                className="inline-flex items-center justify-center gap-2 px-4 py-2 text-xs sm:text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 rounded-xl transition-colors cursor-pointer shadow-sm"
              >
                <Download className="w-4 h-4" />
                <span>Descargar Factura</span>
              </a>
            )}
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};
