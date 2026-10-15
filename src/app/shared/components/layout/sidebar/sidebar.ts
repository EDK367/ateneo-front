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
          { label: 'Dashboard', icon: 'grid', route: '/admin/dashboard' },
          { label: 'Mi Perfil', icon: 'user', route: '/admin/profile' },
          { label: 'Documentos', icon: 'box', route: '/admin/documents' },
          { label: 'Usuarios', icon: 'users', route: '/admin/users' },
          { label: 'Auditoría', icon: 'shield', route: '/admin/audit-logs' }
        ]
      },
      {
        title: '',
        items: [
          
        ]
      }
    ]
  },
  user: {
    showActionBtn: true,
    actionBtnLabel: 'Subir Documento',
    actionBtnRoute: '/user/documents',
    sections: [
      {
        title: 'PRINCIPAL',
        items: [
          { label: 'Dashboard', icon: 'grid', route: '/user/dashboard' },
          { label: 'Mi Perfil', icon: 'user', route: '/user/profile' }
        ]
      },
      {
        title: 'DOCUMENTOS',
        items: [
          { label: 'Mis Archivos', icon: 'box', route: '/user/documents' },
          { label: 'Compartidos', icon: 'users', route: '/user/shared' }
        ]
      },
      {
        title: 'CONFIGURACIÓN',
        items: [
          { label: 'Ajustes', icon: 'gear', route: '/user/settings' }
        ]
      }
    ]
  },
  usuario: {
    showActionBtn: true,
    actionBtnLabel: 'Subir Documento',
    actionBtnRoute: '/user/documents',
    sections: [
      {
        title: 'PRINCIPAL',
        items: [
          { label: 'Dashboard', icon: 'grid', route: '/user/dashboard' },
          { label: 'Mi Perfil', icon: 'user', route: '/user/profile' }
        ]
      },
      {
        title: 'DOCUMENTOS',
        items: [
          { label: 'Mis Archivos', icon: 'box', route: '/user/documents' },
          { label: 'Compartidos', icon: 'users', route: '/user/shared' }
        ]
      },
      {
        title: 'CONFIGURACIÓN',
        items: [
          { label: 'Ajustes', icon: 'gear', route: '/user/settings' }
        ]
      }
    ]
  }
};
