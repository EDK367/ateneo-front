import { Injectable } from '@angular/core';
import { ApiService } from './config/api';
import { Observable } from 'rxjs';

export interface DashboardStatsResponse {
  totalUsers?: number;
  activeUsers?: number;
  inactiveUsers?: number;
  storageUsedBytes: number;
  storageLimitBytes: number;
  storageAvailableBytes?: number;
  storagePercentage: number;
  mdCount: number;
  txtCount: number;
  totalFiles: number;
  foldersCount: number;
  sharedCount: number;
  sharedByMeCount?: number;
  sharedWithMeCount?: number;
}

export interface FileTypeReportItem {
  type: string;
  count: number;
  totalBytes: number;
}

export interface FileDateRangeReportItem {
  _id: string;
  name: string;
  type: string;
  size: number;
  createdAt: string;
  ownerName: string;
  folderName: string;
}

export interface MostActiveFileReportItem {
  _id: string;
  fileName: string;
  fileType: string;
  operationsCount: number;
  lastAction: string;
  lastActivityDate: string;
}

export interface TopUserFileReportItem {
  _id: string;
  userId: string;
  username: string;
  email: string;
  totalFiles: number;
  totalBytes: number;
}

export interface TopUserShareReportItem {
  _id: string;
  userId: string;
  username: string;
  email: string;
  sharesCount: number;
}

export interface UserShareReportItem {
  _id: string;
  resourceType: string;
  resourceId: string;
  resourceName: string;
  sharedWithUsername?: string;
  sharedWithEmail?: string;
  ownerUsername?: string;
  ownerEmail?: string;
  permission: string;
  createdAt: string;
}

export interface NeverSharedFileReportItem {
  _id: string;
  name: string;
  type: string;
  size: number;
  createdAt: string;
  ownerName: string;
  folderName: string;
}

export interface FolderMostFilesReportItem {
  _id: string;
  folderId: string;
  folderName: string;
  ownerName: string;
  filesCount: number;
  totalBytes: number;
}

export interface FileMostSharedUsersReportItem {
  _id: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  ownerName: string;
  sharedWithCount: number;
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

  getFilesByType(): Observable<FileTypeReportItem[]> {
    return this.get<FileTypeReportItem[]>('/report/by-type');
  }

  getFilesByDateRange(startDate?: string, endDate?: string): Observable<FileDateRangeReportItem[]> {
    let url = '/report/by-date-range';
    const params: string[] = [];
    if (startDate) params.push(`startDate=${encodeURIComponent(startDate)}`);
    if (endDate) params.push(`endDate=${encodeURIComponent(endDate)}`);
    if (params.length > 0) url += `?${params.join('&')}`;
    return this.get<FileDateRangeReportItem[]>(url);
  }

  getFilesMostOperations(limit = 10): Observable<MostActiveFileReportItem[]> {
    return this.get<MostActiveFileReportItem[]>(`/report/most-active-files?limit=${limit}`);
  }

  getTopUsersWithMostFiles(): Observable<TopUserFileReportItem[]> {
    return this.get<TopUserFileReportItem[]>('/report/top-users-files');
  }

  getTopUsersWithMostShares(limit = 10): Observable<TopUserShareReportItem[]> {
    return this.get<TopUserShareReportItem[]>(`/report/top-users-shares?limit=${limit}`);
  }

  getResourcesSharedByUser(userId: string): Observable<UserShareReportItem[]> {
    return this.get<UserShareReportItem[]>(`/report/shared-by-user/${userId}`);
  }

  getResourcesReceivedByUser(userId: string): Observable<UserShareReportItem[]> {
    return this.get<UserShareReportItem[]>(`/report/shared-with-user/${userId}`);
  }

  getNeverSharedFiles(limit = 50): Observable<NeverSharedFileReportItem[]> {
    return this.get<NeverSharedFileReportItem[]>(`/report/never-shared?limit=${limit}`);
  }

  getFoldersWithMostFiles(limit = 10): Observable<FolderMostFilesReportItem[]> {
    return this.get<FolderMostFilesReportItem[]>(`/report/folders-most-files?limit=${limit}`);
  }

  getFilesSharedWithMostUsers(limit = 10): Observable<FileMostSharedUsersReportItem[]> {
    return this.get<FileMostSharedUsersReportItem[]>(`/report/files-most-shared-users?limit=${limit}`);
  }
}
