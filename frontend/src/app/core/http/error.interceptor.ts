import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { MessageService } from 'primeng/api';
import { catchError, throwError } from 'rxjs';
import { StorageService } from '../services/storage.service';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);
  const storage = inject(StorageService);
  const messageService = inject(MessageService);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      let errorMessage = 'Ha ocurrido un error inesperado';
      let errorCode = 'UNKNOWN_ERROR';

      if (error.error?.error) {
        errorMessage = error.error.error.message || errorMessage;
        errorCode = error.error.error.code || errorCode;
      }

      switch (error.status) {
        case 401:
          // Token inválido o expirado
          if (errorCode === 'TOKEN_EXPIRED' || errorCode === 'INVALID_TOKEN') {
            storage.clear();
            router.navigate(['/login']);
            errorMessage = 'Tu sesión ha expirado. Por favor, inicia sesión nuevamente.';
          }
          break;

        case 403:
          errorMessage = errorMessage || 'No tienes permisos para realizar esta acción';
          break;

        case 404:
          errorMessage = errorMessage || 'El recurso solicitado no fue encontrado';
          break;

        case 409:
          // Conflict (ej: appointment overlap)
          break;

        case 422:
        case 400:
          // Validation error - el mensaje ya viene del backend
          break;

        case 429:
          errorMessage = 'Demasiadas solicitudes. Por favor, espera un momento.';
          break;

        case 500:
          errorMessage = 'Error del servidor. Por favor, intenta más tarde.';
          break;

        case 0:
          errorMessage = 'No se pudo conectar con el servidor. Verifica tu conexión.';
          break;
      }

      // Mostrar toast de error
      messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: errorMessage,
        life: 5000,
      });

      return throwError(() => ({
        status: error.status,
        code: errorCode,
        message: errorMessage,
        details: error.error?.error?.details,
      }));
    })
  );
};
