import { inject } from '@angular/core';
import { HttpInterceptorFn, HttpErrorResponse, HttpResponse } from '@angular/common/http';
import { tap, catchError } from 'rxjs/operators';
import { throwError } from 'rxjs';
import { NotificationService } from '../services/config/notification';

export interface BackendErrorPayload {
  title: string;
  message: string;
}

// adapta los errores del backend
export function extractBackendErrorPayload(err: HttpErrorResponse): BackendErrorPayload {
  let rawTitle = '';
  let rawMessage = '';

  // cast para los errores
  if (err.error) {
    if (typeof err.error === 'object') {
      const payload = err.error as Record<string, any>;
      if (typeof payload['error'] === 'string' && payload['error'].trim()) {
        rawTitle = payload['error'].trim();
      } else if (payload['error'] && typeof payload['error'] === 'object' && payload['error'].message) {
        rawTitle = String(payload['error'].message).trim();
      }

      if (typeof payload['message'] === 'string' && payload['message'].trim()) {
        rawMessage = payload['message'].trim();
      } else if (typeof payload['data'] === 'string' && payload['data'].trim()) {
        rawMessage = payload['data'].trim();
      } else if (typeof payload['detail'] === 'string' && payload['detail'].trim()) {
        rawMessage = payload['detail'].trim();
      }
    } else if (typeof err.error === 'string') {
      try {
        const parsed = JSON.parse(err.error);
        if (parsed && typeof parsed === 'object') {
          if (typeof parsed.error === 'string' && parsed.error.trim()) {
            rawTitle = parsed.error.trim();
          }
          if (typeof parsed.message === 'string' && parsed.message.trim()) {
            rawMessage = parsed.message.trim();
          }
        }
      } catch {
        if (err.error.trim() && !err.error.startsWith('<')) {
          rawMessage = err.error.trim();
        }
      }
    }
  }

  // si el back no envia datos explicitos
  if (!rawTitle && err.statusText && err.statusText !== 'OK') {
    rawTitle = err.statusText.trim();
  }

  const title = rawTitle || getDefaultTitle(err.status);
  const message = rawMessage || getFallbackMessage(err.status);

  return { title, message };
}

// mensaje de error
export function extractHttpErrorMessage(err: HttpErrorResponse): string {
  return extractBackendErrorPayload(err).message;
}

// errores titulo default
function getDefaultTitle(status: number): string {
  switch (status) {
    case 400: return 'Solicitud Incorrecta';
    case 401: return 'No Autorizado';
    case 403: return 'Acceso Denegado';
    case 404: return 'No Encontrado';
    case 409: return 'Conflicto';
    case 422: return 'Entidad No Procesable';
    case 500: return 'Error Interno';
    case 0: return 'Sin Conexión';
    default: return 'Error';
  }
}

// mensaje por default
function getFallbackMessage(status: number): string {
  switch (status) {
    case 400: return 'La solicitud contiene datos inválidos.';
    case 401: return 'Tu sesión ha expirado o no estás autenticado.';
    case 403: return 'No tienes permisos para realizar esta acción.';
    case 404: return 'El recurso solicitado no fue encontrado.';
    case 409: return 'Conflicto: el recurso ya existe o está en uso.';
    case 422: return 'Los datos enviados no son procesables.';
    case 500: return 'Error interno del servidor. Intenta de nuevo más tarde.';
    case 0: return 'No se pudo conectar con el servidor.';
    default: return `Error en la solicitud (código ${status}).`;
  }
}

// interceptor para los errores en los metodos
export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const notificationService = inject(NotificationService);

  return next(req).pipe(
    tap((event) => {
      if (event instanceof HttpResponse) {
        if (['POST', 'PUT', 'DELETE'].includes(req.method.toUpperCase())) {
          const body = event.body;
          if (body && typeof body === 'object' && 'message' in body && body.message) {
            const msg = String(body.message).trim();
            if (msg) {
              notificationService.showSuccess(msg, 'Éxito');
            }
          }
        }
      }
    }),
    catchError((err: HttpErrorResponse) => {
      const { title, message } = extractBackendErrorPayload(err);

      notificationService.showError(message, title);

      return throwError(() => err);
    })
  );
};

