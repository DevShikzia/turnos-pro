import { Injectable } from '@angular/core';

const TOKEN_KEY = 'turnos_token';
const USER_KEY = 'turnos_user';

@Injectable({
  providedIn: 'root',
})
export class StorageService {
  // Token
  getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  }

  setToken(token: string): void {
    localStorage.setItem(TOKEN_KEY, token);
  }

  removeToken(): void {
    localStorage.removeItem(TOKEN_KEY);
  }

  // User
  getUser<T>(): T | null {
    const user = localStorage.getItem(USER_KEY);
    return user ? JSON.parse(user) : null;
  }

  setUser<T>(user: T): void {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  }

  removeUser(): void {
    localStorage.removeItem(USER_KEY);
  }

  // Clear all
  clear(): void {
    this.removeToken();
    this.removeUser();
  }

  // Check if authenticated
  isAuthenticated(): boolean {
    return !!this.getToken();
  }

  // Session Storage helpers
  setSessionItem(key: string, value: string): void {
    sessionStorage.setItem(key, value);
  }

  getSessionItem(key: string): string | null {
    return sessionStorage.getItem(key);
  }

  removeSessionItem(key: string): void {
    sessionStorage.removeItem(key);
  }

  // Local Storage helpers (persiste al cerrar el navegador)
  setLocalItem(key: string, value: string): void {
    localStorage.setItem(key, value);
  }

  getLocalItem(key: string): string | null {
    return localStorage.getItem(key);
  }

  removeLocalItem(key: string): void {
    localStorage.removeItem(key);
  }
}
