import { inject } from '@angular/core';
import { HttpInterceptorFn } from '@angular/common/http';

import { TokenService } from '../services/config/token';

// clase encargada de interceptar el token en formato Bearer
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const token = inject(TokenService).getAccessToken();

  if (!token) {
    return next(req);
  }

  return next(
    req.clone({
      setHeaders: { Authorization: `Bearer ${token}` },
    })
  );
};
