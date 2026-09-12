import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useGetApiV1Customers } from '../../api/generated/posApi';
import type { CustomerResponseDto } from '../../api/generated/model';
import { useDebounce } from '../../hooks/useDebounce';
import { Search, X, Users, Loader2, ChevronLeft, ChevronRight, Check } from 'lucide-react';

export interface CustomerSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectCustomer: (customer: CustomerResponseDto) => void;
}

export const CustomerSearchModal: React.FC<CustomerSearchModalProps> = ({
  isOpen,
  onClose,
  onSelectCustomer,
}) => {
  const [searchTerm, setSearchTerm] = useState<string>('');
  const debouncedTerm = useDebounce(searchTerm, 300);
  const [page, setPage] = useState<number>(1);

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

  // Consumo exclusivo de SWR generado por Orval
  const { data, isLoading, error } = useGetApiV1Customers(
    {
      search: debouncedTerm.trim() || undefined,
      page,
      pageSize: 5,
    },
    {
      swr: {
        enabled: isOpen,
        keepPreviousData: true,
      },
    }
  );

  // Derivación directa de datos en render (Cero useEffect para datos)
  const pagedResult = data?.status === 200 ? data.data : undefined;
  const customers: CustomerResponseDto[] = pagedResult?.items ?? [];
  const totalCount = Number(pagedResult?.totalCount ?? 0);
  const totalPages = Math.max(1, Number(pagedResult?.totalPages ?? 1));
  const currentPage = Number(pagedResult?.pageNumber ?? page);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setPage(1);
  };

  const handleSelect = (customer: CustomerResponseDto) => {
    onSelectCustomer(customer);
    onClose();
  };

  if (!isOpen) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[60] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-150"
      role="dialog"
      aria-modal="true"
      aria-labelledby="customer-modal-title"
    >
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-3xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Cabecera del Modal */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center shadow-xs">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h3 id="customer-modal-title" className="text-base font-bold text-slate-900">
                Búsqueda Inteligente de Clientes
              </h3>
              <p className="text-xs text-slate-500">
                Localice al comprador por Cédula / RUC o Nombres completos
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

        {/* Barra de Búsqueda Reactiva */}
        <div className="p-6 border-b border-slate-100 bg-white">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <Search className="w-5 h-5" />
            </div>
            <input
              type="text"
              value={searchTerm}
              onChange={handleSearchChange}
              placeholder="Buscar por cédula, RUC o nombre del cliente..."
              className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              autoFocus
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => {
                  setSearchTerm('');
                  setPage(1);
                }}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                title="Limpiar búsqueda"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Contenido / Tabla de Resultados */}
        <div className="flex-1 overflow-y-auto p-6">
          {isLoading && !pagedResult ? (
            <div className="py-12 flex flex-col items-center justify-center text-slate-500">
              <Loader2 className="w-8 h-8 text-blue-600 animate-spin mb-3" />
              <p className="text-sm font-medium">Buscando clientes activos...</p>
            </div>
          ) : error ? (
            <div className="py-8 text-center">
              <p className="text-sm font-semibold text-rose-600">Error al cargar clientes</p>
              <p className="text-xs text-slate-500 mt-1">
                No fue posible conectar con el servicio. Por favor, intente de nuevo.
              </p>
            </div>
          ) : customers.length === 0 ? (
            <div className="py-12 text-center text-slate-500">
              <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3 text-slate-400">
                <Users className="w-6 h-6" />
              </div>
              <p className="text-sm font-semibold text-slate-700">No se encontraron clientes activos</p>
              <p className="text-xs text-slate-500 mt-1">
                Intente con otro término de búsqueda o verifique que el cliente esté registrado en el sistema.
              </p>
            </div>
          ) : (
            <div className="border border-slate-200 rounded-xl overflow-hidden shadow-xs">
              <table className="min-w-full divide-y divide-slate-200 text-left text-xs">
                <thead className="bg-slate-50 font-semibold text-slate-700">
                  <tr>
                    <th scope="col" className="px-4 py-3">Cédula / RUC</th>
                    <th scope="col" className="px-4 py-3">Nombre Completo</th>
                    <th scope="col" className="px-4 py-3">Teléfono</th>
                    <th scope="col" className="px-4 py-3">Correo Electrónico</th>
                    <th scope="col" className="px-4 py-3 text-right">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {customers.map((customer) => (
                    <tr
                      key={customer.id}
                      className="hover:bg-blue-50/50 transition-colors"
                    >
                      <td className="px-4 py-3 font-mono font-medium text-slate-900 whitespace-nowrap">
                        {customer.identificationNumber}
                      </td>
                      <td className="px-4 py-3 font-medium text-slate-800">
                        {customer.fullName}
                      </td>
                      <td className="px-4 py-3 text-slate-600 whitespace-nowrap">
                        {customer.phoneNumber || '—'}
                      </td>
                      <td className="px-4 py-3 text-slate-600 max-w-[180px] truncate" title={customer.email}>
                        {customer.email || '—'}
                      </td>
                      <td className="px-4 py-3 text-right whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => handleSelect(customer)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors cursor-pointer"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>Seleccionar</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Paginación por Bloques */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-600">
          <div className="font-medium">
            Total: <span className="font-semibold text-slate-800">{totalCount}</span> clientes registrados
          </div>

          <div className="flex items-center gap-3">
            <span className="text-slate-500">
              Página <span className="font-semibold text-slate-800">{currentPage}</span> de{' '}
              <span className="font-semibold text-slate-800">{totalPages}</span>
            </span>

            <div className="inline-flex rounded-lg shadow-xs space-x-1">
              <button
                type="button"
                onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
                disabled={currentPage <= 1 || isLoading}
                className="px-2.5 py-1.5 bg-white border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50 transition-colors cursor-pointer flex items-center gap-1"
                title="Página anterior"
              >
                <ChevronLeft className="w-4 h-4" />
                <span className="hidden sm:inline">Anterior</span>
              </button>

              <button
                type="button"
                onClick={() => setPage((prev) => Math.min(prev + 1, totalPages))}
                disabled={currentPage >= totalPages || isLoading || customers.length === 0}
                className="px-2.5 py-1.5 bg-white border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50 transition-colors cursor-pointer flex items-center gap-1"
                title="Página siguiente"
              >
                <span className="hidden sm:inline">Siguiente</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};
