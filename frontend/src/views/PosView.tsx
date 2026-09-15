import React, { useState, useMemo } from 'react';
import { useForm, useFieldArray, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useSWRConfig } from 'swr';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { CustomerSearchModal } from '../components/pos/CustomerSearchModal';
import { ProductSearchModal } from '../components/pos/ProductSearchModal';
import { ConfirmModal } from '../components/common/ConfirmModal';
import { postApiV1SaleOrders } from '../api/generated/posApi';
import type { CustomerResponseDto, ProductResponseDto, CreateSaleOrderDto } from '../api/generated/model';
import {
  ShoppingCart,
  User,
  Search,
  UserX,
  Plus,
  Trash2,
  RefreshCw,
  Receipt,
  RotateCcw,
  Calendar,
  AlertTriangle,
  CreditCard,
  Building2,
  Phone,
  Mail,
  MapPin,
  CheckCircle2,
  Package,
} from 'lucide-react';

// Esquema Zod de validación estricta de la orden
const posOrderItemSchema = z.object({
  productId: z.string().uuid('Identificador de producto inválido'),
  code: z.string(),
  name: z.string(),
  unitPrice: z.number().positive(),
  stockQuantity: z.number().int().min(1),
  taxRate: z.number().min(0),
  quantity: z
    .number()
    .int('La cantidad debe ser un número entero')
    .min(1, 'La cantidad mínima es 1'),
});

const posFormSchema = z.object({
  customerId: z.string().min(1, 'Debe seleccionar un cliente activo'),
  items: z.array(posOrderItemSchema).min(1, 'Debe agregar al menos un producto a la orden'),
});

type PosFormData = z.infer<typeof posFormSchema>;

