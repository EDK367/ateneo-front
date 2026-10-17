export interface MenuItem {
  label: string;
  icon: string;
  route: string;
  badge?: string;
}

export interface MenuSection {
  title: string;
  items: MenuItem[];
}

export interface RoleMenuConfig {
  showActionBtn?: boolean;
  actionBtnLabel?: string;
  actionBtnRoute?: string;
  sections: MenuSection[];
}

export const ROLE_MENUS: Record<string, RoleMenuConfig> = {
  admin: {
    sections: [
      {
        title: '',
        items: [
          { label: 'Pagina Principal', icon: 'grid', route: '/admin/dashboard' },
          { label: 'Documentos Globales', icon: 'box', route: '/admin/documents' }
        ]
      },
      {
        title: 'Administración',
        items: [
          { label: 'Gestión de Usuarios', icon: 'user-gear', route: '/admin/users' },
          { label: 'Recursos Compartidos', icon: 'users', route: '/admin/shared' },
          { label: 'Papelera Global', icon: 'trash', route: '/admin/trash' },
          { label: 'Auditoría y Actividad', icon: 'shield', route: '/admin/audit-logs' }
        ]
      },
      {
        title: 'Reportes',
        items: [
          { label: 'Módulo de Reportes', icon: 'chart', route: '/admin/reports' },
          { label: 'Archivos y Almacenamiento', icon: 'receipt', route: '/admin/reports/storage' },
          { label: 'Usuarios y Compartición', icon: 'shapes', route: '/admin/reports/users' },
          { label: 'Actividad del Sistema', icon: 'history', route: '/admin/reports/activity' }
        ]
      },
      {
        title: 'Mi Cuenta',
        items: [
          { label: 'Mi Perfil', icon: 'user', route: '/admin/profile' },
          { label: 'Ajustes', icon: 'gear', route: '/admin/settings' }
        ]
      }
    ]
  },
  user: {
    sections: [
      {
        title: '',
        items: [
          { label: 'Pagina Principal', icon: 'grid', route: '/user/dashboard' },
          { label: 'Mi Unidad', icon: 'box', route: '/user/documents' }
        ]
      },
      {
        title: 'Documentos',
        items: [
          { label: 'Compartidos', icon: 'users', route: '/user/shared' },
          { label: 'Papelera', icon: 'trash', route: '/user/trash' },
          { label: 'Historial de Actividad', icon: 'history', route: '/user/activity' }
        ]
      },
      {
        title: 'Mi Cuenta',
        items: [
          { label: 'Mi Perfil', icon: 'user', route: '/user/profile' },
          { label: 'Ajustes', icon: 'gear', route: '/user/settings' }
        ]
      }
    ]
  }
};

ROLE_MENUS['usuario'] = ROLE_MENUS['user'];
