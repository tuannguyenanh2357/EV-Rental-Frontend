import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { API_BASE_URL } from '../constants/api';
import { ApiResponse } from '../models/user';
import { Vehicle } from '../models/vehicle';

@Injectable({
  providedIn: 'root'
})
export class VehicleService {
  private readonly apiBaseUrl = API_BASE_URL;
  private readonly vehicleApiUrl = `${this.apiBaseUrl}/api/vehicles`;

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

  getVehicles() {
    return this.http.get<ApiResponse<Vehicle[]>>(this.vehicleApiUrl, this.getHeaders());
  }

  getVehicleById(id: number) {
    return this.http.get<ApiResponse<Vehicle>>(`${this.vehicleApiUrl}/${id}`, this.getHeaders());
  }

  createVehicle(vehicle: Partial<Vehicle>) {
    return this.http.post<ApiResponse<Vehicle>>(this.vehicleApiUrl, vehicle, this.getHeaders());
  }

  uploadImage(file: File) {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<ApiResponse<string>>(`${this.vehicleApiUrl}/upload`, formData, this.getHeaders());
  }

  deleteVehicle(id: number) {
    return this.http.delete<ApiResponse<string>>(`${this.vehicleApiUrl}/${id}`, this.getHeaders());
  }

  updateVehicle(id: number, vehicle: Partial<Vehicle>) {
    return this.http.put<ApiResponse<Vehicle>>(`${this.vehicleApiUrl}/${id}`, vehicle, this.getHeaders());
  }
}
