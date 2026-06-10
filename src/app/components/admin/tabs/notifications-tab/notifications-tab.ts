import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AdminStateService } from '../../../../services/admin-state';

@Component({
  selector: 'app-notifications-tab',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './notifications-tab.html'
})
export class NotificationsTabComponent {
  constructor(public state: AdminStateService) {}

  markAllRead() {
    this.state.notifications.update(list => list.map(n => ({ ...n, read: true })));
    this.state.showToast('Đã đánh dấu đọc tất cả thông báo', 'success');
  }
}
