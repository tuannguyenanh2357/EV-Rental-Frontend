import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { VehicleService } from '../../services/vehicle';
import { Vehicle } from '../../models/vehicle';
import { RentalService, Rental } from '../../services/rental';

@Component({
  selector: 'app-vehicle-list',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './vehicle-list.html',
  styleUrl: './vehicle-list.css'
})
export class VehicleListComponent implements OnInit {
  vehicles: Vehicle[] = [];
  filteredVehicles: Vehicle[] = [];
  rentals: Rental[] = [];
  loading = true;

  // Filter bindings
  searchQuery = '';
  selectedBrand = 'ALL';
  selectedStatus = 'ALL';
  selectedChargeType = 'ALL';
  selectedDate = '';
  maxPrice = 10000000;
  
  brands: string[] = [];
  chargeTypes: string[] = [];

  // Pagination
  currentPage = 1;
  itemsPerPage = 9;

  get paginatedVehicles(): Vehicle[] {
    const start = (this.currentPage - 1) * this.itemsPerPage;
    return this.filteredVehicles.slice(start, start + this.itemsPerPage);
  }

  get totalPages(): number {
    return Math.ceil(this.filteredVehicles.length / this.itemsPerPage);
  }

  get pages(): number[] {
    return Array.from({ length: this.totalPages }, (_, i) => i + 1);
  }

  changePage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  constructor(
    private vehicleService: VehicleService,
    private rentalService: RentalService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadVehicles();
    this.loadRentals();
  }

  loadRentals(): void {
    this.rentalService.getAllRentals().subscribe({
      next: (data) => {
        this.rentals = data || [];
        this.applyFilters();
      },
      error: (err) => console.error('Error fetching rentals:', err)
    });
  }

  loadVehicles(): void {
    this.loading = true;
    this.vehicleService.getVehicles().subscribe({
      next: (response) => {
        if (response && response.data) {
          this.vehicles = response.data;
          this.extractBrands();
          this.applyFilters();
        }
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error fetching vehicles:', err);
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  extractBrands(): void {
    const brandSet = new Set<string>();
    const chargeTypeSet = new Set<string>();
    this.vehicles.forEach(v => {
      if (v.brand) brandSet.add(v.brand);
      if (v.chargeType) chargeTypeSet.add(v.chargeType);
    });
    this.brands = Array.from(brandSet);
    this.chargeTypes = Array.from(chargeTypeSet);
  }

  applyFilters(): void {
    this.filteredVehicles = this.vehicles.filter(car => {
      // 1. Search Query
      const query = this.searchQuery.toLowerCase().trim();
      const matchesSearch = !query || 
        car.name.toLowerCase().includes(query) ||
        (car.brand && car.brand.toLowerCase().includes(query)) ||
        (car.model && car.model.toLowerCase().includes(query)) ||
        (car.location && car.location.toLowerCase().includes(query));

      // 2. Brand
      const matchesBrand = this.selectedBrand === 'ALL' || car.brand === this.selectedBrand;

      // 3. Status Filter (override based on selectedDate)
      let currentStatus = car.status;
      
      if (this.selectedDate) {
        const targetDate = new Date(this.selectedDate);
        targetDate.setHours(0, 0, 0, 0);

        const fabricatedLicensePlate = `${car.brand?.substring(0, 2).toUpperCase() || 'EV'}-${car.id}99`;

        const isRented = this.rentals.some(r => {
          const matchPlate = r.vehicleLicensePlate === car.licensePlate || r.vehicleLicensePlate === fabricatedLicensePlate;
          if (matchPlate && r.rentalStatus !== 'CANCELLED' && r.rentalStatus !== 'COMPLETED') {
            const start = new Date(r.rentalDate); start.setHours(0, 0, 0, 0);
            const end = new Date(r.returnDate); end.setHours(23, 59, 59, 999);
            return targetDate >= start && targetDate <= end;
          }
          return false;
        });

        if (isRented) {
          currentStatus = 'RENTED';
        } else if (car.status !== 'MAINTENANCE') {
          currentStatus = 'AVAILABLE';
        }
      } else {
        // Nếu chưa chọn ngày, mặc định coi là CÓ SẴN (trừ khi đang BẢO TRÌ)
        if (car.status !== 'MAINTENANCE') {
          currentStatus = 'AVAILABLE';
        }
      }

      const matchesStatus = this.selectedStatus === 'ALL' || currentStatus === this.selectedStatus;

      // 4. Charge Type
      const matchesChargeType = this.selectedChargeType === 'ALL' || car.chargeType === this.selectedChargeType;

      // 5. Price
      const matchesPrice = car.pricePerDay <= this.maxPrice;

      return matchesSearch && matchesBrand && matchesStatus && matchesChargeType && matchesPrice;
    }).map(car => {
      // Create a shallow copy with overridden status for UI
      let currentStatus = car.status;
      
      if (this.selectedDate) {
        const targetDate = new Date(this.selectedDate);
        targetDate.setHours(0, 0, 0, 0);

        const fabricatedLicensePlate = `${car.brand?.substring(0, 2).toUpperCase() || 'EV'}-${car.id}99`;

        const isRented = this.rentals.some(r => {
          const matchPlate = r.vehicleLicensePlate === car.licensePlate || r.vehicleLicensePlate === fabricatedLicensePlate;
          if (matchPlate && r.rentalStatus !== 'CANCELLED' && r.rentalStatus !== 'COMPLETED') {
            const start = new Date(r.rentalDate); start.setHours(0, 0, 0, 0);
            const end = new Date(r.returnDate); end.setHours(23, 59, 59, 999);
            return targetDate >= start && targetDate <= end;
          }
          return false;
        });

        if (isRented) {
          currentStatus = 'RENTED';
        } else if (car.status !== 'MAINTENANCE') {
          currentStatus = 'AVAILABLE';
        }
      } else {
        // Nếu chưa chọn ngày, mặc định coi là CÓ SẴN (trừ khi đang BẢO TRÌ)
        if (car.status !== 'MAINTENANCE') {
          currentStatus = 'AVAILABLE';
        }
      }
      
      return { ...car, status: currentStatus as any };
    });
    this.currentPage = 1;
  }

  resetFilters(): void {
    this.searchQuery = '';
    this.selectedBrand = 'ALL';
    this.selectedStatus = 'ALL';
    this.selectedChargeType = 'ALL';
    this.selectedDate = '';
    this.maxPrice = 10000000;
    this.applyFilters();
  }

  getFirstImage(url: string | undefined | null): string {
    if (!url) return 'assets/placeholder.png';
    const urls = url.split(',');
    return urls[0].trim() || 'assets/placeholder.png';
  }
}
