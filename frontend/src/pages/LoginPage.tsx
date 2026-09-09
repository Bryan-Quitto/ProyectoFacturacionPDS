import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Store, User, Lock, LogIn, Loader2, AlertCircle } from 'lucide-react';

const loginSchema = z.object({
  username: z.string().min(1, 'El nombre de usuario es requerido'),
  password: z.string().min(1, 'La contraseña es requerida'),
});

type LoginFormData = z.infer<typeof loginSchema>;

export const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const toast = useToast();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: '',
      password: '',
    },
  });

  const onSubmit = async (values: LoginFormData) => {
    setErrorMessage(null);
    try {
      await login(values);
      toast.success('Sesión iniciada correctamente.', 'Bienvenido');
    } catch (err: unknown) {
      let message = 'Credenciales incorrectas. Verifique su usuario y contraseña.';
      if (err && typeof err === 'object') {
        const errorRecord = err as Record<string, unknown>;
        if (typeof errorRecord.detail === 'string' && errorRecord.detail.trim().length > 0) {
          message = errorRecord.detail;
        } else if (typeof errorRecord.title === 'string' && errorRecord.title.trim().length > 0) {
          message = errorRecord.title;
        } else if (typeof errorRecord.message === 'string' && errorRecord.message.trim().length > 0) {
          message = errorRecord.message;
        }
      }
      setErrorMessage(message);
      toast.error(message, 'Error de inicio de sesión');
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <div className="bg-blue-600 p-3 rounded-2xl shadow-lg text-white flex items-center justify-center">
            <Store className="w-10 h-10" />
          </div>
        </div>
        <h2 className="mt-4 text-center text-2xl font-extrabold text-slate-900 tracking-tight">
          Punto de Venta — Facturación
        </h2>
        <p className="mt-1 text-center text-sm text-slate-600">
          Acceso exclusivo para personal de caja y vendedores
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 shadow-xl rounded-2xl sm:px-10 border border-slate-200">
          {errorMessage && (
            <div
              className="mb-5 p-3.5 bg-rose-50 border border-rose-200 rounded-lg flex items-start gap-2.5 text-rose-800 text-sm"
              role="alert"
            >
              <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1 leading-snug">
                <p className="font-semibold">Acceso denegado</p>
                <p className="text-xs mt-0.5 text-rose-700">{errorMessage}</p>
              </div>
            </div>
          )}

          <form className="space-y-5" onSubmit={handleSubmit(onSubmit)} noValidate>
            <div>
              <label
                htmlFor="username"
                className="block text-sm font-medium text-slate-700 mb-1"
              >
                Nombre de Usuario
              </label>
              <div className="relative rounded-lg shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <User className="h-5 h-5" />
                </div>
                <input
                  id="username"
                  type="text"
                  autoComplete="username"
                  disabled={isSubmitting}
                  placeholder="ej. vendedor01"
                  className={`block w-full pl-10 pr-3 py-2.5 sm:text-sm rounded-lg border transition-colors outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-slate-50 disabled:text-slate-500 disabled:cursor-not-allowed ${
                    errors.username
                      ? 'border-rose-300 text-rose-900 placeholder-rose-300 focus:ring-rose-500 focus:border-rose-500'
                      : 'border-slate-300 text-slate-900 placeholder-slate-400'
                  }`}
                  {...register('username')}
                />
              </div>
              {errors.username && (
                <p className="mt-1.5 text-xs text-rose-600 font-medium">
                  {errors.username.message}
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-slate-700 mb-1"
              >
                Contraseña
              </label>
              <div className="relative rounded-lg shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Lock className="h-5 h-5" />
                </div>
                <input
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  disabled={isSubmitting}
                  placeholder="••••••••"
                  className={`block w-full pl-10 pr-3 py-2.5 sm:text-sm rounded-lg border transition-colors outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-slate-50 disabled:text-slate-500 disabled:cursor-not-allowed ${
                    errors.password
                      ? 'border-rose-300 text-rose-900 placeholder-rose-300 focus:ring-rose-500 focus:border-rose-500'
                      : 'border-slate-300 text-slate-900 placeholder-slate-400'
                  }`}
                  {...register('password')}
                />
              </div>
              {errors.password && (
                <p className="mt-1.5 text-xs text-rose-600 font-medium">
                  {errors.password.message}
                </p>
              )}
            </div>

            <div>
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full flex justify-center items-center gap-2 py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Iniciando sesión...</span>
                  </>
                ) : (
                  <>
                    <LogIn className="w-4 h-4" />
                    <span>Ingresar al Sistema</span>
                  </>
                )}
              </button>
            </div>
          </form>

          <div className="mt-6 pt-5 border-t border-slate-100 text-center">
            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700">
              Rol Asignado: Vendedor
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
