export type UserRole = 'admin' | 'user';

export interface User {
  id?: string;
  username: string;
  email: string;
  role: UserRole;
  isActive?: boolean;
  storageUsedBytes?: number;
}

export interface UserResponse {
  _id: string;
  username: string;
  email: string;
  role: UserRole;
  isActive: boolean;
  storageUsedBytes: number;
  createdAt: string;
  updatedAt: string;
}
