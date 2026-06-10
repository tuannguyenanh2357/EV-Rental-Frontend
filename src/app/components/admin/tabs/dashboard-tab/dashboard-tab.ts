import { Component, ViewChild, ElementRef, OnInit, AfterViewInit, ChangeDetectorRef, Output, EventEmitter, Inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { AdminStateService } from '../../../../services/admin-state';
import { Chart } from 'chart.js/auto';

@Component({
  selector: 'app-dashboard-tab',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard-tab.html'
})
export class DashboardTabComponent implements AfterViewInit {
  @ViewChild('revenueChart') revenueChartCanvas!: ElementRef<HTMLCanvasElement>;
  @Output() tabChange = new EventEmitter<string>();
  @Output() vehicleClick = new EventEmitter<any>();

  chart: any = null;

  constructor(
    public state: AdminStateService, 
    private cdr: ChangeDetectorRef,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  ngAfterViewInit() {
    if (isPlatformBrowser(this.platformId)) {
      setTimeout(() => this.initChart(), 200);
    }
  }

  initChart() {
    if (!this.revenueChartCanvas) return;
    const ctx = this.revenueChartCanvas.nativeElement.getContext('2d');
    if (!ctx) return;
    if (this.chart) this.chart.destroy();

    const isDark = this.state.isDarkMode();
    const primaryColor = isDark ? '#3b82f6' : '#2563eb';
    const gridColor = isDark ? '#1f2937' : '#e2e8f0';

    const rentals = this.state.rentals();
    const revenueData = this.getWeeklyRevenueData(rentals);

    this.chart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'],
        datasets: [{
          label: 'Doanh thu tuần này (VNĐ)',
          data: revenueData,
          borderColor: primaryColor,
          backgroundColor: 'rgba(59, 130, 246, 0.08)',
          fill: true, tension: 0.4, borderWidth: 3,
          pointRadius: 4, pointBackgroundColor: primaryColor
        }]
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          y: { grid: { color: gridColor }, ticks: { callback: (val) => (Number(val) / 1000000) + 'M' } },
          x: { grid: { display: false } }
        }
      }
    });
  }

  getWeeklyRevenueData(rentals: any[]): number[] {
    const data = [0, 0, 0, 0, 0, 0, 0];
    if (!rentals?.length) return data;
    const today = new Date();
    const currentDay = today.getDay();
    const distanceToMonday = currentDay === 0 ? 6 : currentDay - 1;
    const monday = new Date(today);
    monday.setDate(today.getDate() - distanceToMonday);
    monday.setHours(0, 0, 0, 0);
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    sunday.setHours(23, 59, 59, 999);

    rentals.forEach(r => {
      const dateStr = r.rentalDate || r.createdAt;
      if (!dateStr) return;
      const rDate = new Date(dateStr);
      if (rDate >= monday && rDate <= sunday) {
        let dayIdx = rDate.getDay() - 1;
        if (dayIdx === -1) dayIdx = 6;
        data[dayIdx] += r.totalPrice || ((r.depositAmount || 0) + (r.remainingAmount || 0));
      }
    });
    return data;
  }

  goToNotifications() { this.tabChange.emit('notifications'); }
  goToVehicles() { this.tabChange.emit('vehicles'); }
  onVehicleClick(v: any) { this.vehicleClick.emit(v); }
}
