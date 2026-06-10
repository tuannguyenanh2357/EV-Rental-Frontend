import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { VehicleService } from '../../services/vehicle';
import { Vehicle } from '../../models/vehicle';
import { RentalService, Rental } from '../../services/rental';

@Component({
  selector: 'app-vehicle-detail',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './vehicle-detail.html',
  styleUrl: './vehicle-detail.css'
})
export class VehicleDetailComponent implements OnInit {
  vehicleId!: number;
  vehicle?: Vehicle;
  loading = true;

  // Image Gallery
  imageUrls: string[] = [];
  currentImageIndex = 0;

  // Booking widget state
  rentalDate = '';
  returnDate = '';
  totalDays = 0;
  totalPrice = 0;
  
  rentals: Rental[] = [];
  isAvailableForSelectedDates = true;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private vehicleService: VehicleService,
    private rentalService: RentalService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    const idParam = this.route.snapshot.paramMap.get('id');
    if (idParam) {
      this.vehicleId = +idParam;
      this.loadVehicleDetails();
      this.loadRentals();
    }
  }

  loadRentals(): void {
    this.rentalService.getAllRentals().subscribe({
      next: (data) => {
        this.rentals = data || [];
        this.checkAvailability();
      },
      error: (err) => console.error('Error fetching rentals:', err)
    });
  }

  loadVehicleDetails(): void {
    this.loading = true;
    this.vehicleService.getVehicleById(this.vehicleId).subscribe({
      next: (response) => {
        if (response && response.data) {
          this.vehicle = response.data;
          if (this.vehicle.imageUrl) {
            this.imageUrls = this.vehicle.imageUrl.split(',').map(u => u.trim()).filter(u => u);
          } else {
            this.imageUrls = [];
          }
          this.calculatePrice();
        }
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error loading vehicle details:', err);
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  calculatePrice(): void {
    if (!this.vehicle || !this.rentalDate || !this.returnDate) {
      this.totalDays = 0;
      this.totalPrice = 0;
      return;
    }

    const start = new Date(this.rentalDate);
    const end = new Date(this.returnDate);
    
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      this.totalDays = 0;
      this.totalPrice = 0;
      this.isAvailableForSelectedDates = true;
      return;
    }

    this.checkAvailability();

    const diffTime = end.getTime() - start.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    this.totalDays = diffDays > 0 ? diffDays : 0;
    
    if (this.totalDays > 0) {
      const pricePerDay = this.vehicle.pricePerDay;
      if (this.totalDays >= 7 && this.vehicle.pricePerWeek) {
        const weeks = Math.floor(this.totalDays / 7);
        const remDays = this.totalDays % 7;
        this.totalPrice = (weeks * Number(this.vehicle.pricePerWeek)) + (remDays * Number(pricePerDay));
      } else {
        this.totalPrice = this.totalDays * Number(pricePerDay);
      }
    } else {
      this.totalPrice = 0;
    }
  }

  checkAvailability(): void {
    if (!this.vehicle || !this.rentalDate || !this.returnDate) {
      this.isAvailableForSelectedDates = true;
      return;
    }
    const start = new Date(this.rentalDate); start.setHours(0, 0, 0, 0);
    const end = new Date(this.returnDate); end.setHours(23, 59, 59, 999);
    
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      this.isAvailableForSelectedDates = true;
      return;
    }

    const fabricatedLicensePlate = `${this.vehicle.brand?.substring(0, 2).toUpperCase() || 'EV'}-${this.vehicle.id}99`;

    const isRented = this.rentals.some(r => {
      const matchPlate = r.vehicleLicensePlate === this.vehicle!.licensePlate || r.vehicleLicensePlate === fabricatedLicensePlate;
      if (matchPlate && r.rentalStatus !== 'CANCELLED' && r.rentalStatus !== 'COMPLETED') {
        const rStart = new Date(r.rentalDate); rStart.setHours(0, 0, 0, 0);
        const rEnd = new Date(r.returnDate); rEnd.setHours(23, 59, 59, 999);
        return start <= rEnd && end >= rStart;
      }
      return false;
    });

    this.isAvailableForSelectedDates = !isRented;
  }

  proceedToBooking(): void {
    if (this.totalDays <= 0 || !this.vehicle) {
      alert('Vui lòng chọn ngày nhận và ngày trả xe hợp lệ.');
      return;
    }
    
    this.router.navigate(['/booking', this.vehicleId], {
      queryParams: {
        rentalDate: this.rentalDate,
        returnDate: this.returnDate,
        totalPrice: this.totalPrice
      }
    });
  }

  nextImage(event: Event) {
    event.stopPropagation();
    if (this.imageUrls.length > 0) {
      this.currentImageIndex = (this.currentImageIndex + 1) % this.imageUrls.length;
    }
  }

  prevImage(event: Event) {
    event.stopPropagation();
    if (this.imageUrls.length > 0) {
      this.currentImageIndex = (this.currentImageIndex - 1 + this.imageUrls.length) % this.imageUrls.length;
    }
  }
}
