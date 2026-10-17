import { Injectable } from '@angular/core';
import { ApiService } from './config/api';
import { UserResponse } from '../models/user';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class UserService extends ApiService {
  findAll(): Observable<UserResponse[]> {
    return this.get<UserResponse[]>('/user');
  }

  deleteUser(id: string): Observable<UserResponse> {
    return this.delete<UserResponse>(`/user/${id}`);
  }
}
