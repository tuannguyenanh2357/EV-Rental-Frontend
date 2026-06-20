import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { API_BASE_URL } from '../constants/api';
import { ApiResponse } from '../models/user';
import { ChargingStation } from '../models/charging-station';

@Injectable({
  providedIn: 'root'
})
export class ChargingStationService {
  private readonly apiUrl = `${API_BASE_URL}/api/stations`;

  constructor(private http: HttpClient) {}

  private getHeaders(): { headers: HttpHeaders } {
    let token: string | null = null;
    if (typeof window !== 'undefined') {
      token = localStorage.getItem('accessToken');
    }
    let headers = new HttpHeaders();
    if (token && token !== 'null' && token !== 'undefined') {
      headers = headers.set('Authorization', `Bearer ${token}`);
    }
    return { headers };
  }

  getStations() {
    return this.http.get<ApiResponse<ChargingStation[]>>(this.apiUrl, this.getHeaders());
  }
}
