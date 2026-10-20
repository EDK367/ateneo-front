import { Injectable } from '@angular/core';
import { ApiService } from './config/api';
import { Observable } from 'rxjs';

export interface DashboardStatsResponse {
  totalUsers?: number;
  activeUsers?: number;
  inactiveUsers?: number;
  storageUsedBytes: number;
  storageLimitBytes: number;
  storagePercentage: number;
  mdCount: number;
  txtCount: number;
  totalFiles: number;
  foldersCount: number;
  sharedCount: number;
  sharedByMeCount?: number;
  sharedWithMeCount?: number;
}

@Injectable({
  providedIn: 'root'
})
export class ReportService extends ApiService {
  getStats(): Observable<DashboardStatsResponse> {
    return this.get<DashboardStatsResponse>('/report/stats');
  }

  getGlobalStats(): Observable<DashboardStatsResponse> {
    return this.get<DashboardStatsResponse>('/report/global');
  }
}
