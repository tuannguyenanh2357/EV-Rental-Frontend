import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { VehicleService } from '../../services/vehicle';
import { RentalService, Rental, RentalRequest, PaymentMethod } from '../../services/rental';
import { Vehicle } from '../../models/vehicle';

@Component({
  selector: 'app-booking',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './booking.html',
  styleUrl: './booking.css'
})
export class BookingComponent implements OnInit {
  vehicleId!: number;
  vehicle?: Vehicle;
  loading = true;
  submitting = false;

  /** Bước hiện tại: 1=Thông tin, 2=Xác nhận, 3=Thành công */
  currentStep = 1;

  // Query params từ vehicle-detail
  rentalDate  = '';
  returnDate  = '';
  totalPrice  = 0;  // đây là basePrice từ vehicle-detail

  // Form khách hàng
  customerName    = '';
  customerPhone   = '';
  customerAddress = '';
  customerNotes   = '';

  // Phương thức cọc: chỉ 2 lựa chọn
  paymentMethod: PaymentMethod = 'BANK_TRANSFER';

  // Đơn thuê đã tạo (trả về từ server, có qrCodeUrl nếu BANK_TRANSFER)
  createdRental?: Rental;

  // ────── Tính toán giá (hiển thị) ──────

  get basePrice(): number    { return this.totalPrice; }
  get vatAmount(): number    { return Math.round(this.basePrice * 0.08); }
  get finalPrice(): number   { return this.basePrice + this.vatAmount; }
  get depositAmount(): number { return Math.round(this.finalPrice * 0.20); }
  get remainingAmount(): number { return this.finalPrice - this.depositAmount; }

  getPaymentMethodLabel(): string {
    return this.paymentMethod === 'BANK_TRANSFER'
      ? 'Chuyển khoản ngân hàng (MB Bank)'
      : 'Tiền mặt tại văn phòng';
  }

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private vehicleService: VehicleService,
    private rentalService: RentalService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    const idParam = this.route.snapshot.paramMap.get('id');
    if (idParam) this.vehicleId = +idParam;

    this.route.queryParams.subscribe(params => {
      this.rentalDate = params['rentalDate'] || '';
      this.returnDate = params['returnDate'] || '';
      this.totalPrice = +params['totalPrice'] || 0;
    });

    this.loadVehicle();
  }

  loadVehicle(): void {
    this.loading = true;
    this.vehicleService.getVehicleById(this.vehicleId).subscribe({
      next: (res) => {
        this.vehicle = res?.data;
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  nextStep(): void {
    if (this.currentStep === 1) {
      if (!this.customerName.trim() || !this.customerPhone.trim()) {
        alert('Vui lòng điền đầy đủ họ tên và số điện thoại.');
        return;
      }
    }
    this.currentStep++;
  }

  prevStep(): void {
    if (this.currentStep > 1) this.currentStep--;
  }

  submitBooking(): void {
    if (!this.vehicle) return;
    this.submitting = true;

    const licensePlate = this.vehicle.licensePlate || `${this.vehicle.brand?.substring(0, 2).toUpperCase() || 'EV'}-${this.vehicle.id}99`;

    const payload: RentalRequest = {
      customerName:        this.customerName,
      customerPhone:       this.customerPhone,
      customerAddress:     this.customerAddress || 'Nhận tại văn phòng',
      notes:               this.customerNotes.trim() || undefined,
      vehicleLicensePlate: licensePlate,
      rentalDate:          this.rentalDate,
      returnDate:          this.returnDate,
      basePrice:           this.basePrice,   // Server sẽ tự tính VAT + deposit
      paymentMethod:       this.paymentMethod
    };

    this.rentalService.createRental(payload).subscribe({
      next: (res) => {
        this.createdRental = res;
        this.currentStep   = 3;
        this.submitting    = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Lỗi tạo đơn:', err);
        alert('Có lỗi xảy ra khi đặt xe. Vui lòng thử lại.');
        this.submitting = false;
        this.cdr.detectChanges();
      }
    });
  }
}
