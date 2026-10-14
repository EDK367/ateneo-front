import { Injectable } from '@angular/core';
import { ApiService } from './config/api';
import { LoginRequest, LoginResponse, RegisterRequest, UserProfile } from '../models/auth';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthService extends ApiService {
  login(credentials: LoginRequest): Observable<LoginResponse> {
    return this.post<LoginResponse>('/auth/login', credentials);
  }

  register(credentials: RegisterRequest): Observable<LoginResponse> {
    return this.post<LoginResponse>('/auth/register', credentials);
  }

  profile(): Observable<UserProfile> {
    return this.get<UserProfile>('/auth/profile');
  }
}