import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useGetApiV1SaleOrdersId } from '../../api/generated/posApi';
import type { SaleOrderResponseDto } from '../../api/generated/model';
import {
  X,
  User,
  UserCheck,
  Calendar,
  CreditCard,
  Building2,
  Mail,
  Phone,
  MapPin,
  Package,
  Receipt,
  Loader2,
  AlertCircle,
  FileText,
} from 'lucide-react';

export interface InvoiceDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  orderId: string | null;
  initialOrder?: SaleOrderResponseDto | null;
  onViewPdf: (orderId: string, orderNumber: string) => void;
}

export const InvoiceDetailModal: React.FC<InvoiceDetailModalProps> = ({
  isOpen,
  onClose,
  orderId,
  initialOrder,
  onViewPdf,
}) => {
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

  // Consumo directo de SWR generado por Orval (Cero useEffect para datos)
  const { data, isLoading, error } = useGetApiV1SaleOrdersId(orderId ?? '', {
    swr: {
      enabled: Boolean(isOpen && orderId),
      keepPreviousData: true,
    },
  });

  // Derivación directa de datos en render
  const order: SaleOrderResponseDto | undefined =
    data?.status === 200 ? data.data : initialOrder ?? undefined;

  // Fecha y hora formateada en español calculada en render
  let formattedDate = 'Fecha no disponible';
  if (order?.issueDate) {
    try {
      const dateObj = new Date(order.issueDate);
      formattedDate = new Intl.DateTimeFormat('es-EC', {
        dateStyle: 'medium',
        timeStyle: 'short',
      }).format(dateObj);
    } catch {
      formattedDate = order.issueDate;
    }
  }

  if (!isOpen) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[60] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-150"
      role="dialog"
      aria-modal="true"
      aria-labelledby="invoice-detail-title"
    >
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Cabecera del Modal */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-white shrink-0 relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center shadow-xs">
              <Receipt className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 id="invoice-detail-title" className="text-base font-bold text-slate-900">
                  Reconstrucción de Factura
                </h3>
                {order?.orderNumber && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold font-mono bg-blue-50 text-blue-700 border border-blue-200">
                    {order.orderNumber}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500">
                Detalle exhaustivo de la orden de venta registrada
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 hover:bg-slate-100 p-2 rounded-xl transition-colors cursor-pointer"
            title="Cerrar modal (Escape)"
            aria-label="Cerrar modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Contenido con Scroll */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 bg-white">
          {isLoading && !order && (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <Loader2 className="w-8 h-8 text-blue-600 animate-spin mb-3" />
              <p className="text-sm font-semibold text-slate-800">Cargando información de la factura...</p>
              <p className="text-xs text-slate-500 mt-0.5">Recuperando ítems y datos de la orden</p>
            </div>
          )}

          {error && !order && (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mb-3">
                <AlertCircle className="w-6 h-6" />
              </div>
              <p className="text-sm font-bold text-slate-900">No se pudo cargar la factura</p>
              <p className="text-xs text-slate-500 mt-1 max-w-sm">
                Hubo un inconveniente al cargar los detalles de la factura.
              </p>
            </div>
          )}

          {order && (
            <>
              {/* Tarjetas de Encabezado: Metadatos, Vendedor y Cliente */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Metadatos de la Emisión */}
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col justify-between">
                  <div>
                    <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 block mb-2">
                      Información del Comprobante
                    </span>
                    <div className="space-y-1.5 text-xs text-slate-700">
                      <div className="flex items-center gap-2">
                        <Receipt className="w-4 h-4 text-blue-600 shrink-0" />
                        <span className="font-mono font-bold text-slate-900">{order.orderNumber}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-slate-400 shrink-0" />
                        <span className="text-slate-600">{formattedDate}</span>
                      </div>
                    </div>
                  </div>
                  <div className="mt-3 pt-3 border-t border-slate-200/80">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      Estado: Emitida / Pagada
                    </span>
                  </div>
                </div>

                {/* Tarjeta de Vendedor / Cajero */}
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 block mb-2">
                    Cajero / Vendedor
                  </span>
                  <div className="space-y-1.5 text-xs text-slate-700">
                    <div className="flex items-center gap-2">
                      <UserCheck className="w-4 h-4 text-slate-500 shrink-0" />
                      <span className="font-semibold text-slate-900">
                        {order.sellerName || 'Cajero del Sistema'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-500">
                      <Building2 className="w-4 h-4 text-slate-400 shrink-0" />
                      <span>Punto de Venta Matriz (POS)</span>
                    </div>
                  </div>
                </div>

                {/* Tarjeta de Cliente */}
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 block mb-2">
                    Datos del Cliente Receptor
                  </span>
                  <div className="space-y-1.5 text-xs text-slate-700">
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-slate-500 shrink-0" />
                      <span className="font-bold text-slate-900">{order.customerName}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CreditCard className="w-4 h-4 text-slate-400 shrink-0" />
                      <span className="font-mono text-slate-600">
                        {order.customerIdentification}
                      </span>
                    </div>
                    {order.customerEmail && (
                      <div className="flex items-center gap-2 text-slate-600 truncate">
                        <Mail className="w-4 h-4 text-slate-400 shrink-0" />
                        <span className="truncate">{order.customerEmail}</span>
                      </div>
                    )}
                    {order.customerPhoneNumber && (
                      <div className="flex items-center gap-2 text-slate-600">
                        <Phone className="w-4 h-4 text-slate-400 shrink-0" />
                        <span>{order.customerPhoneNumber}</span>
                      </div>
                    )}
                    {order.customerAddress && (
                      <div className="flex items-start gap-2 text-slate-600">
                        <MapPin className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                        <span className="line-clamp-2">{order.customerAddress}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Detalle de la Orden: Tabla Reconstruida */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                    <Package className="w-4 h-4 text-blue-600" />
                    <span>Ítems y Productos Facturados ({order.details?.length ?? 0})</span>
                  </h4>
                </div>

                <div className="overflow-x-auto rounded-xl border border-slate-200">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                      <tr>
                        <th className="py-2.5 px-3 text-center w-10">#</th>
                        <th className="py-2.5 px-3">Código</th>
                        <th className="py-2.5 px-3">Descripción / Producto</th>
                        <th className="py-2.5 px-3 text-right">Cantidad</th>
                        <th className="py-2.5 px-3 text-right">P. Unitario</th>
                        <th className="py-2.5 px-3 text-right">IVA %</th>
                        <th className="py-2.5 px-3 text-right">Subtotal</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white">
                      {order.details?.map((detail, idx) => {
                        const qty = Number(detail.quantity);
                        const unitPrice = Number(detail.unitPrice);
                        const taxRate = Number(detail.taxRate);
                        const subtotal = Number(detail.subtotal);

                        return (
                          <tr key={detail.id || idx} className="hover:bg-slate-50/70 transition-colors">
                            <td className="py-2.5 px-3 text-center text-slate-400 font-medium">
                              {idx + 1}
                            </td>
                            <td className="py-2.5 px-3 font-mono font-medium text-slate-700">
                              {detail.productCode || '—'}
                            </td>
                            <td className="py-2.5 px-3 font-medium text-slate-900">
                              {detail.productName}
                            </td>
                            <td className="py-2.5 px-3 text-right font-mono font-semibold text-slate-800">
                              {qty}
                            </td>
                            <td className="py-2.5 px-3 text-right font-mono text-slate-600">
                              ${unitPrice.toFixed(2)}
                            </td>
                            <td className="py-2.5 px-3 text-right font-mono text-slate-600">
                              {taxRate}%
                            </td>
                            <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900">
                              ${subtotal.toFixed(2)}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Resumen Financiero de la Factura */}
              <div className="flex justify-end pt-2">
                <div className="w-full sm:w-80 bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2">
                  <div className="flex justify-between items-center text-xs text-slate-600">
                    <span>Subtotal General:</span>
                    <span className="font-mono font-medium text-slate-900">
                      ${Number(order.subtotal).toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-xs text-slate-600">
                    <span>Desglose IVA (15%):</span>
                    <span className="font-mono font-medium text-slate-900">
                      ${Number(order.taxAmount).toFixed(2)}
                    </span>
                  </div>
                  <div className="pt-2 border-t border-slate-200 flex justify-between items-center">
                    <span className="text-sm font-bold text-slate-900">Total a Pagar (USD):</span>
                    <span className="text-base font-bold font-mono text-blue-700">
                      ${Number(order.totalAmount).toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Pie del Modal / Acciones */}
        <div className="px-6 py-4 border-t border-slate-200 bg-slate-50/80 shrink-0 relative z-10 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs sm:text-sm font-medium text-slate-700 bg-white hover:bg-slate-100 border border-slate-300 rounded-xl transition-colors cursor-pointer"
          >
            Cerrar
          </button>

          {order && (
            <button
              type="button"
              onClick={() => onViewPdf(order.id, order.orderNumber)}
              className="inline-flex items-center gap-2 px-4 py-2 text-xs sm:text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 rounded-xl transition-colors cursor-pointer shadow-sm"
            >
              <FileText className="w-4 h-4" />
              <span>Ver / Imprimir PDF</span>
            </button>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
};
