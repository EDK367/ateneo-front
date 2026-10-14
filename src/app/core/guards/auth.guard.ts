import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { TokenService } from '../services/config/token';
import { SessionService } from '../services/config/session';

export const authGuard: CanActivateFn = () => {
  const tokenService = inject(TokenService);
  const router = inject(Router);

  if (tokenService.hasToken()) {
    return true;
  }

  return router.createUrlTree(['/login']);
};

export const guestGuard: CanActivateFn = () => {
  const tokenService = inject(TokenService);
  const sessionService = inject(SessionService);
  const router = inject(Router);

  if (!tokenService.hasToken() || !sessionService.getUser()) {
    tokenService.clearTokens();
    sessionService.clearUser();
    return true;
  }

  const role = sessionService.getRole();
  if (role === 'admin') {
    return router.createUrlTree(['/admin']);
  }
  return router.createUrlTree(['/user']);
};

export const roleGuard = (allowedRoles: string[]): CanActivateFn => () => {
  const sessionService = inject(SessionService);
  const router = inject(Router);
  const role = sessionService.getRole();

  if (role && allowedRoles.includes(role)) {
    return true;
  }

  return router.createUrlTree(['/login']);
};
