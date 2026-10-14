import { Injectable } from '@angular/core';

const ACCESS_KEY = 'ateneo_access_token';

@Injectable({
  providedIn: 'root',
})
export class TokenService {
  saveTokens(accessToken: string): void {
    localStorage.setItem(ACCESS_KEY, accessToken);
  }

  getAccessToken(): string | null {
    return localStorage.getItem(ACCESS_KEY);
  }

  hasToken(): boolean {
    return !!this.getAccessToken();
  }

  clearTokens(): void {
    localStorage.removeItem(ACCESS_KEY);
  }
}
