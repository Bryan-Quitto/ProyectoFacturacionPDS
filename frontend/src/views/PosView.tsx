import React from 'react';
import { ShoppingBag, Construction } from 'lucide-react';

export const PosView: React.FC = () => {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8 text-center max-w-2xl mx-auto my-8">
      <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
        <ShoppingBag className="w-8 h-8" />
      </div>
      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 text-amber-700 text-xs font-semibold mb-3">
        <Construction className="w-3.5 h-3.5" />
        <span>Fase 5 en preparación</span>
      </div>
      <h2 className="text-xl font-bold text-slate-900 mb-2">
        Módulo Punto de Venta (En construcción)
      </h2>
      <p className="text-sm text-slate-600 mb-6 max-w-lg mx-auto leading-relaxed">
        Este módulo integrará la búsqueda inteligente de clientes, catálogo de productos con control de stock concurrente, cálculo de impuestos ecuatorianos y emisión transaccional de órdenes de venta.
      </p>
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-left text-xs text-slate-600 space-y-2">
        <div className="font-semibold text-slate-800">Próximas funcionalidades:</div>
        <ul className="space-y-1.5 list-disc list-inside">
          <li>Encabezado de cliente con modal de búsqueda y validación de cédula/RUC.</li>
          <li>Tabla dinámica de ítems con validación de stock (`StockQuantity &gt; 0`).</li>
          <li>Resumen de subtotales, IVA 15% / 0% y total facturado.</li>
          <li>Transacciones ACID con manejo de concurrencia optimista (`xmin`).</li>
        </ul>
      </div>
    </div>
  );
};
