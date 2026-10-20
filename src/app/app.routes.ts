import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () =>
      import('./features/auth/login/login').then(m => m.Login)
  },
  {
    path: 'admin',
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
        path: 'shared',
        loadComponent: () =>
          import('./features/user/pages/documents/documents').then(m => m.DocumentsComponent)
      },
      {
        path: 'trash',
        loadComponent: () =>
          import('./features/user/pages/documents/documents').then(m => m.DocumentsComponent)
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
    loadComponent: () =>
      import('./features/user/user').then(m => m.UserComponent),
    children: [
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
        redirectTo: 'profile',
        pathMatch: 'full'
      },
      {
        path: 'trash',
        redirectTo: 'profile',
        pathMatch: 'full'
      },
      {
        path: 'activity',
        redirectTo: 'profile',
        pathMatch: 'full'
      },
      {
        path: 'settings',
        redirectTo: 'profile',
        pathMatch: 'full'
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