export const PosView: React.FC = () => {
  const { user } = useAuth();
  const toast = useToast();
  const { mutate } = useSWRConfig();

  // Estados locales de interfaz para modales y cliente
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerResponseDto | null>(null);
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState<boolean>(false);
  const [isProductModalOpen, setIsProductModalOpen] = useState<boolean>(false);
  const [isCancelModalOpen, setIsCancelModalOpen] = useState<boolean>(false);
  const [productModalMode, setProductModalMode] = useState<'add' | 'replace'>('add');
  const [replacingIndex, setReplacingIndex] = useState<number | null>(null);

  // Formulario react-hook-form con Zod
  const {
    control,
    handleSubmit,
    setValue,
    reset,
    formState: { isSubmitting },
  } = useForm<PosFormData>({
    resolver: zodResolver(posFormSchema),
    defaultValues: {
      customerId: '',
      items: [],
    },
  });

  const { append, remove, update } = useFieldArray({
    control,
    name: 'items',
  });

  // Observador reactivo de items
  const rawWatchedItems = useWatch({ control, name: 'items' });
  const watchedItems = useMemo(() => rawWatchedItems ?? [], [rawWatchedItems]);

  // Fecha actual formateada en español
  const issueDateFormatted = useMemo(() => {
    const formatted = new Intl.DateTimeFormat('es-EC', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(new Date());
    return formatted.charAt(0).toUpperCase() + formatted.slice(1);
  }, []);

  // CÁLCULOS FINANCIEROS EN CICLO DE RENDER (Cero useEffect para datos)
  const { subtotal, taxAmount, totalAmount } = useMemo(() => {
    let sub = 0;
    let tax = 0;
    for (const item of watchedItems) {
      const lineSubtotal = (item.quantity || 0) * (item.unitPrice || 0);
      const lineTax = lineSubtotal * ((item.taxRate || 0) / 100);
      sub += lineSubtotal;
      tax += lineTax;
    }
    return {
      subtotal: sub,
      taxAmount: tax,
      totalAmount: sub + tax,
    };
  }, [watchedItems]);

  // Lista de IDs de productos en la orden actual para evitar duplicados (Requisito 3)
  const currentProductIds = useMemo(() => {
    return watchedItems.map((it) => it.productId);
  }, [watchedItems]);

  // ID del producto actualmente en reemplazo
  const replacingProductId = useMemo(() => {
    if (replacingIndex !== null && replacingIndex >= 0 && replacingIndex < watchedItems.length) {
      return watchedItems[replacingIndex]?.productId;
    }
    return undefined;
  }, [replacingIndex, watchedItems]);

  // MANEJO DE CLIENTE
  const handleSelectCustomer = (customer: CustomerResponseDto) => {
    setSelectedCustomer(customer);
    setValue('customerId', customer.id, { shouldValidate: true });
    toast.info(`Cliente "${customer.fullName}" seleccionado.`, 'Cliente asignado');
  };

  const handleClearCustomer = () => {
    setSelectedCustomer(null);
    setValue('customerId', '', { shouldValidate: true });
    toast.info('Se removió el cliente de la orden actual.', 'Cliente desvinculado');
  };

  // MANEJO DE PRODUCTOS
  const handleOpenAddProduct = () => {
    setProductModalMode('add');
    setReplacingIndex(null);
    setIsProductModalOpen(true);
  };

  const handleOpenReplaceProduct = (index: number) => {
    setProductModalMode('replace');
    setReplacingIndex(index);
    setIsProductModalOpen(true);
  };

  const handleSelectProduct = (product: ProductResponseDto) => {
    const stock = Number(product.stockQuantity);
    const unitPrice = Number(product.unitPrice);
    const taxRate = Number(product.taxRate);

    if (
      productModalMode === 'replace' &&
      replacingIndex !== null &&
      replacingIndex >= 0 &&
      replacingIndex < watchedItems.length
    ) {
      // Requisito 11: Sustitución manteniendo la fila y ajustando cantidad si excede nuevo stock
      const previousItem = watchedItems[replacingIndex];
      const adjustedQuantity = Math.min(previousItem.quantity, stock);

      update(replacingIndex, {
        productId: product.id,
        code: product.code,
        name: product.name,
        unitPrice,
        stockQuantity: stock,
        taxRate,
        quantity: Math.max(1, adjustedQuantity),
      });

      if (previousItem.quantity > stock) {
        toast.warning(
          `El producto sustituto cuenta con un stock de ${stock}. La cantidad se ajustó automáticamente.`,
          'Cantidad ajustada'
        );
      } else {
        toast.info(
          `Se reemplazó "${previousItem.name}" por "${product.name}".`,
          'Producto sustituido'
        );
      }
    } else {
      // Modo Agregar: añade con cantidad inicial 1
      append({
        productId: product.id,
        code: product.code,
        name: product.name,
        unitPrice,
        stockQuantity: stock,
        taxRate,
        quantity: 1,
      });
      toast.success(`"${product.name}" agregado a la orden de venta.`, 'Producto añadido');
    }
  };

  // Requisitos 6 y 9: Validación en tiempo real de Cantidad y Stock
  const handleQuantityChange = (index: number, rawValue: string) => {
    const item = watchedItems[index];
    if (!item) return;

    const parsed = parseInt(rawValue, 10);
    if (isNaN(parsed) || parsed < 1) {
      update(index, { ...item, quantity: 1 });
      toast.warning('La cantidad mínima permitida es 1.', 'Cantidad corregida');
      return;
    }

    if (parsed > item.stockQuantity) {
      update(index, { ...item, quantity: item.stockQuantity });
      toast.warning(
        `La cantidad solicitada supera el stock disponible (${item.stockQuantity}). Se ha ajustado al máximo permitido.`,
        'Stock límite alcanzado'
      );
      return;
    }

    update(index, { ...item, quantity: parsed });
  };

  // Requisito 10: Eliminación de ítems
  const handleRemoveItem = (index: number) => {
    const item = watchedItems[index];
    remove(index);
    if (item) {
      toast.info(`"${item.name}" eliminado de la orden.`, 'Ítem removido');
    }
  };

  // Cancelar Orden
  const handleCancelOrder = () => {
    if (watchedItems.length > 0 || selectedCustomer) {
      setIsCancelModalOpen(true);
      return;
    }
    toast.info('No hay productos ni cliente en la orden para cancelar.', 'Orden vacía');
  };

  const handleConfirmCancelOrder = () => {
    reset({ customerId: '', items: [] });
    setSelectedCustomer(null);
    toast.info('Se canceló la orden y se restableció el formulario.', 'Orden reiniciada');
  };

  // EMISIÓN TRANSACCIONAL DE LA FACTURA (Requisitos 7, 14 y 17)
  const onSubmit = async (values: PosFormData) => {
    if (!selectedCustomer) {
      toast.error('Debe seleccionar un cliente antes de emitir la factura.', 'Cliente requerido');
      return;
    }

    if (values.items.length === 0) {
      toast.error('Debe agregar al menos un producto a la orden de venta.', 'Orden vacía');
      return;
    }

    try {
      const payload: CreateSaleOrderDto = {
        customerId: values.customerId,
        items: values.items.map((it) => ({
          productId: it.productId,
          quantity: it.quantity,
        })),
      };

      const response = await postApiV1SaleOrders(payload);
      if (response.status !== 201) {
        throw response.data;
      }
      const saleOrder = response.data;

      toast.success(
        `¡Factura ${saleOrder.orderNumber} emitida correctamente por un total de $${Number(
          saleOrder.totalAmount
        ).toFixed(2)}!`,
        'Venta Registrada con Éxito'
      );

      // Requisito 7: Invalidar caché de SWR de productos para actualizar stocks inmediatamente en búsquedas
      await mutate(
        (key) =>
          Array.isArray(key)
            ? key[0] === '/api/v1/products'
            : typeof key === 'string' && key.startsWith('/api/v1/products'),
        undefined,
        { revalidate: true }
      );

      // Limpiar orden para nueva venta
      reset({ customerId: '', items: [] });
      setSelectedCustomer(null);
    } catch (err: unknown) {
      let errorTitle = 'Error al emitir factura';
      let errorMessage = 'Ocurrió un error inesperado al procesar la venta.';

      if (err && typeof err === 'object') {
        const errorRecord = err as Record<string, unknown>;
        const status = errorRecord.status;

        if (status === 409) {
          errorTitle = 'Inventario modificado por otra venta';
          errorMessage =
            (typeof errorRecord.detail === 'string' && errorRecord.detail) ||
            'El inventario de uno o más productos fue modificado recientemente por otra venta. Por favor, revise el stock disponible e intente de nuevo.';
        } else if (status === 400) {
          errorTitle =
            (typeof errorRecord.title === 'string' && errorRecord.title) || 'Error de Validación';
          errorMessage =
            (typeof errorRecord.detail === 'string' && errorRecord.detail) ||
            'Verifique que los datos de la orden sean correctos y que haya suficiente inventario disponible.';
        } else if (status === 503 || status === 500) {
          errorTitle =
            (typeof errorRecord.title === 'string' && errorRecord.title) || 'Error de Conexión';
          errorMessage =
            (typeof errorRecord.detail === 'string' && errorRecord.detail) ||
            'No se pudo comunicar con la base de datos en la nube. Verifique su conexión a internet e intente de nuevo.';
        } else if (status === 0) {
          errorTitle =
            (typeof errorRecord.title === 'string' && errorRecord.title) || 'Sin Conexión';
          errorMessage =
            (typeof errorRecord.detail === 'string' && errorRecord.detail) ||
            'No se pudo establecer comunicación con el servidor. Verifique su conexión a internet.';
        } else if (typeof errorRecord.detail === 'string' && errorRecord.detail) {
          errorMessage = errorRecord.detail;
        } else if (typeof errorRecord.title === 'string' && errorRecord.title) {
          errorMessage = errorRecord.title;
        }
      }

      // Sanitizar cualquier mensaje que contenga trazas técnicas en inglés o de EF Core
      if (
        errorMessage.includes('Microsoft.') ||
        errorMessage.includes('Exception') ||
        errorMessage.includes('at ') ||
        errorMessage.includes('stack')
      ) {
        errorMessage =
          'Ocurrió una interrupción en la comunicación con la base de datos. Por favor, verifique su conexión a internet e intente nuevamente.';
      }

      toast.error(errorMessage, errorTitle);
    }
  };

  const isOrderReady = Boolean(selectedCustomer && watchedItems.length > 0 && !isSubmitting);

  return (
    <div className="space-y-6 pb-12">
      {/* Barra de Estado y Vendedor */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <ShoppingCart className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900 leading-tight">
              Punto de Venta — Emisión de Factura
            </h2>
            <div className="flex items-center gap-2 mt-0.5 text-xs text-slate-500">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              <span>{issueDateFormatted}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 bg-slate-50 px-3.5 py-2 rounded-xl border border-slate-200/80">
          <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center text-xs font-bold">
            {user?.fullName?.charAt(0) || user?.username?.charAt(0) || 'V'}
          </div>
          <div className="text-right sm:text-left">
            <p className="text-xs font-semibold text-slate-900">
              {user?.fullName || user?.username || 'Cajero en Turno'}
            </p>
            <p className="text-[11px] text-blue-600 font-medium">Cajero / Vendedor Activo</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-6">
        {/* BLOQUE 1: Encabezado de la Orden (Datos del Cliente - BLOQUEADOS/READONLY) */}
        <section className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
            <div className="flex items-center gap-2.5">
              <User className="w-5 h-5 text-blue-600" />
              <div>
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
                  Datos del Cliente (Facturación)
                </h3>
                <p className="text-xs text-slate-500">
                  Campos protegidos de solo lectura. Selección obligatoria mediante búsqueda modal.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {selectedCustomer && (
                <button
                  type="button"
                  onClick={handleClearCustomer}
                  className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-600 hover:text-rose-600 bg-slate-100 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
                  title="Remover cliente seleccionado"
                >
                  <UserX className="w-4 h-4" />
                  <span>Limpiar</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => setIsCustomerModalOpen(true)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors cursor-pointer"
              >
                <Search className="w-4 h-4" />
                <span>{selectedCustomer ? 'Cambiar Cliente' : 'Buscar Cliente'}</span>
              </button>
            </div>
          </div>

          {/* Grilla de Campos de Cliente - REQUISITO 5: Estrictamente readOnly */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-5">
            <div>
              <label
                htmlFor="customer-id-number"
                className="block text-xs font-semibold text-slate-600 mb-1"
              >
                Cédula / RUC
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <CreditCard className="w-4 h-4" />
                </div>
                <input
                  id="customer-id-number"
                  type="text"
                  readOnly
                  tabIndex={-1}
                  value={selectedCustomer?.identificationNumber || ''}
                  placeholder="Seleccione un cliente..."
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-medium text-slate-800 placeholder-slate-400 cursor-not-allowed select-none focus:outline-hidden"
                />
              </div>
            </div>

            <div className="lg:col-span-2">
              <label
                htmlFor="customer-fullname"
                className="block text-xs font-semibold text-slate-600 mb-1"
              >
                Nombres y Apellidos / Razón Social
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Building2 className="w-4 h-4" />
                </div>
                <input
                  id="customer-fullname"
                  type="text"
                  readOnly
                  tabIndex={-1}
                  value={selectedCustomer?.fullName || ''}
                  placeholder="Ningún cliente seleccionado aún"
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 placeholder-slate-400 cursor-not-allowed select-none focus:outline-hidden"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="customer-phone"
                className="block text-xs font-semibold text-slate-600 mb-1"
              >
                Teléfono de Contacto
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Phone className="w-4 h-4" />
                </div>
                <input
                  id="customer-phone"
                  type="text"
                  readOnly
                  tabIndex={-1}
                  value={selectedCustomer?.phoneNumber || ''}
                  placeholder="—"
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 placeholder-slate-400 cursor-not-allowed select-none focus:outline-hidden"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="customer-email"
                className="block text-xs font-semibold text-slate-600 mb-1"
              >
                Correo Electrónico
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  id="customer-email"
                  type="text"
                  readOnly
                  tabIndex={-1}
                  value={selectedCustomer?.email || ''}
                  placeholder="—"
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 placeholder-slate-400 cursor-not-allowed select-none focus:outline-hidden"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="customer-address"
                className="block text-xs font-semibold text-slate-600 mb-1"
              >
                Dirección del Cliente
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <MapPin className="w-4 h-4" />
                </div>
                <input
                  id="customer-address"
                  type="text"
                  readOnly
                  tabIndex={-1}
                  value={selectedCustomer?.address || ''}
                  placeholder="—"
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 placeholder-slate-400 cursor-not-allowed select-none focus:outline-hidden"
                />
              </div>
            </div>
          </div>

          {!selectedCustomer && (
            <div className="mt-4 p-3 bg-amber-50/80 border border-amber-200 rounded-xl flex items-center gap-2.5 text-amber-800 text-xs">
              <AlertTriangle className="w-4 h-4 flex-shrink-0 text-amber-600" />
              <span>
                Haga clic en <strong>"Buscar Cliente"</strong> para asociar un comprador registrado a esta factura.
              </span>
            </div>
          )}
        </section>

        {/* BLOQUE 2: Detalle de la Orden (Tabla de Items) */}
        <section className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
            <div className="flex items-center gap-2.5">
              <Package className="w-5 h-5 text-blue-600" />
              <div>
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
                  Detalle de Productos
                </h3>
                <p className="text-xs text-slate-500">
                  Solo la cantidad es editable. Precios, impuestos y subtotales se calculan automáticamente.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleOpenAddProduct}
              className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Agregar Producto</span>
            </button>
          </div>

          {/* Estado Vacío */}
          {watchedItems.length === 0 ? (
            <div className="py-16 text-center border-2 border-dashed border-slate-200 rounded-2xl my-4">
              <div className="w-14 h-14 bg-slate-50 text-slate-400 rounded-full flex items-center justify-center mx-auto mb-3">
                <ShoppingCart className="w-7 h-7" />
              </div>
              <h4 className="text-sm font-bold text-slate-800">
                No hay productos en la orden de venta
              </h4>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                Haz clic en <strong>"Agregar Producto"</strong> para abrir el catálogo con existencias en tiempo real y comenzar a facturar.
              </p>
              <button
                type="button"
                onClick={handleOpenAddProduct}
                className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Agregar Producto</span>
              </button>
            </div>
          ) : (
            <div className="mt-5 border border-slate-200 rounded-xl overflow-x-auto shadow-xs">
              <table className="min-w-full divide-y divide-slate-200 text-left text-xs">
                <thead className="bg-slate-50 font-semibold text-slate-700">
                  <tr>
                    <th scope="col" className="px-3.5 py-3 w-10 text-center">#</th>
                    <th scope="col" className="px-3.5 py-3">Código</th>
                    <th scope="col" className="px-3.5 py-3">Descripción</th>
                    <th scope="col" className="px-3.5 py-3 text-center">Stock Disp.</th>
                    <th scope="col" className="px-3.5 py-3 text-right">Precio Unit.</th>
                    <th scope="col" className="px-3.5 py-3 text-center">IVA %</th>
                    <th scope="col" className="px-3.5 py-3 w-28 text-center">Cantidad</th>
                    <th scope="col" className="px-3.5 py-3 text-right">Subtotal</th>
                    <th scope="col" className="px-3.5 py-3 text-center w-24">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {watchedItems.map((item, index) => {
                    const lineSubtotal = item.quantity * item.unitPrice;

                    return (
                      <tr key={item.productId} className="hover:bg-slate-50/70 transition-colors">
                        <td className="px-3.5 py-3 text-center font-mono text-slate-400">
                          {index + 1}
                        </td>
                        <td className="px-3.5 py-3 font-mono font-medium text-slate-900 whitespace-nowrap">
                          {item.code}
                        </td>
                        <td className="px-3.5 py-3 font-medium text-slate-800">
                          {item.name}
                        </td>
                        <td className="px-3.5 py-3 text-center whitespace-nowrap">
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                            {item.stockQuantity}
                          </span>
                        </td>
                        <td className="px-3.5 py-3 text-right font-mono font-medium text-slate-800 whitespace-nowrap">
                          ${item.unitPrice.toFixed(2)}
                        </td>
                        <td className="px-3.5 py-3 text-center font-mono text-slate-600 whitespace-nowrap">
                          {item.taxRate}%
                        </td>
                        <td className="px-3.5 py-3 text-center whitespace-nowrap">
                          {/* REQUISITO 6 Y 9: ÚNICO CAMPO EDITABLE */}
                          <div className="flex items-center justify-center">
                            <input
                              type="number"
                              min={1}
                              max={item.stockQuantity}
                              value={item.quantity}
                              onChange={(e) => handleQuantityChange(index, e.target.value)}
                              className="w-20 px-2 py-1.5 text-center font-mono font-semibold bg-white border border-slate-300 rounded-lg text-slate-900 shadow-2xs focus:ring-2 focus:ring-blue-500 focus:border-transparent cursor-pointer text-xs"
                              title={`Ingrese cantidad (máximo disponible: ${item.stockQuantity})`}
                            />
                          </div>
                        </td>
                        <td className="px-3.5 py-3 text-right font-mono font-bold text-slate-900 whitespace-nowrap">
                          ${lineSubtotal.toFixed(2)}
                        </td>
                        <td className="px-3.5 py-3 text-center whitespace-nowrap">
                          <div className="flex items-center justify-center gap-1.5">
                            {/* REQUISITO 11: Reemplazar Producto */}
                            <button
                              type="button"
                              onClick={() => handleOpenReplaceProduct(index)}
                              className="p-1.5 text-amber-600 hover:text-amber-700 hover:bg-amber-50 rounded-lg transition-colors cursor-pointer"
                              title="Sustituir producto por otro del catálogo"
                              aria-label="Sustituir producto"
                            >
                              <RefreshCw className="w-4 h-4" />
                            </button>

                            {/* REQUISITO 10: Eliminar Item */}
                            <button
                              type="button"
                              onClick={() => handleRemoveItem(index)}
                              className="p-1.5 text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                              title="Remover de la orden"
                              aria-label="Eliminar producto"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* BLOQUE 3 Y 4: Resumen Financiero y Botones de Acción */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Información Adicional y Políticas */}
          <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 text-slate-800 font-bold text-sm mb-2">
                <Receipt className="w-4 h-4 text-blue-600" />
                <span>Información de Venta</span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed mb-3">
                Tarifa de IVA vigente (15%) calculada automáticamente sobre los productos gravados.
                Las existencias se descuentan del inventario al confirmar la transacción.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 text-xs text-slate-500">
                <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl">
                  <span className="font-semibold text-slate-700 block mb-0.5">Control de Inventario</span>
                  <span>Actualización en tiempo real para evitar ventas de productos sin disponibilidad.</span>
                </div>
                <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl">
                  <span className="font-semibold text-slate-700 block mb-0.5">Comprobante de Venta</span>
                  <span>Al emitir la orden se genera un comprobante descargable en formato PDF.</span>
                </div>
              </div>
            </div>

            {/* Botón de Cancelar Orden */}
            <div className="pt-6 border-t border-slate-100 flex items-center justify-between">
              <button
                type="button"
                onClick={handleCancelOrder}
                className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-semibold text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-xl border border-rose-200 transition-colors cursor-pointer"
                title="Descartar orden en curso"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Cancelar Orden</span>
              </button>

              <span className="text-[11px] text-slate-400 font-medium">
                {watchedItems.length} {watchedItems.length === 1 ? 'producto en orden' : 'productos en orden'}
              </span>
            </div>
          </div>

          {/* Tarjeta de Resumen Financiero */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-xs flex flex-col justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide pb-3 border-b border-slate-100">
                Resumen de la Venta
              </h3>

              <div className="space-y-3 py-4 text-xs">
                <div className="flex justify-between items-center text-slate-600">
                  <span>Subtotal Sin Impuestos:</span>
                  <span className="font-mono font-semibold text-slate-800">
                    ${subtotal.toFixed(2)}
                  </span>
                </div>

                <div className="flex justify-between items-center text-slate-600">
                  <span className="flex items-center gap-1">
                    <span>IVA (15%):</span>
                  </span>
                  <span className="font-mono font-semibold text-slate-800">
                    ${taxAmount.toFixed(2)}
                  </span>
                </div>

                <div className="pt-3 border-t border-slate-200 flex justify-between items-baseline">
                  <div>
                    <span className="text-sm font-bold text-slate-900 block">Total a Pagar:</span>
                    <span className="text-[10px] text-slate-400">Moneda de curso legal: USD</span>
                  </div>
                  <span className="font-mono text-2xl font-black text-blue-600">
                    ${totalAmount.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>

            {/* Botón de Emitir Factura */}
            <div className="pt-4">
              <button
                type="submit"
                disabled={!isOrderReady}
                className="w-full inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-sm font-bold rounded-xl shadow-md hover:shadow-lg transition-all cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Emitiendo Factura...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-5 h-5" />
                    <span>Emitir Factura / Guardar Venta</span>
                  </>
                )}
              </button>
              {!selectedCustomer && watchedItems.length > 0 && (
                <p className="text-[11px] text-amber-600 text-center mt-2 font-medium">
                  * Seleccione un cliente para habilitar la emisión
                </p>
              )}
            </div>
          </div>
        </div>
      </form>

      {/* Modal de Búsqueda Inteligente de Clientes */}
      <CustomerSearchModal
        isOpen={isCustomerModalOpen}
        onClose={() => setIsCustomerModalOpen(false)}
        onSelectCustomer={handleSelectCustomer}
      />

      {/* Modal de Búsqueda Inteligente de Productos */}
      <ProductSearchModal
        isOpen={isProductModalOpen}
        onClose={() => setIsProductModalOpen(false)}
        mode={productModalMode}
        onSelectProduct={handleSelectProduct}
        currentProductIds={currentProductIds}
        replacingProductId={replacingProductId}
      />

      {/* Modal de Confirmación para Cancelar Orden */}
      <ConfirmModal
        isOpen={isCancelModalOpen}
        onClose={() => setIsCancelModalOpen(false)}
        onConfirm={handleConfirmCancelOrder}
        title="¿Cancelar orden en curso?"
        message="Se eliminarán el cliente seleccionado y todos los productos agregados a esta venta. Esta acción no se puede deshacer."
        confirmText="Sí, cancelar orden"
        cancelText="Continuar venta"
        variant="danger"
      />
    </div>
  );
};
