import { Injectable } from '@angular/core';
import { UserProfile } from '../../models/auth';

const USER_KEY = 'ateneo_user';

@Injectable({
  providedIn: 'root'
})
export class SessionService {
  saveUser(user: UserProfile): void {
    sessionStorage.setItem(USER_KEY, JSON.stringify(user));
  }

  getUser(): UserProfile | null {
    const raw = sessionStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  }

  getRole(): string | null {
    return this.getUser()?.role ?? null;
  }

  clearUser(): void {
    sessionStorage.removeItem(USER_KEY);
  }
}
