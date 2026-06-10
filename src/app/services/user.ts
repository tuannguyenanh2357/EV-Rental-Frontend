import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import {
  ApiResponse,
  AuthenticationData,
  LoginRequest,
  RegisterRequest
} from '../models/user';
import { API_BASE_URL } from '../constants/api';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private readonly apiBaseUrl = API_BASE_URL;
  private readonly userApiUrl = `${this.apiBaseUrl}/users`;
  private readonly authApiUrl = `${this.apiBaseUrl}/auth`;

  constructor(private http: HttpClient) {}

  getUsers() {
    const token = localStorage.getItem('accessToken');
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
    return this.http.get<ApiResponse<any[]>>(this.userApiUrl, { headers });
  }

  getMyInfo() {
    const token = localStorage.getItem('accessToken');
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
    return this.http.get<ApiResponse<any>>(`${this.userApiUrl}/myInfo`, { headers });
  }

  register(user: RegisterRequest) {
    return this.http.post<ApiResponse<unknown>>(this.userApiUrl, user);
  }

  login(user: LoginRequest) {
    return this.http.post<ApiResponse<AuthenticationData>>(
      `${this.authApiUrl}/log-in`,
      user
    );
  }

  updateUser(id: number, user: any) {
    const token = localStorage.getItem('accessToken');
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
    return this.http.put<ApiResponse<any>>(`${this.userApiUrl}/${id}`, user, { headers });
  }

  deleteUser(id: number) {
    const token = localStorage.getItem('accessToken');
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
    return this.http.delete<ApiResponse<string>>(`${this.userApiUrl}/${id}`, { headers });
  }
}
