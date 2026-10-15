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
        path: 'dashboard',
        redirectTo: 'profile',
        pathMatch: 'full'
      },
      {
        path: 'documents',
        redirectTo: 'profile',
        pathMatch: 'full'
      },
      {
        path: 'users',
        redirectTo: 'profile',
        pathMatch: 'full'
      },
      {
        path: 'audit-logs',
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
        redirectTo: 'profile',
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
        redirectTo: 'profile',
        pathMatch: 'full'
      },
      {
        path: 'documents',
        redirectTo: 'profile',
        pathMatch: 'full'
      },
      {
        path: 'shared',
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
        redirectTo: 'profile',
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
