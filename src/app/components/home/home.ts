import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { VehicleService } from '../../services/vehicle';
import { UserService } from '../../services/user';
import { Vehicle } from '../../models/vehicle';
import { MapComponent } from '../map/map';

interface FeaturedCar {
  id?: number;
  name: string;
  brand: string;
  year: number;
  status: 'available' | 'booked' | 'maintenance';
  statusLabel: string;
  batteryKwh: number;
  rangeKm: number;
  chargeType: string;
  pricePerDay: string;
  imageUrl?: string;
}

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule, MapComponent],
  templateUrl: './home.html',
  styleUrl: './home.css'
})
export class HomeComponent implements OnInit {
  featuredCars: FeaturedCar[] = [];

  // Pagination
  currentPage = 1;
  itemsPerPage = 6;

  get paginatedFeaturedCars(): FeaturedCar[] {
    const start = (this.currentPage - 1) * this.itemsPerPage;
    return this.featuredCars.slice(start, start + this.itemsPerPage);
  }

  get totalPages(): number {
    return Math.ceil(this.featuredCars.length / this.itemsPerPage);
  }

  get pages(): number[] {
    return Array.from({ length: this.totalPages }, (_, i) => i + 1);
  }

  changePage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      const catalog = document.getElementById('catalog');
      if (catalog) {
        catalog.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  }

  userAvatar: string | null = null;
  userInitials: string = 'U';

  constructor(private vehicleService: VehicleService, private userService: UserService, private cdr: ChangeDetectorRef) {
    this.userInitials = this.getUserInitials();
  }

  ngOnInit(): void {
    console.log('HomeComponent initialized, loading vehicles...');
    this.loadFeaturedCars();
    if (this.isLoggedIn()) {
      this.loadUserInfo();
    }
  }

  loadUserInfo(): void {
    this.userService.getMyInfo().subscribe({
      next: (res) => {
        if (res && res.data) {
          const u = res.data;
          if (u.avatar) {
            this.userAvatar = u.avatar;
          } else {
            if (u.firstname && u.lastname) {
                this.userInitials = (u.lastname.charAt(0) + u.firstname.charAt(0)).toUpperCase();
            } else if (u.firstname) {
                this.userInitials = u.firstname.substring(0, 2).toUpperCase();
            } else if (u.username) {
                this.userInitials = u.username.substring(0, 2).toUpperCase();
            }
          }
          this.cdr.detectChanges();
        }
      },
      error: () => {}
    });
  }

  loadFeaturedCars(): void {
    this.vehicleService.getVehicles().subscribe({
      next: (response) => {
        console.log('API response received:', response);
        if (response && response.data) {
          this.featuredCars = response.data.map(car => ({
            id: car.id,
            name: car.name,
            brand: car.brand,
            year: car.year,
            status: car.status === 'MAINTENANCE' ? 'maintenance' : 'available',
            statusLabel: car.status === 'MAINTENANCE' ? 'Bảo trì' : 'Có sẵn',
            batteryKwh: car.batteryKwh,
            rangeKm: car.rangeKm,
            chargeType: car.chargeType,
            pricePerDay: this.formatPrice(car.pricePerDay),
            imageUrl: car.imageUrl
          }));
          console.log('Mapped featuredCars:', this.featuredCars);
          this.cdr.detectChanges();
        } else {
          console.warn('API returned response but data is missing, using fallback data');
          this.useFallbackData();
          this.cdr.detectChanges();
        }
      },
      error: (error) => {
        console.error('Failed to load vehicles from API, using fallback mock data:', error);
        this.useFallbackData();
        this.cdr.detectChanges();
      }
    });
  }

  formatPrice(price: number): string {
    const formatted = price.toLocaleString('vi-VN').replace(/,/g, '.');
    return `${formatted}đ/ngày`;
  }

