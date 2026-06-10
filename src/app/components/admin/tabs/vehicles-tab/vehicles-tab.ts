import { Component, OnInit, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminStateService } from '../../../../services/admin-state';

@Component({
  selector: 'app-vehicles-tab',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './vehicles-tab.html'
})
export class VehiclesTabComponent implements OnInit {
  @Output() addVehicle = new EventEmitter<void>();
  @Output() viewVehicle = new EventEmitter<any>();
  @Output() editVehicle = new EventEmitter<any>();
  @Output() deleteVehicle = new EventEmitter<any>();

  vehicleSearch = '';
  vehicleStatus = '';
  filteredVehicles: any[] = [];

  calendarDays: any[] = [];
  selectedCalendarMonth = '';

  constructor(public state: AdminStateService) {}

  ngOnInit() {
    this.filterVehicles();
    this.initCalendarData();
  }

  filterVehicles() {
    this.filteredVehicles = this.state.vehicles().filter(v => {
      const matchSearch = !this.vehicleSearch ||
        v.name?.toLowerCase().includes(this.vehicleSearch.toLowerCase()) ||
        v.brand?.toLowerCase().includes(this.vehicleSearch.toLowerCase()) ||
        (v.licensePlate && v.licensePlate.toLowerCase().includes(this.vehicleSearch.toLowerCase()));
      const matchStatus = !this.vehicleStatus || v.status === this.vehicleStatus;
      return matchSearch && matchStatus;
    });
  }

  initCalendarData() {
    this.calendarDays = [];
    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth();
    this.selectedCalendarMonth = `Tháng ${month + 1}, ${year}`;

    const firstDayOfMonth = new Date(year, month, 1);
    let startOffset = firstDayOfMonth.getDay() - 1;
    if (startOffset === -1) startOffset = 6;

    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const daysInPrevMonth = new Date(year, month, 0).getDate();

    for (let i = 0; i < startOffset; i++) {
      this.calendarDays.push({ dayNum: daysInPrevMonth - startOffset + i + 1, active: false, bookings: [] });
    }

    const rentals = this.state.rentals();
    const vehicles = this.state.vehicles();

    for (let d = 1; d <= daysInMonth; d++) {
      const currentDate = new Date(year, month, d);
      currentDate.setHours(0, 0, 0, 0);

      const dayBookings = rentals.filter(r => {
        if (!r.rentalDate || !r.returnDate) return false;
        if (r.rentalStatus === 'CANCELLED' || r.rentalStatus === 'REJECTED') return false;
        const start = new Date(r.rentalDate); start.setHours(0, 0, 0, 0);
        const end = new Date(r.returnDate); end.setHours(23, 59, 59, 999);
        return currentDate >= start && currentDate <= end;
      }).map(r => {
        const vehicle = vehicles.find(v =>
          v.licensePlate && r.vehicleLicensePlate &&
          v.licensePlate.toString().trim().toLowerCase() === r.vehicleLicensePlate.toString().trim().toLowerCase()
        );
        return {
          id: r.id,
          carName: vehicle ? vehicle.name : `Xe (${r.vehicleLicensePlate || 'Không rõ'})`,
          licensePlate: r.vehicleLicensePlate || 'N/A',
          vehicleImage: vehicle ? vehicle.imageUrl : null,
          customerName: r.customerName || 'Khách vãng lai'
        };
      });

      this.calendarDays.push({ dayNum: d, active: true, bookings: dayBookings, hasBooking: dayBookings.length > 0 });
    }
  }

  onAddVehicle() { this.addVehicle.emit(); }
  onViewVehicle(v: any) { this.viewVehicle.emit(v); }
  onEditVehicle(v: any) { this.editVehicle.emit(v); }
  onDeleteVehicle(v: any) { this.deleteVehicle.emit(v); }
}
