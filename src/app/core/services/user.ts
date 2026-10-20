import { Injectable } from '@angular/core';
import { ApiService } from './config/api';
import { UserResponse } from '../models/user';
import { Observable } from 'rxjs';

export interface CreateUserPayload {
  username: string;
  email: string;
  password?: string;
  role?: string;
  isActive?: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class UserService extends ApiService {
  findAll(): Observable<UserResponse[]> {
    return this.get<UserResponse[]>('/user');
  }

  createUser(payload: CreateUserPayload): Observable<UserResponse> {
    return this.post<UserResponse>('/user', payload);
  }

  updateUser(id: string, payload: Partial<CreateUserPayload>): Observable<UserResponse> {
    return this.put<UserResponse>(`/user/${id}`, payload);
  }

  deleteUser(id: string): Observable<UserResponse> {
    return this.delete<UserResponse>(`/user/${id}`);
  }
}
