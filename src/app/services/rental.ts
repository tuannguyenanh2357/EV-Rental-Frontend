import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { API_BASE_URL } from '../constants/api';
import { Observable } from 'rxjs';

// ---- Enums ----
export type PaymentMethod = 'BANK_TRANSFER' | 'CASH';
export type PaymentStatus = 'UNPAID' | 'PARTIALLY_PAID' | 'PAID' | 'REFUNDED';
export type RentalStatus  = 'PENDING' | 'CONFIRMED' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED';

// ---- Request (gửi lên server) ----
export interface RentalRequest {
  customerName: string;
  customerPhone: string;
  customerAddress?: string;
  notes?: string;
  vehicleLicensePlate: string;
  rentalDate: string;
  returnDate: string;
  basePrice: number;          // Giá gốc trước VAT
  paymentMethod: PaymentMethod;
}

// ---- Response (server trả về) ----
export interface Rental {
  id?: number;
  customerName: string;
  customerPhone: string;
  customerAddress?: string;
  notes?: string;
  vehicleLicensePlate: string;
  rentalDate: string;
  returnDate: string;

  basePrice: number;
  vatAmount: number;
  totalPrice: number;
  depositAmount: number;
  remainingAmount: number;

  rentalCode?: string;
  rentalStatus?: RentalStatus;
  paymentMethod?: PaymentMethod;
  paymentStatus?: PaymentStatus;

  qrCodeUrl?: string;    // Có nếu BANK_TRANSFER

  createdAt?: string;
  depositPaidAt?: string;
}

@Injectable({
  providedIn: 'root'
})
export class RentalService {
  private readonly apiBaseUrl  = API_BASE_URL;
  private readonly rentalApiUrl = `${this.apiBaseUrl}/api/rentals`;

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

  getAllRentals(): Observable<Rental[]> {
    return this.http.get<Rental[]>(this.rentalApiUrl, this.getHeaders());
  }

  getRentalById(id: number): Observable<Rental> {
    return this.http.get<Rental>(`${this.rentalApiUrl}/${id}`, this.getHeaders());
  }

  createRental(rental: RentalRequest): Observable<Rental> {
    return this.http.post<Rental>(this.rentalApiUrl, rental, this.getHeaders());
  }

  updateRental(id: number, rental: Partial<Rental>): Observable<Rental> {
    return this.http.put<Rental>(`${this.rentalApiUrl}/${id}`, rental, this.getHeaders());
  }

  deleteRental(id: number): Observable<void> {
    return this.http.delete<void>(`${this.rentalApiUrl}/${id}`, this.getHeaders());
  }

  /** Admin: Xác nhận đã nhận cọc → PARTIALLY_PAID */
  confirmDeposit(id: number): Observable<Rental> {
    return this.http.patch<Rental>(`${this.rentalApiUrl}/${id}/confirm-deposit`, {}, this.getHeaders());
  }

  /** Admin: Xác nhận thanh toán đủ → PAID */
  confirmFullPayment(id: number): Observable<Rental> {
    return this.http.patch<Rental>(`${this.rentalApiUrl}/${id}/confirm-full-payment`, {}, this.getHeaders());
  }
}
