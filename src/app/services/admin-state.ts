import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class AdminStateService {
  // Shared data
  vehicles = signal<any[]>([]);
  rentals = signal<any[]>([]);
  users = signal<any[]>([]);

  // Stats
  totalVehicles = signal(0);
  todayRentalsCount = signal(0);
  pendingRentalsCount = signal(0);
  activeRentalsCount = signal(0);
  totalRevenue = signal(0);

  // Active tab
  activeTab = signal('dashboard');

  // Dark mode
  isDarkMode = signal(false);

  // Notifications
  notifications = signal<any[]>([
    { id: 1, title: 'Yêu cầu đặt xe mới', message: 'Khách hàng vừa tạo đơn đặt xe VF8 mới.', time: '5 phút trước', read: false, type: 'rental' },
    { id: 2, title: 'Bảo dưỡng xe định kỳ', message: 'Xe VF3 biển số 29A-123.45 cần được bảo dưỡng.', time: '1 giờ trước', read: false, type: 'warning' },
    { id: 3, title: 'Đăng ký đối tác mới', message: 'Yêu cầu ký gửi xe từ Lê Minh Hùng.', time: '2 giờ trước', read: true, type: 'partnership' },
    { id: 4, title: 'Hệ thống cập nhật', message: 'Đã cập nhật hệ thống bảo mật cổng thanh toán.', time: '1 ngày trước', read: true, type: 'system' }
  ]);

  activities = signal<any[]>([
    { id: 1, action: 'Xác nhận đơn đặt xe #1045', user: 'Admin Tuan', time: '10 phút trước', type: 'success' },
    { id: 2, action: 'Thêm mới xe VinFast VF7', user: 'Admin Tuan', time: '1 giờ trước', type: 'info' },
    { id: 3, action: 'Khoá tài khoản vi phạm', user: 'Admin Tuan', time: '3 giờ trước', type: 'danger' },
    { id: 4, action: 'Cập nhật trạng thái xe VF8 thành bảo dưỡng', user: 'Hệ thống', time: '5 giờ trước', type: 'warning' }
  ]);

  partnerships = signal<any[]>([
    { id: 1, title: 'VinFast VF9 Partner Request', owner: 'Lê Minh Hùng', phone: '0988776655', email: 'hung.le@gmail.com', status: 'NEW', date: '07/06/2026', details: 'Muốn ký gửi xe VF9 Plus đời 2025 màu đen.' },
    { id: 2, title: 'Tesla Model Y Lease', owner: 'Phan Hoàng Nam', phone: '0909112233', email: 'nam.phan@yahoo.com', status: 'REVIEWING', date: '06/06/2026', details: 'Yêu cầu thẩm định giá thuê xe Tesla Model Y Long Range.' },
    { id: 3, title: 'Wuling Bingo Partnership', owner: 'Trần Thị Thuỷ', phone: '0915443322', email: 'thuy.tran@outlook.com', status: 'COMPLETED', date: '05/06/2026', details: 'Ký gửi 2 xe Bingo sạc chậm khu vực Quận 7, TP.HCM.' }
  ]);

  // Toasts
  toasts = signal<any[]>([]);

  showToast(message: string, type: 'success' | 'error' | 'info' = 'success') {
    const id = Date.now();
    this.toasts.update(t => [...t, { id, message, type }]);
    setTimeout(() => {
      this.toasts.update(t => t.filter(x => x.id !== id));
    }, 4000);
  }

  unreadNotificationsCount(): number {
    return this.notifications().filter(n => !n.read).length;
  }

  getFirstImage(url: string | undefined | null): string {
    const defaultPlaceholder = 'https://placehold.co/400x300?text=No+Image';
    if (!url) return defaultPlaceholder;
    const urls = url.split(',');
    return urls[0].trim() || defaultPlaceholder;
  }
}
