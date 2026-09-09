import { useState, useEffect } from 'react';

/**
 * Hook utilitario para aplicar debounce a valores de entrada (ej. búsquedas por texto).
 * No interactúa con caché de datos, cumpliendo la regla de Cero useEffect para datos.
 */
export function useDebounce<T>(value: T, delayMs: number = 300): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delayMs);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delayMs]);

  return debouncedValue;
}