  useFallbackData(): void {
    this.featuredCars = [
      {
        id: 1,
        name: 'VF 8 Plus',
        brand: 'VinFast',
        year: 2024,
        status: 'available',
        statusLabel: 'Có sẵn',
        batteryKwh: 82,
        rangeKm: 420,
        chargeType: 'DC Fast',
        pricePerDay: '350.000đ/ngày'
      },
      {
        id: 2,
        name: 'Model 3 Standard',
        brand: 'Tesla',
        year: 2023,
        status: 'available',
        statusLabel: 'Có sẵn',
        batteryKwh: 60,
        rangeKm: 358,
        chargeType: 'Supercharger',
        pricePerDay: '500.000đ/ngày'
      },
      {
        id: 3,
        name: 'Atto 3 Premium',
        brand: 'BYD',
        year: 2024,
        status: 'available',
        statusLabel: 'Có sẵn',
        batteryKwh: 60.5,
        rangeKm: 480,
        chargeType: 'AC+DC',
        pricePerDay: '420.000đ/ngày'
      }
    ];
  }

  // Admin form controls
  showAddModal = false;
  imageInputType: 'url' | 'file' = 'url';
  imageUrlInput = '';
  uploadingImage = false;
  uploadError = '';

  newVehicle: Partial<Vehicle> = {
    name: '',
    brand: '',
    model: '',
    color: 'Đen',
    year: 2026,
    batteryKwh: 82,
    rangeKm: 450,
    chargeType: 'FastCharge',
    pricePerHour: 100000,
    pricePerDay: 800000,
    pricePerWeek: 5000000,
    location: 'Hà Nội',
    status: 'AVAILABLE',
    isVisible: true,
    description: ''
  };

  openAddModal(): void {
    this.showAddModal = true;
    this.imageUrlInput = '';
    this.uploadError = '';
    this.newVehicle = {
      name: '',
      brand: '',
      model: '',
      color: 'Đen',
      year: 2026,
      batteryKwh: 82,
      rangeKm: 450,
      chargeType: 'FastCharge',
      pricePerHour: 100000,
      pricePerDay: 800000,
      pricePerWeek: 5000000,
      location: 'Hà Nội',
      status: 'AVAILABLE',
      isVisible: true,
      description: ''
    };
  }

  closeAddModal(): void {
    this.showAddModal = false;
  }

  onFileSelected(event: any): void {
    const file: File = event.target.files[0];
    if (file) {
      this.uploadingImage = true;
      this.uploadError = '';
      this.vehicleService.uploadImage(file).subscribe({
        next: (response) => {
          if (response && response.data) {
            this.imageUrlInput = response.data;
            this.newVehicle.imageUrl = response.data;
            this.cdr.detectChanges();
          } else {
            this.uploadError = 'Upload thất bại, không có URL trả về';
          }
          this.uploadingImage = false;
          this.cdr.detectChanges();
        },
        error: (error) => {
          console.error('Lỗi upload ảnh:', error);
          this.uploadError = 'Upload thất bại: ' + (error.message || 'Lỗi kết nối');
          this.uploadingImage = false;
          this.cdr.detectChanges();
        }
      });
    }
  }

  saveVehicle(): void {
    if (this.imageInputType === 'url') {
      this.newVehicle.imageUrl = this.imageUrlInput;
    }
    
    this.vehicleService.createVehicle(this.newVehicle).subscribe({
      next: (response) => {
        console.log('Thêm xe thành công:', response);
        this.closeAddModal();
        this.loadFeaturedCars();
      },
      error: (error) => {
        console.error('Thêm xe thất bại:', error);
        alert('Lỗi thêm xe: ' + (error.error?.message || error.message));
      }
    });
  }

  isLoggedIn(): boolean {
    if (typeof window !== 'undefined') {
      return !!localStorage.getItem('accessToken');
    }
    return false;
  }

  isAdmin(): boolean {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('accessToken');
      if (token) {
        try {
          const payload = JSON.parse(atob(token.split('.')[1]));
          return payload.scope === 'ADMIN' || payload.scope === 'ROLE_ADMIN';
        } catch (e) {
          return false;
        }
      }
    }
    return false;
  }

  getUserInitials(): string {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('accessToken');
      if (token) {
        try {
          const payload = JSON.parse(atob(token.split('.')[1]));
          const identifier = payload.sub || payload.username || 'User';
          return identifier.charAt(0).toUpperCase();
        } catch (e) {
          return 'U';
        }
      }
    }
    return 'U';
  }

  getFirstImage(url: string | undefined | null): string {
    if (!url) return 'assets/placeholder.png';
    const urls = url.split(',');
    return urls[0].trim() || 'assets/placeholder.png';
  }
}
