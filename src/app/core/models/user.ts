export type UserRole = 'admin' | 'user';

export interface User {
  id?: string;
  username: string;
  email: string;
  role: UserRole;
  isActive?: boolean;
  storageUsedBytes?: number;
}
