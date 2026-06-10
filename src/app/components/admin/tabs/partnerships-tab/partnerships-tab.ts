import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AdminStateService } from '../../../../services/admin-state';

@Component({
  selector: 'app-partnerships-tab',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './partnerships-tab.html'
})
export class PartnershipsTabComponent {
  constructor(public state: AdminStateService) {}

  getByStatus(status: string) {
    return this.state.partnerships().filter(p => p.status === status);
  }

  getCount(status: string) {
    return this.getByStatus(status).length;
  }

  onUpdateStatus(item: any, newStatus: string) {
    this.state.partnerships.update(list =>
      list.map(p => p.id === item.id ? { ...p, status: newStatus } : p)
    );
    this.state.showToast(`Đã chuyển đối tác sang cột: ${newStatus}`, 'success');
  }
}
