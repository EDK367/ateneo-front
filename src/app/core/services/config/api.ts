import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../../../environments/enviroment';


// clase generica para el consumo de la api respondiendo con una mima estructura 
@Injectable({
  providedIn: 'root'
})
export class ApiService {

  protected readonly http = inject(HttpClient);
  protected readonly baseUrl = environment.api_url;

  protected get<T>(path: string, params?: HttpParams): Observable<T> {
    return this.http.get<T>(`${this.baseUrl}${path}`, { params });
  }

  protected post<T>(path: string, body: unknown): Observable<T> {
    return this.http.post<T>(`${this.baseUrl}${path}`, body);
  }

  protected put<T>(path: string, body: unknown): Observable<T> {
    return this.http.put<T>(`${this.baseUrl}${path}`, body);
  }

  protected delete<T>(path: string): Observable<T> {
    return this.http.delete<T>(`${this.baseUrl}${path}`);
  }

  protected patch<T>(path: string, body?: unknown, params?: HttpParams): Observable<T> {
    return this.http.patch<T>(`${this.baseUrl}${path}`, body, { params });
  }
}
