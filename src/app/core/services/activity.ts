import { Injectable } from '@angular/core';
import { ApiService } from './config/api';
import { ActivityResponse } from '../models/activity';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ActivityService extends ApiService {
  findRecent(limit = 20): Observable<ActivityResponse[]> {
    return this.get<ActivityResponse[]>(`/activity?limit=${limit}`);
  }
}
