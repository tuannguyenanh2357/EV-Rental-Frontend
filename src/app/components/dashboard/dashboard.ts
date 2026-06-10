import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { RentalService, Rental } from '../../services/rental';
import { UserService } from '../../services/user';
import { VehicleService } from '../../services/vehicle';
import { Vehicle } from '../../models/vehicle';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css'
})
export class DashboardComponent implements OnInit {
  rentals: Rental[] = [];
  loading = true;

  isEditMode = false;
  editingUser: any = {};
  originalUser: any = null;

  selectedRental: Rental | null = null;
  selectedVehicle: Vehicle | null = null;
  showInvoiceModal = false;
  loadingInvoiceVehicle = false;

  userProfile = {
    name: 'Nguyễn Văn Anh',
    email: 'vananh.nguyen@example.com',
    phone: '0987654321',
    address: 'Cầu Giấy, Hà Nội',
    memberSince: '06/2026',
    status: 'Gold Member',
    avatarText: 'VA'
  };

  totalBookings = 0;
  totalSpent = 0;
  co2Saved = 0;

  constructor(
    private rentalService: RentalService,
    private userService: UserService,
    private vehicleService: VehicleService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadMyInfo();
    this.loadRentals();
  }

  loadMyInfo(): void {
    this.userService.getMyInfo().subscribe({
      next: (res) => {
        if (res && res.data) {
          const u = res.data;
          this.originalUser = u;
          this.userProfile.name = (u.firstname && u.lastname) ? `${u.lastname} ${u.firstname}` : (u.firstname || u.lastname || u.username);
          this.userProfile.email = u.email || 'Chưa cập nhật';
          this.userProfile.phone = u.phone || 'Chưa cập nhật';
          this.userProfile.address = u.address || 'Chưa cập nhật';
          this.userProfile.status = u.role === 'ADMIN' ? 'Admin Member' : 'Member';
          
          if (u.firstname && u.lastname) {
              this.userProfile.avatarText = (u.lastname.charAt(0) + u.firstname.charAt(0)).toUpperCase();
          } else if (u.firstname) {
              this.userProfile.avatarText = u.firstname.substring(0, 2).toUpperCase();
          } else if (u.username) {
              this.userProfile.avatarText = u.username.substring(0, 2).toUpperCase();
          }

          this.cdr.detectChanges();
        }
      },
      error: (err) => {
        console.error('Error loading user profile:', err);
      }
    });
  }

  loadRentals(): void {
    this.loading = true;
    this.rentalService.getAllRentals().subscribe({
      next: (data) => {
        if (data) {
          this.rentals = data;
          this.calculateMetrics();
        }
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error loading rentals for dashboard:', err);
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  calculateMetrics(): void {
    this.totalBookings = this.rentals.length;
    this.totalSpent = this.rentals.reduce((sum, rental) => sum + (rental.totalPrice || ((rental.depositAmount || 0) + (rental.remainingAmount || 0))), 0);
    this.co2Saved = this.totalBookings * 18.5;
  }

  cancelBooking(id?: number): void {
    if (!id) return;
    
    if (confirm('Bạn có chắc chắn muốn hủy yêu cầu đặt xe này không?')) {
      this.rentalService.deleteRental(id).subscribe({
        next: () => {
          alert('Đã hủy đơn đặt xe thành công.');
          this.loadRentals();
        },
        error: (err) => {
          console.error('Error deleting rental:', err);
          alert('Không thể hủy đơn. Vui lòng liên hệ hỗ trợ.');
        }
      });
    }
  }

  toggleEditMode(): void {
    if (!this.isEditMode) {
      this.editingUser = {
        firstname: this.originalUser?.firstname || '',
        lastname: this.originalUser?.lastname || '',
        phone: this.originalUser?.phone || '',
        address: this.originalUser?.address || '',
        avatar: this.originalUser?.avatar || ''
      };
      this.isEditMode = true;
    } else {
      this.isEditMode = false;
    }
  }

  saveProfile(): void {
    if (!this.originalUser?.id) return;
    
    const request = {
       username: this.originalUser.username,
       firstname: this.editingUser.firstname,
       lastname: this.editingUser.lastname,
       phone: this.editingUser.phone,
       address: this.editingUser.address,
       avatar: this.editingUser.avatar,
       email: this.originalUser.email,
       age: this.originalUser.age,
       role: this.originalUser.role
    };

    this.userService.updateUser(this.originalUser.id, request).subscribe({
      next: () => {
        alert('Cập nhật thông tin thành công!');
        this.isEditMode = false;
        this.loadMyInfo();
      },
      error: (err) => {
        console.error('Update failed', err);
        alert('Cập nhật thất bại. Kiểm tra console.');
      }
    });
  }

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.editingUser.avatar = e.target.result;
        this.cdr.detectChanges();
      };
      reader.readAsDataURL(file);
    }
  }

  getVehicleId(licensePlate: string): number | null {
    if (!licensePlate) return null;
    const parts = licensePlate.split('-');
    if (parts.length < 2) return null;
    let numStr = parts[1]; // e.g. "799" or "1"
    if (numStr.endsWith('99') && numStr.length > 2) {
      numStr = numStr.substring(0, numStr.length - 2);
    }
    const id = parseInt(numStr, 10);
    return isNaN(id) ? null : id;
  }

  viewInvoice(rental: Rental): void {
    this.selectedRental = rental;
    this.showInvoiceModal = true;
    this.selectedVehicle = null;
    
    const vehicleId = this.getVehicleId(rental.vehicleLicensePlate);
    if (vehicleId) {
      this.loadingInvoiceVehicle = true;
      this.vehicleService.getVehicleById(vehicleId).subscribe({
        next: (res) => {
          if (res && res.data) {
            this.selectedVehicle = res.data;
          }
          this.loadingInvoiceVehicle = false;
          this.cdr.detectChanges();
        },
        error: (err) => {
          console.error('Error loading vehicle for invoice:', err);
          this.loadingInvoiceVehicle = false;
          this.cdr.detectChanges();
        }
      });
    }
  }

  closeInvoice(): void {
    this.showInvoiceModal = false;
    this.selectedRental = null;
    this.selectedVehicle = null;
  }

  parseAddressDetails(address: string) {
    if (!address) return { address: 'Chưa cập nhật', payment: 'Chưa cập nhật', notes: 'Không có' };
    
    const match = address.match(/^(.*)\s*\[Thanh toán:\s*(.*?),\s*Ghi chú:\s*(.*?)\]$/);
    if (match) {
      return {
        address: match[1].trim(),
        payment: match[2].trim(),
        notes: match[3].trim()
      };
    }
    
    return {
      address: address,
      payment: 'Thanh toán trực tiếp',
      notes: 'Không có'
    };
  }

  windowPrint() {
    if (typeof window !== 'undefined') {
      window.print();
    }
  }

  getFirstImage(url: string | undefined | null): string {
    if (!url) return 'assets/placeholder.png';
    const urls = url.split(',');
    return urls[0].trim() || 'assets/placeholder.png';
  }
}
