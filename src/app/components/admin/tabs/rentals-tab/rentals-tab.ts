import { Component, OnInit, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminStateService } from '../../../../services/admin-state';

@Component({
  selector: 'app-rentals-tab',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './rentals-tab.html'
})
export class RentalsTabComponent implements OnInit {
  @Output() viewRental = new EventEmitter<any>();
  @Output() updateStatus = new EventEmitter<{ id: number; status: string }>();

  rentalSearch = '';
  rentalStatus = '';
  filteredRentals: any[] = [];

  constructor(public state: AdminStateService) {}

  ngOnInit() { this.filterRentals(); }

  filterRentals() {
    this.filteredRentals = this.state.rentals().filter(r => {
      const matchSearch = !this.rentalSearch ||
        r.customerName?.toLowerCase().includes(this.rentalSearch.toLowerCase()) ||
        r.customerPhone?.includes(this.rentalSearch) ||
        r.vehicleLicensePlate?.toLowerCase().includes(this.rentalSearch.toLowerCase());
      const matchStatus = !this.rentalStatus || r.rentalStatus === this.rentalStatus;
      return matchSearch && matchStatus;
    });
  }

  onViewRental(r: any) { this.viewRental.emit(r); }
  onUpdateStatus(id: number, status: string) { this.updateStatus.emit({ id, status }); }
}
