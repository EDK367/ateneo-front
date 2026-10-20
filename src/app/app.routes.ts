import { Routes } from '@angular/router';
import { authGuard, guestGuard, roleGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  {
    path: 'login',
    canActivate: [guestGuard],
    loadComponent: () =>
      import('./features/auth/login/login').then(m => m.Login)
  },
  {
    path: 'admin',
    canActivate: [authGuard, roleGuard(['admin'])],
    loadComponent: () =>
      import('./features/admin/admin').then(m => m.Admin),
    children: [
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./features/admin/pages/dashboard/dashboard').then(m => m.Dashboard)
      },
      {
        path: 'users',
        loadComponent: () =>
          import('./features/admin/pages/users/users').then(m => m.Users)
      },
      {
        path: 'documents',
        loadComponent: () =>
          import('./features/user/pages/documents/documents').then(m => m.DocumentsComponent)
      },
      {
        path: 'shared',
        loadComponent: () =>
          import('./features/admin/pages/shared/shared').then(m => m.Shared)
      },
      {
        path: 'trash',
        loadComponent: () =>
          import('./features/admin/pages/trash/trash').then(m => m.Trash)
      },
      {
        path: 'audit-logs',
        loadComponent: () =>
          import('./features/admin/pages/audit-logs/audit-logs').then(m => m.AuditLogs)
      },
      {
        path: 'activity',
        redirectTo: 'audit-logs',
        pathMatch: 'full'
      },
      {
        path: 'reports',
        loadComponent: () =>
          import('./features/admin/pages/reports/reports').then(m => m.Reports)
      },
      {
        path: 'reports/storage',
        loadComponent: () =>
          import('./features/admin/pages/reports/reports').then(m => m.Reports)
      },
      {
        path: 'reports/users',
        loadComponent: () =>
          import('./features/admin/pages/reports/reports').then(m => m.Reports)
      },
      {
        path: 'reports/activity',
        loadComponent: () =>
          import('./features/admin/pages/reports/reports').then(m => m.Reports)
      },
      {
        path: 'profile',
        loadComponent: () =>
          import('./features/admin/pages/profile/profile').then(m => m.Profile)
      },
      {
        path: 'perfil',
        redirectTo: 'profile',
        pathMatch: 'full'
      },
      {
        path: 'settings',
        loadComponent: () =>
          import('./features/admin/pages/profile/profile').then(m => m.Profile)
      },
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full'
      }
    ]
  },
  {
    path: 'user',
    canActivate: [authGuard, roleGuard(['user', 'admin'])],
    loadComponent: () =>
      import('./features/user/user').then(m => m.UserComponent),
    children: [
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./features/user/pages/dashboard/dashboard').then(m => m.DashboardComponent)
      },
      {
        path: 'documents',
        loadComponent: () =>
          import('./features/user/pages/documents/documents').then(m => m.DocumentsComponent)
      },
      {
        path: 'shared',
        loadComponent: () =>
          import('./features/admin/pages/shared/shared').then(m => m.Shared)
      },
      {
        path: 'trash',
        loadComponent: () =>
          import('./features/admin/pages/trash/trash').then(m => m.Trash)
      },
      {
        path: 'activity',
        loadComponent: () =>
          import('./features/admin/pages/audit-logs/audit-logs').then(m => m.AuditLogs)
      },
      {
        path: 'profile',
        loadComponent: () =>
          import('./features/user/pages/profile/profile').then(m => m.Profile)
      },
      {
        path: 'perfil',
        redirectTo: 'profile',
        pathMatch: 'full'
      },
      {
        path: 'settings',
        loadComponent: () =>
          import('./features/user/pages/profile/profile').then(m => m.Profile)
      },
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full'
      }
    ]
  },
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full'
  },
  {
    path: '**',
    redirectTo: 'login'
  }
];
