import React from 'react';
import { FileSearch, Construction } from 'lucide-react';

export const InvoicesView: React.FC = () => {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8 text-center max-w-2xl mx-auto my-8">
      <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
        <FileSearch className="w-8 h-8" />
      </div>
      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 text-amber-700 text-xs font-semibold mb-3">
        <Construction className="w-3.5 h-3.5" />
        <span>Fase 6 en preparación</span>
      </div>
      <h2 className="text-xl font-bold text-slate-900 mb-2">
        Consulta de Facturas (En construcción)
      </h2>
      <p className="text-sm text-slate-600 mb-6 max-w-lg mx-auto leading-relaxed">
        Este módulo permitirá buscar facturas emitidas por número de comprobante o cliente, consultar el detalle exhaustivo y previsualizar o descargar el comprobante en formato PDF generado por QuestPDF.
      </p>
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-left text-xs text-slate-600 space-y-2">
        <div className="font-semibold text-slate-800">Próximas funcionalidades:</div>
        <ul className="space-y-1.5 list-disc list-inside">
          <li>Listado paginado con búsqueda reactiva debounced.</li>
          <li>Modal de inspección con desglose de ítems, impuestos y fecha de emisión.</li>
          <li>Descarga e impresión de PDF oficial generado con QuestPDF.</li>
        </ul>
      </div>
    </div>
  );
};
